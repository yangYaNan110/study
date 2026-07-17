import { inject, type InjectionKey } from "vue";
import type { Ref } from "vue";
import { RAngleEditStore } from "./RAngleEditStore";
import type { RAngleCornerInfo, RAngleTemplateOption, RAngleTemplateType } from "../types";
import type { TProjectionInfo } from "@/three/src/object/bim/variable/contour/type";

/** RAngleEdit Store provider 上下文，避免和 Path2dDebugger 的 renderStore 冲突。 */
export interface RAngleEditContext {
  store: RAngleEditStoreLike;
}

/** 真实 Store 对基础 UI 暴露的语义化接口，隐藏具体模板对象和更新细节。 */
export interface RAngleEditStoreLike {
  name: Ref<string>;
  refName: Ref<string>;
  addOrSave: Ref<boolean>;
  templateOptions: readonly RAngleTemplateOption[];
  templateType: Ref<RAngleTemplateType>;
  switchTemplate(templateType: RAngleTemplateType): void;
  getProjection(): TProjectionInfo;
  updateProjection(value: TProjectionInfo): void;
  updateName(value: string): void;
  updateRefName(value: string): void;
  getRectTemplateW(): string;
  getRectTemplateWValue(): number;
  getRectTemplateD(): string;
  getRectTemplateDValue(): number;
  getRectTemplateCornerInfos(): RAngleCornerInfo[];
  getRectCornerSegmentCount(index: number, corner: RAngleCornerInfo): number;
  updateRectTemplateW(value: string | number): void;
  updateRectTemplateD(value: string | number): void;
  updateRectTemplateCorner(index: number, corner: RAngleCornerInfo): void;
  getCircleTemplateR(): string;
  getCircleTemplateRValue(): number;
  getCircleTemplateArcSegmentValue(): number;
  updateCircleTemplateR(value: string | number): void;
  refreshExpressionValues(): void;
}

/** 基础模板编辑模块专用注入 key。 */
export const RANGLE_EDIT_CONTEXT: InjectionKey<RAngleEditContext> = Symbol("rAngleEditContext");

/** 获取父级提供的 RAngleEdit Store，脱离入口使用时立即抛出明确错误。 */
export function useRAngleEditContext(): RAngleEditContext {
  const context = inject(RANGLE_EDIT_CONTEXT);
  if (!context) {
    throw new Error("RAngleEdit components must be used inside RAngleEdit provider");
  }
  return context;
}

export { RAngleEditStore };
