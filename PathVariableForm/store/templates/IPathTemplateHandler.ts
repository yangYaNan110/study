/**
 * 模板处理器统一接口。
 * 说明：
 * - 每个模板都实现同一套接口，便于 PathTemplateStore 统一调度。
 * - handler 只处理模板自身业务，不直接操作 Vue 组件状态。
 */
export class PathTemplateHandler {
  //操作的模板
  template = null;
  /**
   * 将模板草稿转换为正式提交结果。
   * 说明：
   * - 由各模板自己负责组装 contourInfo / pathInfo。
   */
  buildCommitResult() {}

  //设置模板数据
  setOptions(options) {}
}
