//这是组件 放在actor下面的

import { useActor } from "../context/ActorProvider";
import { useRenderView } from "../context/RenderViewProvider";
import { useEffect } from "react";
function UEComponent({ children, com }) {
  const actor = useActor();
  useEffect(() => {
    const cb = actor?.addComponent(com);
    return () => {
      cb && cb();
    };
  }, []);

  return <>{children}</>;
}
export default UEComponent;
