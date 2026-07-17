import { CicleShape } from "@/three/src/object/bim/variable/contour/CicleShape";
import { PathTemplateHandler } from "./IPathTemplateHandler";
import { IVariableJson } from "@/three/src/interface/modelEditor/json/IVariableJson";
import { ArcSegment } from "@/three/src/object/bim/math/ArcSegment";

/**
 * 圆形模板处理器。
 * 说明：
 * - 负责圆形模板自己的默认值、草稿恢复、参数 patch、提交转换等业务。
 * - 后续圆形模板的半径、分段数等规则都收敛到这里。
 */
export class CircleTemplateHandler extends PathTemplateHandler {
  template = new CicleShape();

  /**
   * 设置模板数据
   */
  setOptions(options) {}
  /**
   * 将矩形模板草稿转换为正式提交结果。
   * 说明：
   * - 负责把当前矩形草稿组装为 contourInfo / pathInfo。
   * - 最终返回的数据会由 PathTemplateStore 写回外层 path/modelValue。
   */
  public buildCommitResult() {
    throw new Error("Method not implemented.");
  }
  /**
   * 更新半径
   * @param r : 圆形模板半径
   */
  updateRadius(r: string | number) {
    const oldParams = this.template.params;
    return this.template.setParams({
      ...oldParams,
      R: r.toString(),
    });
  }

  getRadius() {
    return this.template.params.R;
  }
  getRadiusValue() {
    return this.template.parseParams().value.R;
  }
  getArcSegment() {
    return this.template.params.ArcSegment;
  }
  updateArcSegment(value) {
    const oldParams = this.template.params;
    return this.template.setParams({
      ...oldParams,
      ArcSegment: value.toString(),
    });
  }
  getArcSegmentValue() {
    return this.template.parseParams().value.ArcSegment;
  }

  resetArcSegment(): void {
    this.template.update();
    const segments = this.template.getSegments();
    let segmentCount = 0;
    let arcSegmentCount = 0;
    for (const segment of segments) {
      if (!(segment instanceof ArcSegment)) {
        continue;
      }
      arcSegmentCount++;
      segmentCount += IVariableJson.getArcCount({
        startPoint: { x: segment.startPoint.x.value, y: segment.startPoint.y.value, z: segment.startPoint.z.value },
        endPoint: { x: segment.endPoint.x.value, y: segment.endPoint.y.value, z: segment.endPoint.z.value },
        arcDirection: segment.arcDirection,
        radius: this.getRadiusValue(),
      });
    }
    // 多段圆弧拼成整圆时，相邻弧段会共用端点，总分段数需要去掉重复点。
    const count = String(Math.max(segmentCount - Math.max(arcSegmentCount - 1, 0), 3));
    console.log("resetArcSegment::::", segments, count);
    this.updateArcSegment(count);
  }

  setTemplateData(templateData) {
    this.template.loadTemplateData(templateData);
  }
}
