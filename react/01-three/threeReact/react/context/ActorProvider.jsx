import { createContext, useContext } from "react";

/** 当前 Actor 组件子树所操作的 Actor 实例。 */
export const ActorContext = createContext(null);

/**
 * 将外层创建的 Actor 提供给当前组件及其所有子孙组件。
 * Provider 不创建、挂载或销毁 Actor，生命周期仍由外层 View 管理。
 */
function ActorProvider({ actor, children }) {
  return (
    <ActorContext.Provider value={actor}>
      {children}
    </ActorContext.Provider>
  );
}

/** 在 ActorProvider 的子树中取得当前 Actor。 */
export function useActor() {
  const actor = useContext(ActorContext);

  if (!actor) {
    throw new Error("useActor 必须在 ActorProvider 内使用。");
  }

  return actor;
}

export default ActorProvider;
