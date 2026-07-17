import { computed, inject, reactive, ref, type ComputedRef, type InjectionKey, type Ref } from "vue";
import { PathTemplateCompiler, RectShape } from "@/three/src/object/bim/variable/contour";
import { CicleShape } from "@/three/src/object/bim/variable/contour/CicleShape";
import { ECornerType, EDir, type ICornerInfo } from "@/three/src/object/bim/variable/contour/type";
import { PathInfo } from "@/three/src/object/bim/variable/PathInfo";
import { PathSourceKind } from "@/three/src/object/bim/variable/PathSourceKind";
import { LegacyVariableTypeName } from "@/three/src/object/bim/variable/LegacyVariableType";
import { ArcSegment } from "@/three/src/object/bim/math/ArcSegment";
import { IVariableJson } from "@/three/src/interface/modelEditor/json/IVariableJson";
import { DxfPathImporter, type DxfPathAxisDirection } from "@/three/src/object/bim/profile/DxfPathImporter";

/** 当前编辑器支持的页面模式；高级模式的数据迁移后也由同一个 Store 维护。 */
export type PathEditorMode = "basic" | "advanced";

/** 当前基础模式的模板类型，其他模板接入时继续扩展此联合类型。 */
export type BasicTemplateType = "rect" | "circle" | "l-shape" | "trapezoid" | "bevel";

/** 保存/取消使用的编辑快照，避免取消时直接修改外部业务对象。 */
interface PathEditorSnapshot {
  editorMode: PathEditorMode;
  pathSourceKind: PathSourceKind;
  isUseContourEditor: boolean;
  templateType: BasicTemplateType;
  rectParams: any;
  rectCornerInfos: ICornerInfo[];
  circleParams: any;
  advancedSegments: any[];
  directory: string[];
  name: string;
  refName: string;
}

/**
 * Path 编辑会话的统一状态。
 *
 * 目前先覆盖矩形模板和预览链路，默认数据用于 demo 隔离验证，不读取正式入口的
 * modelValue。后续接入正式数据时，应通过 init/save 做转换，避免 UI 直接修改业务对象。
 */
export class PathEditorStore {
  /** 当前编辑模式，默认从基础模式开始，便于验证模板和预览联动。 */
  public readonly editorMode: Ref<PathEditorMode> = ref("basic");

  /** 当前路径来源；模板来源允许基础编辑器，手工/DXF 来源只能使用高级编辑器。 */
  public readonly pathSourceKind: Ref<PathSourceKind> = ref(PathSourceKind.Template);

  /** 是否允许使用基础模板编辑器，与旧版 basicEditorEnabled 语义保持一致。 */
  public readonly isUseContourEditor: Ref<boolean> = ref(true);
  public readonly basicEditorEnabled: ComputedRef<boolean> = computed(
    () => this.pathSourceKind.value === PathSourceKind.Template && this.isUseContourEditor.value,
  );

  /** 当前基础模板类型，默认使用矩形模板。 */
  public readonly templateType: Ref<BasicTemplateType> = ref("rect");

  /** 当前编辑中的矩形模板，作为矩形尺寸和角点数据的唯一来源。 */
  public readonly rectTemplate: RectShape;

  /** 当前编辑中的圆形模板，半径和分段数由 Store 统一维护。 */
  public readonly circleTemplate: CicleShape;

  /** 当前模板编译得到的标准化预览线段，供 Path2dDebugger 只读消费。 */
  public readonly previewSegments: Ref<NonNullable<PathInfo["segments"]>> = ref([]);

  /** 当前选中的预览线段索引，由编辑器 Store 统一维护。 */
  public readonly selectedSegmentIndex: Ref<number> = ref(-1);

  /** 高级模式正在编辑的原始线段，不包含表格使用的合并占位行。 */
  public readonly advancedSegments: Ref<any[]> = ref([]);

  /** 提供给线段编辑弹窗的 PathInfo 适配对象，避免组件直接操作线段集合。 */
  public readonly advancedPathInfo: ComputedRef<PathInfo> = computed(
    () => new PathInfo({ segments: this.advancedSegments.value }),
  );

  /** 高级模式的公共变量信息，先在 demo 中独立维护，后续再接入正式 modelValue。 */
  public readonly advancedDirectory: Ref<string[]> = ref([]);
  public readonly advancedName: Ref<string> = ref("");
  public readonly advancedRefName: Ref<string> = ref("");

  /** 高级变量是否处于新增或允许保存的状态；编辑已有变量时引用名保持只读。 */
  public readonly advancedAddOrSave: Ref<boolean> = ref(true);

  /** 最近一次保存后的快照，取消操作会恢复到这个状态。 */
  private savedSnapshot: PathEditorSnapshot;

  /** 便于模板 UI 展示当前矩形宽度，实际数据仍存储在 RectShape.params 中。 */
  public readonly rectWidth: ComputedRef<string> = computed(() => this.rectTemplate.params?.W ?? "");

  /** 便于模板 UI 展示当前矩形深度，实际数据仍存储在 RectShape.params 中。 */
  public readonly rectDepth: ComputedRef<string> = computed(() => this.rectTemplate.params?.D ?? "");

  /** 计算矩形宽度表达式后的实际数值，供预览值展示，避免直接显示表达式文本。 */
  public readonly rectWidthValue: ComputedRef<number> = computed(
    () => Number(this.rectTemplate.parseParams().value.W) || 0,
  );

  /** 计算矩形深度表达式后的实际数值，供预览值展示，避免直接显示表达式文本。 */
  public readonly rectDepthValue: ComputedRef<number> = computed(
    () => Number(this.rectTemplate.parseParams().value.D) || 0,
  );

  /** 便于模板 UI 展示当前矩形角点列表，避免组件自行维护副本。 */
  public readonly rectCornerInfos: ComputedRef<ICornerInfo[]> = computed(() => this.rectTemplate.cornerInfos);

  /** 圆形半径表达式及其当前计算值，供圆形模板 UI 展示和编辑。 */
  public readonly circleRadius: ComputedRef<string> = computed(() => this.circleTemplate.params?.R ?? "");
  public readonly circleRadiusValue: ComputedRef<number> = computed(
    () => Number(this.circleTemplate.parseParams().value.R) || 0,
  );

  /** 圆形轮廓分段数表达式及其当前计算值。 */
  public readonly circleArcSegment: ComputedRef<string> = computed(() => this.circleTemplate.params?.ArcSegment ?? "");
  public readonly circleArcSegmentValue: ComputedRef<number> = computed(
    () => Number(this.circleTemplate.parseParams().value.ArcSegment) || 0,
  );

  private readonly pathTemplateCompiler = new PathTemplateCompiler();

  public constructor(initialModel?: any) {
    this.rectTemplate = reactive(new RectShape()) as RectShape;
    this.circleTemplate = reactive(new CicleShape()) as CicleShape;
    // 默认使用纯矩形模板，四个角均为直角；圆角和斜切只在用户编辑后产生。
    this.loadInitialModel(initialModel);
    this.rebuildPreview();
    this.savedSnapshot = this.createSnapshot();
  }

  /** 重新载入外部变量，支持弹窗复用时切换到另一条已保存 Path。 */
  public loadModel(model: any): void {
    const defaultRect = new RectShape();
    const defaultCircle = new CicleShape();
    this.rectTemplate.params = this.cloneJson(defaultRect.params);
    this.rectTemplate.cornerInfos = this.cloneJson(defaultRect.cornerInfos);
    this.circleTemplate.params = this.cloneJson(defaultCircle.params);
    this.pathSourceKind.value = PathSourceKind.Template;
    this.isUseContourEditor.value = true;
    this.templateType.value = "rect";
    this.editorMode.value = "basic";
    this.advancedSegments.value = [];
    this.loadInitialModel(model);
    this.rebuildPreview();
    this.savedSnapshot = this.createSnapshot();
  }

  /** 从已保存的 Path 变量恢复编辑草稿；没有传入数据时继续使用新建默认值。 */
  private loadInitialModel(model: any): void {
    if (!model) return;

    this.pathSourceKind.value = model.pathSourceKind ?? PathSourceKind.Template;
    this.isUseContourEditor.value = model.isUseContourEditor ?? this.pathSourceKind.value === PathSourceKind.Template;
    this.advancedDirectory.value = Array.isArray(model.directory) ? [...model.directory] : [];
    this.advancedName.value = String(model.name ?? "");
    this.advancedRefName.value = String(model.refName ?? "");

    const contourInfo = model.contourInfo;
    const params = contourInfo?.params;
    const isCircle = !!params?.R && !params?.W && !params?.D;
    if (isCircle) {
      this.circleTemplate.params = this.cloneJson(params);
      this.templateType.value = "circle";
    } else if (contourInfo) {
      if (params) this.rectTemplate.params = this.cloneJson(params);
      if (Array.isArray(contourInfo.cornerInfos)) {
        this.rectTemplate.cornerInfos = this.cloneJson(contourInfo.cornerInfos);
      }
      this.templateType.value = "rect";
    }

    const segments = model.pathInfo?.segments;
    this.advancedSegments.value = Array.isArray(segments)
      ? segments.filter((segment: any) => segment && !segment.isMergeRow)
      : [];
    // 新建变量虽然还没有 contourInfo，也应根据模板来源进入基础模式；只有手动/DXF 来源进入高级模式。
    this.editorMode.value =
      this.pathSourceKind.value === PathSourceKind.Template && this.isUseContourEditor.value
        ? "basic"
        : "advanced";
  }

  /** 将当前编辑草稿写回外部变量，供正式弹窗保存使用。 */
  public saveToModel(target: any): boolean {
    if (!this.save() || !target) return false;

    target.directory = [...this.advancedDirectory.value];
    target.name = this.advancedName.value;
    target.refName = this.advancedRefName.value;
    // Path 类型由父层据此归类为中间变量，不能遗漏，否则会被当成普通自定义变量保存。
    target.variableType = LegacyVariableTypeName.Path;
    target.pathSourceKind = this.pathSourceKind.value;
    target.isUseContourEditor = this.isUseContourEditor.value;
    const sourceContour = this.templateType.value === "circle" ? this.circleTemplate : this.rectTemplate;
    const targetContour = target.contourInfo ?? (this.templateType.value === "circle" ? new CicleShape() : new RectShape());
    targetContour.params = this.cloneJson(sourceContour.params);
    if (this.templateType.value === "rect") {
      targetContour.cornerInfos = this.cloneJson(this.rectTemplate.cornerInfos);
    }
    target.contourInfo = targetContour;
    target.pathInfo = this.getPreviewPathInfo();
    return true;
  }

  /** 切换编辑模式；模式切换不复制或重置另一模式的数据。 */
  public switchMode(mode: PathEditorMode): void {
    if (mode === "basic" && !this.basicEditorEnabled.value) return;

    // 基础模板首次切换到高级模式时，先把模板编译结果复制为可编辑线段。
    if (mode === "advanced" && this.pathSourceKind.value === PathSourceKind.Template) {
      this.rebuildPreview();
      this.advancedSegments.value = this.previewSegments.value.filter(
        segment => !(segment as { isMergeRow?: boolean }).isMergeRow,
      );
    }
    this.editorMode.value = mode;
    this.rebuildPreview();
  }

  /**
   * 切换基础模板。
   * 当前只允许矩形模板进入真实编译链路，其他模板保留占位状态，避免误用矩形数据。
   */
  public switchTemplate(templateType: BasicTemplateType): void {
    this.templateType.value = templateType;
    if (templateType === "rect" || templateType === "circle") {
      this.rebuildPreview();
      return;
    }

    this.previewSegments.value = [];
    this.selectedSegmentIndex.value = -1;
  }

  /** 更新矩形宽度表达式，并立即重新生成预览线段。 */
  public updateRectWidth(width: string): void {
    this.rectTemplate.params.W = width;
    this.rebuildPreview();
  }

  /** 更新矩形深度表达式，并立即重新生成预览线段。 */
  public updateRectDepth(depth: string): void {
    this.rectTemplate.params.D = depth;
    this.rebuildPreview();
  }

  /** 更新圆形半径表达式，并立即重建圆形预览。 */
  public updateCircleRadius(radius: string): void {
    this.circleTemplate.params.R = radius;
    this.resetCircleArcSegment();
    this.rebuildPreview();
  }

  /** 更新圆形分段数表达式，并立即重建圆形预览。 */
  public updateCircleArcSegment(segmentCount: string): void {
    this.circleTemplate.params.ArcSegment = segmentCount;
    this.rebuildPreview();
  }

  /**
   * 根据圆形半径重新计算整圆分段数。
   * 圆形由两段半圆组成，两段采样点需要扣除一个重复连接点。
   */
  public resetCircleArcSegment(): void {
    const radius = this.circleRadiusValue.value;
    if (!Number.isFinite(radius) || radius <= 0) {
      this.circleTemplate.params.ArcSegment = "3";
      return;
    }

    const halfArcCount = ArcSegment.getArcSamplingCount(radius * 2, 180);
    const totalCount = Math.max(halfArcCount * 2 - 1, 3);
    this.circleTemplate.params.ArcSegment = String(totalCount);
  }

  /** 设置高级模式线段并同步右侧预览。 */
  public setAdvancedSegments(segments: readonly unknown[]): void {
    this.advancedSegments.value = segments.filter(segment => {
      return !!segment && typeof segment === "object" && !(segment as { isMergeRow?: boolean }).isMergeRow;
    }) as any[];
    this.rebuildPreview();
  }

  /** 新增高级模式线段，index 为插入位置，-1 表示追加。 */
  public addAdvancedSegment(formData: any, index = -1): void {
    const insertIndex = index >= 0 ? index : this.advancedSegments.value.length;
    this.advancedSegments.value = IVariableJson.addPathSegments(
      formData,
      this.advancedSegments.value,
      insertIndex,
    ) as any[];
    this.pathSourceKind.value = PathSourceKind.Manual;
    this.isUseContourEditor.value = false;
    this.rebuildPreview();
  }

  /** 修改高级模式中的指定线段。 */
  public updateAdvancedSegment(index: number, formData: any): void {
    const segment = this.advancedSegments.value[index];
    if (!segment) return;
    IVariableJson.changePathSegments(segment, formData);
    this.advancedSegments.value = [...this.advancedSegments.value];
    this.pathSourceKind.value = PathSourceKind.Manual;
    this.isUseContourEditor.value = false;
    this.rebuildPreview();
  }

  /** 删除高级模式中的指定线段。 */
  public deleteAdvancedSegment(index: number): void {
    if (index < 0 || index >= this.advancedSegments.value.length) return;
    const segments = [...this.advancedSegments.value];
    IVariableJson.deletePathSegments(segments, index);
    this.advancedSegments.value = segments;
    this.pathSourceKind.value = PathSourceKind.Manual;
    this.isUseContourEditor.value = false;
    this.selectedSegmentIndex.value = this.clampSelectedSegmentIndex(this.selectedSegmentIndex.value);
    this.rebuildPreview();
  }

  /** 解析 DXF 文本并替换高级模式线段。 */
  public async importDxfAsync(source: string, xAxis: DxfPathAxisDirection, yAxis: DxfPathAxisDirection): Promise<void> {
    const pathInfo = DxfPathImporter.createPathInfo(source, { xAxis, yAxis });
    this.setAdvancedSegments(pathInfo.segments);
    this.pathSourceKind.value = PathSourceKind.Import;
    this.isUseContourEditor.value = false;
  }

  /** 更新指定矩形角点，并立即重新生成预览线段。 */
  public updateRectCorner(index: number, cornerInfo: ICornerInfo): void {
    if (index < 0 || index >= this.rectTemplate.cornerInfos.length) return;

    this.rectTemplate.updateCorner(index, {
      ...cornerInfo,
      type: cornerInfo.type ?? ECornerType.直角,
      dir: cornerInfo.dir ?? EDir.左上角,
    });
    this.rebuildPreview();
  }

  /** 更新当前预览选中的线段索引。 */
  public setSelectedSegmentIndex(index: number): void {
    this.selectedSegmentIndex.value = index;
  }

  /**
   * 使用现有 Three/domain 能力重建预览。
   * 几何计算集中在 Store，视图层只接收 previewSegments，不直接调用 RectShape.update。
   */
  public rebuildPreview(): void {
    const template =
      this.editorMode.value === "advanced"
        ? null
        : this.templateType.value === "rect"
          ? this.rectTemplate
          : this.templateType.value === "circle"
            ? this.circleTemplate
            : null;
    try {
      // 高级模式没有模板对象，直接使用当前线段生成 PathInfo；基础模板走编译器。
      const pathInfo =
        this.editorMode.value === "advanced"
          ? new PathInfo({ segments: this.advancedSegments.value })
          : template
            ? this.pathTemplateCompiler.compile(template)
            : new PathInfo({ segments: [] });
      this.previewSegments.value = [...pathInfo.segments];
      this.selectedSegmentIndex.value = this.clampSelectedSegmentIndex(this.selectedSegmentIndex.value);
    } catch (error) {
      console.error("[PathEditorStore] 矩形模板预览生成失败", error);
      this.previewSegments.value = [];
      this.selectedSegmentIndex.value = -1;
    }
  }

  /** 返回当前编辑会话的预览结果，供后续 save 流程复用。 */
  public getPreviewPathInfo(): PathInfo {
    return new PathInfo({ segments: [...this.previewSegments.value] });
  }

  /** 保存当前 demo 草稿，返回 false 表示当前高级模式没有可保存的线段。 */
  public save(): boolean {
    if (this.editorMode.value === "advanced" && !this.advancedSegments.value.length) {
      return false;
    }
    if (this.editorMode.value === "basic") {
      this.pathSourceKind.value = PathSourceKind.Template;
      this.isUseContourEditor.value = true;
    } else if (this.pathSourceKind.value !== PathSourceKind.Import) {
      this.pathSourceKind.value = PathSourceKind.Manual;
      this.isUseContourEditor.value = false;
    }
    this.savedSnapshot = this.createSnapshot();
    return true;
  }

  /** 取消当前编辑并恢复最近一次保存的草稿快照。 */
  public cancel(): void {
    this.restoreSnapshot(this.savedSnapshot);
    this.rebuildPreview();
  }

  /** 创建可安全复制的编辑快照，保存表达式和线段数组的当前值。 */
  private createSnapshot(): PathEditorSnapshot {
    return {
      editorMode: this.editorMode.value,
      pathSourceKind: this.pathSourceKind.value,
      isUseContourEditor: this.isUseContourEditor.value,
      templateType: this.templateType.value,
      rectParams: this.cloneJson(this.rectTemplate.params ?? {}),
      rectCornerInfos: this.cloneJson(this.rectTemplate.cornerInfos),
      circleParams: this.cloneJson(this.circleTemplate.params ?? {}),
      advancedSegments: this.cloneJson(this.advancedSegments.value),
      directory: [...this.advancedDirectory.value],
      name: this.advancedName.value,
      refName: this.advancedRefName.value,
    };
  }

  /** 将快照内容恢复到当前编辑 Store，并重新生成预览数据。 */
  private restoreSnapshot(snapshot: PathEditorSnapshot): void {
    this.editorMode.value = snapshot.editorMode;
    this.pathSourceKind.value = snapshot.pathSourceKind;
    this.isUseContourEditor.value = snapshot.isUseContourEditor;
    this.templateType.value = snapshot.templateType;
    this.rectTemplate.params = this.cloneJson(snapshot.rectParams);
    this.rectTemplate.cornerInfos = this.cloneJson(snapshot.rectCornerInfos);
    this.circleTemplate.params = this.cloneJson(snapshot.circleParams);
    this.advancedSegments.value = this.cloneJson(snapshot.advancedSegments);
    this.advancedDirectory.value = [...snapshot.directory];
    this.advancedName.value = snapshot.name;
    this.advancedRefName.value = snapshot.refName;
  }

  /** 复制编辑草稿中的普通对象，避免保存快照和响应式对象相互引用。 */
  private cloneJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private clampSelectedSegmentIndex(index: number): number {
    if (!this.previewSegments.value.length) return -1;
    return Math.max(-1, Math.min(index, this.previewSegments.value.length - 1));
  }
}

/** 编辑器上下文类型，供 demo 下的视图和模板组件共享同一个编辑会话。 */
export interface PathEditorContext {
  store: PathEditorStore;
}

/** 使用独立注入键，避免与 Path2dDebugger 自身的 renderStore 上下文冲突。 */
export const PATH_EDITOR_CONTEXT: InjectionKey<PathEditorContext> = Symbol("pathEditorContext");

/** 获取外层提供的编辑 Store，脱离编辑器树使用时立即抛出明确错误。 */
export function usePathEditorContext(): PathEditorContext {
  const context = inject(PATH_EDITOR_CONTEXT);
  if (!context) {
    throw new Error("Path editor components must be used inside PathEditorStore provider");
  }
  return context;
}
