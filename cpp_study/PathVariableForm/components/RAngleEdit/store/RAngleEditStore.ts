import { ref, type Ref } from "vue";
import { ExpressionUtil } from "@/three/src/interface/modelEditor/util/ExpressionUtil";
import type { TProjectionInfo } from "@/three/src/object/bim/variable/contour/type";
import { CircleTemplateHandler } from "../handler/CircleTemplateHandler";
import { RectTemplateHandler } from "../handler/RectTemplateHandler";
import type { IRAngleTemplateHandler } from "../handler/IRAngleTemplateHandler";
import type { RAngleCornerInfo, RAngleTemplateOption, RAngleTemplateType } from "../types";

/** 外层 PathVariableForm 传入的编辑对象，Store 只依赖基础字段。 */
interface RAngleEditModel {
  name?: string;
  refName?: string;
  contourInfo?: any;
}

/** RAngleEdit 会话协调器，负责模板切换、外层数据和 Handler 调度。 */
export class RAngleEditStore {
  /** 外层变量对象，确认时需要同步名称和 contourInfo。 */
  private readonly modelValue: RAngleEditModel | undefined;
  /** 进入编辑前的原始数据，取消时用于恢复。 */
  private readonly originalContourInfo: unknown;
  private readonly originalName: string;
  private readonly originalRefName: string;

  /** 各模板的独立 Handler，模板专属逻辑不堆积在 Store 中。 */
  private readonly rectHandler = new RectTemplateHandler();
  private readonly circleHandler = new CircleTemplateHandler();
  /** 模板注册表，Store 通过类型查找 Handler，不为每个模板增加切换分支。 */
  private readonly templateHandlerMap: Partial<Record<RAngleTemplateType, IRAngleTemplateHandler>> = {
    rect: this.rectHandler,
    circle: this.circleHandler,
  };
  private currentHandler: IRAngleTemplateHandler | null = null;

  /** 变量基础信息的响应式编辑状态。 */
  public readonly name: Ref<string> = ref("");
  public readonly refName: Ref<string> = ref("");
  public readonly addOrSave: Ref<boolean> = ref(true);

  /** 模板选择器配置，未实现模板也保留选项以支持后续扩展。 */
  public readonly templateOptions: readonly RAngleTemplateOption[] = [
    { value: "rect", label: "矩形模板" },
    { value: "circle", label: "圆形模板" },
    { value: "l-shape", label: "L 型模板" },
    { value: "trapezoid", label: "梯形模板" },
    { value: "bevel", label: "斜切边模板" },
  ];

  /** 当前激活的模板类型。 */
  public readonly templateType: Ref<RAngleTemplateType> = ref("rect");
  /** 模板更新版本，用于领域对象修改后通知 UI 重新读取 getter。 */
  private readonly templateUpdateVersion: Ref<number> = ref(0);
  /** 当前模板生成的预览线段，供外层预览组件消费。 */
  public readonly previewSegments: Ref<unknown[]> = ref([]);
  /** 当前真实模板对象，占位模板返回 null。 */
  public constructor(modelValue?: RAngleEditModel, addOrSave = true) {
    this.modelValue = modelValue;
    this.originalContourInfo = modelValue?.contourInfo;
    this.originalName = String(modelValue?.name ?? "");
    this.originalRefName = String(modelValue?.refName ?? "");
    this.addOrSave.value = addOrSave;
    this.loadModel(modelValue);
  }

  /** 从外层模型恢复变量信息和当前模板草稿。 */
  public loadModel(modelValue?: RAngleEditModel): void {
    this.name.value = String(modelValue?.name ?? "");
    this.refName.value = String(modelValue?.refName ?? "");
    const contourInfo = modelValue?.contourInfo;

    if (this.isCircleContour(contourInfo)) {
      this.templateType.value = "circle";
      this.circleHandler.loadTemplateData(this.cloneJson(contourInfo));
      this.currentHandler = this.circleHandler;
    } else {
      this.templateType.value = "rect";
      if (contourInfo?.params) this.rectHandler.loadTemplateData(this.cloneJson(contourInfo));
      else this.rectHandler.initialize();
      this.currentHandler = this.rectHandler;
    }

    this.markTemplateUpdated();
    this.rebuildPreview();
  }

  /** 切换模板并调度对应 Handler；未实现模板只显示占位，不覆盖外层数据。 */
  public switchTemplate(templateType: RAngleTemplateType): void {
    this.templateType.value = templateType;
    this.currentHandler = this.getHandler(templateType);
    // 切换到已实现模板时先生成默认轮廓，避免 UI 有参数但右侧预览仍为空。
    this.currentHandler?.activate();
    this.markTemplateUpdated();
    this.rebuildPreview();
  }

  /** 读取当前矩形或圆形模板使用的投影面，历史数据默认按 XZ 处理。 */
  public getProjection(): TProjectionInfo {
    // 领域模板是普通 class 实例，依赖 Store 版本号让 UI computed 能感知参数更新。
    this.templateUpdateVersion.value;
    return this.currentHandler?.getProjection() ?? "XZ";
  }

  /** 更新当前模板投影面并重建对应的三维轮廓和预览线段。 */
  public updateProjection(value: TProjectionInfo): void {
    if (!this.currentHandler) return;
    this.currentHandler.updateProjection(value);
    this.markTemplateUpdated();
    this.rebuildPreview();
  }

  /** 更新变量名称，仅修改当前编辑会话草稿。 */
  public updateName(value: string): void {
    this.name.value = value;
  }

  /** 更新变量引用名称，仅修改当前编辑会话草稿。 */
  public updateRefName(value: string): void {
    this.refName.value = value;
  }

  /** 读取矩形宽度表达式。 */
  public getRectTemplateW(): string {
    // Handler 内部是普通 class，读取版本号才能让 Vue computed 感知宽度表达式已更新。
    this.templateUpdateVersion.value;
    return this.rectHandler.getWidth();
  }

  /** 读取矩形宽度表达式的当前计算值。 */
  public getRectTemplateWValue(): number {
    this.templateUpdateVersion.value;
    return this.calculateExpression(this.getRectTemplateW());
  }

  /** 更新矩形宽度，由矩形 Handler 负责领域修改。 */
  public updateRectTemplateW(value: string | number): void {
    this.rectHandler.updateWidth(value);
    this.markTemplateUpdated();
    this.rebuildPreview();
  }

  /** 读取矩形深度表达式。 */
  public getRectTemplateD(): string {
    // 与宽度保持一致，确保深度表达式更新后同步刷新编辑器输入值。
    this.templateUpdateVersion.value;
    return this.rectHandler.getDepth();
  }

  /** 读取矩形深度表达式的当前计算值。 */
  public getRectTemplateDValue(): number {
    this.templateUpdateVersion.value;
    return this.calculateExpression(this.getRectTemplateD());
  }

  /** 更新矩形深度，由矩形 Handler 负责领域修改。 */
  public updateRectTemplateD(value: string | number): void {
    this.rectHandler.updateDepth(value);
    this.markTemplateUpdated();
    this.rebuildPreview();
  }

  /** 读取矩形角点展示数据。 */
  public getRectTemplateCornerInfos(): RAngleCornerInfo[] {
    this.templateUpdateVersion.value;
    return this.rectHandler.getCornerInfos();
  }

  /** 根据角点临时草稿计算圆角分段数，不修改当前 Store 草稿。 */
  public getRectCornerSegmentCount(index: number, corner: RAngleCornerInfo): number {
    this.templateUpdateVersion.value;
    return this.rectHandler.getCornerSegmentCount(index, corner);
  }

  /** 更新矩形角点，由矩形 Handler 负责角点转换和领域修改。 */
  public updateRectTemplateCorner(index: number, corner: RAngleCornerInfo): void {
    this.rectHandler.updateCorner(index, corner);
    this.markTemplateUpdated();
    this.rebuildPreview();
  }

  /** 读取圆形半径表达式。 */
  public getCircleTemplateR(): string {
    this.templateUpdateVersion.value;
    return this.circleHandler.getRadius();
  }

  /** 读取圆形半径表达式的当前计算值。 */
  public getCircleTemplateRValue(): number {
    this.templateUpdateVersion.value;
    return this.calculateExpression(this.getCircleTemplateR());
  }

  /** 读取圆形分段数计算值。 */
  public getCircleTemplateArcSegmentValue(): number {
    this.templateUpdateVersion.value;
    return this.circleHandler.getArcSegmentValue();
  }

  /** 更新圆形半径，由圆形 Handler 负责领域修改。 */
  public updateCircleTemplateR(value: string | number): void {
    this.circleHandler.updateRadius(value);
    this.markTemplateUpdated();
    this.rebuildPreview();
  }

  /** 重新读取变量上下文，刷新表达式 getter 和外部预览。 */
  public refreshExpressionValues(): void {
    this.markTemplateUpdated();
    this.rebuildPreview();
  }

  /** 确认当前模板和变量基础信息，保留既有外层保存链路。 */
  public commit(): void {
    if (!this.modelValue) return;
    this.modelValue.name = this.name.value;
    this.modelValue.refName = this.refName.value;
    this.currentHandler?.commitTo(this.modelValue);
  }

  /** 取消编辑并恢复进入编辑前的外层数据。 */
  public cancel(): void {
    if (!this.modelValue) return;
    this.modelValue.name = this.originalName;
    this.modelValue.refName = this.originalRefName;
    this.modelValue.contourInfo = this.originalContourInfo;
  }

  /** 获取已实现模板的 Handler，未实现模板返回空值。 */
  private getHandler(templateType: RAngleTemplateType): IRAngleTemplateHandler | null {
    return this.templateHandlerMap[templateType] ?? null;
  }

  /** 使用当前 Handler 生成外部预览线段。 */
  private rebuildPreview(): void {
    this.previewSegments.value = this.currentHandler?.getSegments() ?? [];
  }

  /** 判断外层 contourInfo 是否为圆形模板，兼容历史参数结构。 */
  private isCircleContour(contourInfo: any): boolean {
    const params = contourInfo?.params;
    return contourInfo?.type === "圆形模板" || (!!params?.R && !params?.W && !params?.D);
  }

  /** 在领域模板完成修改后发布更新信号，驱动 UI getter 重新计算。 */
  private markTemplateUpdated(): void {
    this.templateUpdateVersion.value += 1;
  }

  /** 使用当前编辑器变量上下文计算表达式，失败时回退为普通数字。 */
  private calculateExpression(value: unknown): number {
    const content = String(value ?? "").trim();
    if (!content) return 0;
    try {
      const calculated = ExpressionUtil.calculate(content);
      if (typeof calculated === "number" && Number.isFinite(calculated)) return calculated;
    } catch {
      // 编辑器上下文尚未初始化或表达式暂不完整时使用数字回退值。
    }
    const numberValue = Number(content);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  /** 深拷贝历史模板数据，避免编辑草稿直接修改外层原始对象。 */
  private cloneJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
