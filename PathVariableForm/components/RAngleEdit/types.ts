/** 阶段一静态 UI 使用的数据类型；后续由真实 Store 复用或替换。 */
/** 模板注册表使用的稳定标识；未实现模板也必须保留标识以支持切换。 */
export type RAngleTemplateType = "rect" | "circle" | "l-shape" | "trapezoid" | "bevel";

/** 模板选择器展示模型，value 用于分发组件，label 用于界面展示。 */
export interface RAngleTemplateOption {
  /** 模板稳定标识。 */
  value: RAngleTemplateType;
  /** 模板中文名称。 */
  label: string;
}

/** 矩形角点支持的编辑类型；真实领域枚举接入后保持此 UI 语义不变。 */
export type RAngleCornerType = "Right" | "Fillet" | "Chamfer";

/** 矩形角点的静态展示和编辑模型，表达式文本与计算值分开保存。 */
export interface RAngleCornerInfo {
  /** 角点方向或显示名称。 */
  direction: string;
  /** 角点类型。 */
  type: RAngleCornerType;
  /** 圆角半径表达式原文。 */
  radiusExpression: string;
  /** 圆角半径静态计算值。 */
  radius: number;
  /** 圆弧采样分段数。 */
  segmentCount: number;
  /** 斜切距离表达式原文。 */
  cutDistanceExpression: string;
  /** 斜切距离静态计算值。 */
  cutDistance: number;
}

/** 矩形模板编辑草稿；阶段一使用静态数据，后续映射到 RectShape。 */
