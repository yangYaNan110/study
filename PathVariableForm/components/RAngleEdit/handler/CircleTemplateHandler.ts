import { CicleShape } from "@/three/src/object/bim/variable/contour/CicleShape";
import type { TProjectionInfo } from "@/three/src/object/bim/variable/contour/type";
import { IVariableJson } from "@/three/src/interface/modelEditor/json/IVariableJson";
import { ArcSegment } from "@/three/src/object/bim/math/ArcSegment";
import type {
  IRAngleTemplateCommitTarget,
  IRAngleTemplateHandler,
} from "@/layout/components/ModelEditor/components/LeftPanel/pages/forms/PathVariableForm/components/RAngleEdit/handler/IRAngleTemplateHandler";

/** 圆形模板 Handler，集中管理半径、分段数和圆形预览生成。 */
export class CircleTemplateHandler implements IRAngleTemplateHandler {
  /** Handler 对应的模板类型。 */
  public readonly type = "circle" as const;
  /** 圆形真实模板对象，不使用 reactive 包裹。 */
  private readonly template = new CicleShape();

  /** 激活圆形模板并生成当前参数对应的轮廓。 */
  public activate(): void {
    this.template.update();
    this.resetArcSegment();
  }

  /** 生成当前圆形模板轮廓。 */
  public update(): void {
    this.template.update();
  }

  /** 读取当前圆形模板投影面，兼容没有投影字段的历史数据。 */
  public getProjection(): TProjectionInfo {
    const projection = this.template.params?.projection;
    return projection === "XY" || projection === "YZ" ? projection : "XZ";
  }

  /** 修改圆形模板投影面并刷新轮廓。 */
  public updateProjection(value: TProjectionInfo): void {
    this.template.params.projection = value;
    this.template.update();
  }

  /** 将当前圆形模板提交给外部模型。 */
  public commitTo(target: IRAngleTemplateCommitTarget): void {
    target.contourInfo = this.template;
  }

  /** 从外层模板数据恢复圆形草稿。 */
  public loadTemplateData(data: unknown): void {
    this.template.loadTemplateData(data as never);
    this.resetArcSegment();
  }

  /** 读取圆形半径表达式。 */
  public getRadius(): string {
    return String(this.template.params.R ?? "");
  }

  /** 更新圆形半径并刷新模板几何。 */
  public updateRadius(value: string | number): void {
    this.template.setParams({ ...this.template.params, R: String(value) });
    this.template.update();
    this.resetArcSegment();
  }

  /** 读取圆形分段数的计算值。 */
  public getArcSegmentValue(): number {
    const value = Number(this.template.parseParams().value.ArcSegment);
    return Number.isFinite(value) ? value : 0;
  }

  /** 返回圆形模板生成的预览线段。 */
  public getSegments(): unknown[] {
    return [...this.template.getSegments()];
  }

  /** 根据当前圆弧几何重新计算整圆分段数，并写回模板参数。 */
  private resetArcSegment(): void {
    const segments = this.template.getSegments();
    let segmentCount = 0;
    let arcSegmentCount = 0;
    for (const segment of segments) {
      if (!(segment instanceof ArcSegment)) continue;
      arcSegmentCount += 1;
      segmentCount += IVariableJson.getArcCount({
        startPoint: {
          x: segment.startPoint.x.value,
          y: segment.startPoint.y.value,
          z: segment.startPoint.z.value,
        },
        endPoint: {
          x: segment.endPoint.x.value,
          y: segment.endPoint.y.value,
          z: segment.endPoint.z.value,
        },
        arcDirection: segment.arcDirection,
        radius: this.getRadiusValue(),
      });
    }
    if (!arcSegmentCount) return;

    // 两段半圆共用一个端点，整圆总分段数需要扣除一次重复点。
    const count = Math.max(segmentCount - Math.max(arcSegmentCount - 1, 0), 3);
    this.template.setParams({ ...this.template.params, ArcSegment: String(count) });
    this.template.update();
  }

  /** 读取当前变量上下文计算后的圆形半径。 */
  private getRadiusValue(): number {
    const value = Number(this.template.parseParams().value.R);
    return Number.isFinite(value) ? value : 0;
  }
}
