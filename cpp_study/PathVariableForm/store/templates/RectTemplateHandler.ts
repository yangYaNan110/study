import { RectShape } from "@/three/src/object/bim/variable/contour";
import { PathTemplateHandler } from "./IPathTemplateHandler";

/**
 * 矩形模板处理器。
 * 说明：
 * - 负责矩形模板自己的默认值、草稿恢复、参数 patch、提交转换等业务。
 * - 后续矩形模板的宽、高、顶点参数等规则都收敛到这里。
 */
export class RectTemplateHandler extends PathTemplateHandler {
  template = new RectShape();

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

  //================业务接口====================
  getWidth() {
    return this.template.params.W;
  }
  setWidth(width: number | string) {
    const oldParams = this.template.params;
    return this.template.setParams({
      ...oldParams,
      W: width.toString(),
    });
  }
  getDepth() {
    return this.template.params.D;
  }
  setDepth(d: number | string) {
    const oldParams = this.template.params;
    return this.template.setParams({
      ...oldParams,
      D: d.toString(),
    });
  }
  getCornerInfos() {
    return this.template.cornerInfos;
  }

  setTemplateData(templateData) {
    this.template.loadTemplateData(templateData);
  }
}
