import { RectShape } from "@/three/src/object/bim/variable/contour";
import { ECornerType, EDir, type ICornerInfo, type TProjectionInfo } from "@/three/src/object/bim/variable/contour/type";
import { ExpressionUtil } from "@/three/src/interface/modelEditor/util/ExpressionUtil";
import { IVariableJson } from "@/three/src/interface/modelEditor/json/IVariableJson";
import { ArcSegment } from "@/three/src/object/bim/math/ArcSegment";
import type { RAngleCornerInfo } from "../types";
import type {
  IRAngleTemplateCommitTarget,
  IRAngleTemplateHandler,
} from "@/layout/components/ModelEditor/components/LeftPanel/pages/forms/PathVariableForm/components/RAngleEdit/handler/IRAngleTemplateHandler";

/** 矩形模板 Handler，集中管理尺寸、角点转换和矩形预览生成。 */
export class RectTemplateHandler implements IRAngleTemplateHandler {
  /** Handler 对应的模板类型。 */
  public readonly type = "rect" as const;
  /** 矩形真实模板对象，不使用 reactive 包裹。 */
  private readonly template = new RectShape();

  /** 激活矩形模板并生成当前参数对应的轮廓。 */
  public activate(): void {
    this.template.update();
  }

  /** 生成当前矩形模板轮廓。 */
  public update(): void {
    this.template.update();
  }

  /** 读取当前矩形模板投影面，兼容没有投影字段的历史数据。 */
  public getProjection(): TProjectionInfo {
    const projection = this.template.params?.projection;
    return projection === "XY" || projection === "YZ" ? projection : "XZ";
  }

  /** 修改矩形模板投影面并刷新轮廓。 */
  public updateProjection(value: TProjectionInfo): void {
    this.template.params.projection = value;
    this.template.update();
  }

  /** 将当前矩形模板提交给外部模型。 */
  public commitTo(target: IRAngleTemplateCommitTarget): void {
    target.contourInfo = this.template;
  }

  /** 从外层模板数据恢复矩形草稿。 */
  public loadTemplateData(data: unknown): void {
    this.template.loadTemplateData(data as never);
  }

  /** 初始化新建矩形模板。 */
  public initialize(): void {
    this.template.update();
  }

  /** 读取矩形宽度表达式。 */
  public getWidth(): string {
    return String(this.template.params.W ?? "");
  }

  /** 更新矩形宽度并刷新模板几何。 */
  public updateWidth(value: string | number): void {
    this.template.setParams({ ...this.template.params, W: String(value) });
    this.template.update();
  }

  /** 读取矩形深度表达式。 */
  public getDepth(): string {
    return String(this.template.params.D ?? "");
  }

  /** 更新矩形深度并刷新模板几何。 */
  public updateDepth(value: string | number): void {
    this.template.setParams({ ...this.template.params, D: String(value) });
    this.template.update();
  }

  /** 返回矩形角点的 UI 编辑数据。 */
  public getCornerInfos(): RAngleCornerInfo[] {
    return this.template.cornerInfos.map(corner => this.toViewCorner(corner));
  }

  /** 更新指定矩形角点，并刷新模板几何。 */
  public updateCorner(index: number, corner: RAngleCornerInfo): void {
    if (index < 0 || index >= this.template.cornerInfos.length) return;
    const previousCorner = this.template.cornerInfos[index];
    const domainCorner = this.toDomainCorner(corner);
    this.template.updateCorner(index, domainCorner);
    if (
      domainCorner.type === ECornerType.圆角 &&
      (!domainCorner.ArcSegment || previousCorner.R !== domainCorner.R)
    ) {
      const count = this.getArcSegmentCount(this.template, index);
      if (count > 0) {
        this.template.cornerInfos[index].ArcSegment = String(count);
        this.template.update();
      }
    }
  }

  /** 返回矩形模板生成的预览线段。 */
  public getSegments(): unknown[] {
    return [...this.template.getSegments()];
  }

  /** 基于角点临时草稿计算分段数，不修改当前真实模板。 */
  public getCornerSegmentCount(index: number, corner: RAngleCornerInfo): number {
    if (corner.type !== "Fillet") return 0;
    const previewTemplate = new RectShape();
    previewTemplate.loadTemplateData({
      params: { ...this.template.params },
      cornerInfos: this.template.cornerInfos.map(item => ({ ...item })),
    });
    previewTemplate.updateCorner(index, this.toDomainCorner(corner));
    return this.getArcSegmentCount(previewTemplate, index);
  }

  /** 将 UI 角点转换为领域角点，并按类型清理无效字段。 */
  private toDomainCorner(corner: RAngleCornerInfo): ICornerInfo {
    const isFillet = corner.type === "Fillet";
    const isChamfer = corner.type === "Chamfer";
    return {
      type: corner.type as ECornerType,
      dir: corner.direction as EDir,
      R: isFillet && corner.radiusExpression ? corner.radiusExpression : undefined,
      ArcSegment: isFillet && corner.segmentCount ? String(corner.segmentCount) : undefined,
      d: isChamfer && corner.cutDistanceExpression ? corner.cutDistanceExpression : undefined,
    };
  }

  /** 将领域角点转换为 UI 模型，直角和斜切角不展示半径字段。 */
  private toViewCorner(corner: ICornerInfo): RAngleCornerInfo {
    const isFillet = corner.type === ("Fillet" as ECornerType);
    const isChamfer = corner.type === ("Chamfer" as ECornerType);
    const radiusExpression = isFillet ? String(corner.R ?? "") : "";
    const cutDistanceExpression = isChamfer ? String(corner.d ?? "") : "";
    return {
      direction: String(corner.dir ?? ""),
      type: corner.type as RAngleCornerInfo["type"],
      radiusExpression,
      radius: isFillet ? this.calculateExpression(radiusExpression) : 0,
      segmentCount: isFillet ? this.calculateExpression(corner.ArcSegment) || 1 : 0,
      cutDistanceExpression,
      cutDistance: isChamfer ? this.calculateExpression(cutDistanceExpression) : 0,
    };
  }

  /** 按当前变量上下文计算角点表达式，失败时回退为普通数字。 */
  private calculateExpression(value: unknown): number {
    const content = String(value ?? "").trim();
    if (!content) return 0;
    try {
      const calculated = ExpressionUtil.calculate(content);
      if (typeof calculated === "number" && Number.isFinite(calculated)) return calculated;
    } catch {
      // 表达式暂不完整时继续使用数字回退值。
    }
    const numberValue = Number(content);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  /** 从指定角点对应的圆弧几何计算采样分段数。 */
  private getArcSegmentCount(template: RectShape, index: number): number {
    const arcSegment = template
      .getSegments()
      .slice(index)
      .find(segment => segment instanceof ArcSegment);
    if (!(arcSegment instanceof ArcSegment)) return 0;
    return IVariableJson.getArcCount({
      startPoint: {
        x: arcSegment.startPoint.x.value,
        y: arcSegment.startPoint.y.value,
        z: arcSegment.startPoint.z.value,
      },
      endPoint: {
        x: arcSegment.endPoint.x.value,
        y: arcSegment.endPoint.y.value,
        z: arcSegment.endPoint.z.value,
      },
      arcDirection: arcSegment.arcDirection,
      radius: arcSegment.radius.value,
    });
  }
}
