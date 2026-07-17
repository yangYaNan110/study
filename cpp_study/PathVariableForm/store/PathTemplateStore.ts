import { RectShape } from "@/three/src/object/bim/variable/contour";
import { CircleTemplateHandler } from "./templates/CircleTemplateHandler";
import { RectTemplateHandler } from "./templates/RectTemplateHandler";

/**
 * 路径模板类型。
 * 说明：
 * - 当前先按现有业务仅收敛为矩形、圆形两类模板。
 * - 后续新增 L 型、梯形、斜切边时，优先在这里扩展联合类型。
 */
enum EPathTemplateType {
  "rect" = "rect",
  "cicle" = "cicle",
  "lShape" = "lShape",
  "tShape" = "tShape",
  "bevellShape" = "bevellShape",
}
export const templatesMap = {
  rect: {
    value: "rect",
    label: "矩形模板",
    id: 0,
    type: "rect",
  },
  cicle: {
    value: "cicle",
    label: "圆形模板",
    id: 1,
    type: "cicle",
  },
  lShape: { value: "lShape", label: "L型", id: 2, type: "lShape" },
  tShpe: { value: "tShape", label: "梯形", id: 3, type: "tShape" },
  beveling: { value: "bevellShape", label: "斜切边", id: 4, type: "bevellShape" },
};

/**
 * PathTemplateStore
 *
 * 作用：
 * 1. 管理 PathVariableForm / RAngleEdit 内的模板编辑会话态。
 * 2. 进入组件时，可以按“新建 path”或“加载已有 path”两条路径初始化会话。
 * 3. 在当前会话内切换模板时，缓存各模板草稿，避免用户切换后丢失输入。
 * 4. 页面层永远只与 PathTemplateStore 交互，不直接依赖具体模板类。
 * 5. 具体模板业务由对应的 handler 负责，store 只负责分发与串联。
 * 6. 退出当前子页面时，通过 reset 清空本次会话态，不做跨会话持久化。
 *
 * 边界：
 * - 这是模块级业务会话类，不是全局单例 store。
 * - constructor 保持轻量，不承担真正初始化逻辑。
 * - 如果后期其他模块也要使用，应各自在自己模块内维护实例，彼此互不影响。
 * - 不直接操作 Vue 组件、DOM、消息提示或 formRef。
 * - 不直接触发现有 PathTemplateCompiler / manager 更新链路，外层组件负责接入。
 */
export class PathTemplateStore {
  //模板处理器map
  templateHandlerMap: any = {
    rect: new RectTemplateHandler(),
    cicle: new CircleTemplateHandler(),
  };
  //当前的处理器
  currentHandler = null;

  /**
   * 基于新建 path 初始化当前会话。
   * 说明：
   * - 当用户新建 path 时，默认激活矩形模板。
   * - 初始化时同时准备矩形、圆形两份空草稿，便于用户后续直接切换。
   * - 当前阶段暂不处理从已有 path 加载回填会话的情况。
   */
  public initForCreate(): PathTemplateStore {
    console.error("新增变量::::....");

    this.reset();
    //使用矩形模板处理器构建当前模板
    this.switchTemplateHandler(EPathTemplateType.rect);
    return this;
  }
  init(templateData) {
    if (!templateData) {
      this.initForCreate();
    } else {
      this.initForEdit(templateData);
    }
  }
  /**
   * 基于 path 数据初始化当前会话。
   * 说明：
   * - 该方法后续用于处理“编辑已有 path”场景。
   * - 当前阶段先明确标记为未实现，避免误用。
   */
  public initFromPath(options): void {
    //比initForCreate多一步 现根据已有的path 覆盖一下 templateCacheMap 里面对应的模板
    this.reset();
    const { templateData, templateType } = this.parsePath(options);
    this.templateHandlerMap[templateType].setOptions(templateData);
    this.switchTemplateHandler(templateType);
  }
  /**
   * 从已有的模板进行编辑
   * @param templateData
   */
  public initForEdit(templateData): PathTemplateStore {
    this.reset();
    if (templateData.type == "矩形模板") {
      this.switchTemplateHandler(EPathTemplateType.rect);
    }
    if (templateData.type == "圆形模板") {
      this.switchTemplateHandler(EPathTemplateType.cicle);
    }
    this.currentHandler.setTemplateData(templateData);
    return this;
  }
  /**
   * 切换当前激活模板。
   * 说明：
   * - 仅切换当前会话内的展示目标。
   * - 如果目标模板草稿还不存在，则自动补一份空草稿。
   * - 不在此处直接写回正式 path 数据。
   */
  public switchTemplateHandler(type: EPathTemplateType): void {
    const currentHandler = this.templateHandlerMap[type];
    if (!currentHandler) {
      throw "暂未实现改模板的处理器!!!";
    }
    this.currentHandler = currentHandler;
  }

  /**
   * 重置当前会话。
   * 说明：
   * - 退出子页面或取消编辑时调用。
   * - 只清理本次会话内草稿和激活态，不修改正式 path 数据。
   */
  public reset(): void {}

  parsePath(path) {
    //从path里获取当前的模板类型 以及该模板的数据
    const templateType = EPathTemplateType.rect;
    const templateData = {};
    //根据类型 用指定的处理器 来生成模板
    return {
      templateType,
      templateData,
    };
  }

  //==========================以下是矩形模板的业务接口=================================

  /**切换模板类型 */
  switchTemplate(type: EPathTemplateType) {
    this.switchTemplateHandler(type || EPathTemplateType.rect);
    return this.currentHandler.template;
  }

  /**设置矩形模板的高 */
  updateRectTemplateH(height: number | string) {
    this.currentHandler.setHeight(height);
  }
  /**修改矩形模板指定角点类型
   *
   */
  updateReactTemlateCornerType(type, index) {
    this.currentHandler.updateCornerType(type, index);
  }
  /**修改矩形模板指定角点圆角半径
   * @param r:半径
   * @param index:角点下标
   */
  updateReactTemlateCornerR(r: number | string, index: number) {
    this.currentHandler.updateCornerR(r, index);
  }
  /**
   * 更新矩形模板指定角点切段距离
   *@param  dis:切段距离
   *@param  index:角点下标
   */
  updateRectTemplateCornerCutDis(dis, index) {
    this.currentHandler.updateCornerCutDis(dis, index);
  }
  /**设置矩形模板的宽 */
  updateRectTemplateW(width: number | string) {
    this.currentHandler.setWidth(width);
  }
  getRectTemplateW() {
    return this.currentHandler.getWidth();
  }

  getRectTemplateD() {
    return this.currentHandler.getDepth();
  }
  updateRectTemplateD(d: number | string) {
    this.currentHandler.setDepth(d);
  }
  getRectTemplateCornerInfos() {
    return this.currentHandler.getCornerInfos();
  }

  //========================以下是圆形模板的业务接口==============================
  /**
   *更新圆形模板半径
   * @param r
   */
  updateCicleTemplateR(r: number | string) {
    this.currentHandler.updateRadius(r);
  }

  getCicleTemplateR() {
    return this.currentHandler.getRadius();
  }
  getCicleTemplateRValue() {
    return this.currentHandler.getRadiusValue();
  }
  getCicleTemplateArcSegment() {
    return this.currentHandler.getArcSegment();
  }
  updateCicleTemplateArcSegment(value) {
    return this.currentHandler.updateArcSegment(value);
  }
  getCicleTemplateArcSegmentValue() {
    return this.currentHandler.getArcSegmentValue();
  }

  resetCicleTemplateArcSegment() {
    this.currentHandler.resetArcSegment();
  }

  //=======================全局业务接口==========================
  /**构建path */
  buildPath() {
    // this.currentHandler.buildCommitResult();
    //从当前处理器获取到path数据 并进行保存
  }
  /**取消构建path */
  cancelBuildPath() {
    //就当啥也没发生过
    this.reset();
  }

  getTemplate() {
    return this.currentHandler.template;
  }

  isRectTemplate() {
    return this.currentHandler == this.templateHandlerMap.rect;
  }
  isCicleTemplate() {
    return this.currentHandler == this.templateHandlerMap.cicle;
  }
}
