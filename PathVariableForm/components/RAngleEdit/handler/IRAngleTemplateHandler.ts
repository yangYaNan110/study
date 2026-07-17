import type { TProjectionInfo } from "@/three/src/object/bim/variable/contour/type";

/** Handler 提交模板结果时使用的最小目标接口，避免 Store 直接接触模板实例。 */
export interface IRAngleTemplateCommitTarget {
  contourInfo?: unknown;
}

/** RAngle 模板 Handler 的统一边界，模板实体由 Handler 内部管理。 */
export interface IRAngleTemplateHandler {
  readonly type: "rect" | "circle";
  /** 激活模板时生成可供编辑器预览的初始轮廓。 */
  activate(): void;
  /** 生成或刷新当前模板的轮廓。 */
  update(): void;
  /** 读取当前模板投影面，历史数据缺失时返回 XZ。 */
  getProjection(): TProjectionInfo;
  /** 修改当前模板投影面并刷新轮廓。 */
  updateProjection(value: TProjectionInfo): void;
  /** 返回当前模板生成的预览线段。 */
  getSegments(): unknown[];
  /** 将当前模板提交给外部模型。 */
  commitTo(target: IRAngleTemplateCommitTarget): void;
}
