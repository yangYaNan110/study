import { createContext, useContext, useMemo } from "react";

/**
 * RenderView 运行时上下文。
 * null 用于在 Provider 外使用时给出明确错误，而不是静默得到无效对象。
 */
export const RenderViewContext = createContext(null);

/**
 * 向 RenderView 的所有子孙组件提供同一份渲染控制器与业务 Store。
 * controller、store 由外层创建并传入，Provider 不负责它们的生命周期。
 */
function RenderViewProvider({ controller, store, children }) {
  return (
    <RenderViewContext.Provider value={{ controller, store }}>
      {children}
    </RenderViewContext.Provider>
  );
}

/** 在 RenderView 的子树中取得 controller 和 store。 */
export function useRenderView() {
  const context = useContext(RenderViewContext);

  if (!context) {
    throw new Error("useRenderView 必须在 RenderViewProvider 内使用。");
  }

  return context;
}

export default RenderViewProvider;
