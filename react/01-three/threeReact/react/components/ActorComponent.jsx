//actor使用的组件 使用这个组件的话

import { useRenderView } from "../context/RenderViewProvider";
import { useEffect } from "react";

//比如eatrhActor需要继承自这个组件
function ActorComponent({ actor, children }) {
  const { controller, store } = useRenderView();
  useEffect(() => {
    const cb = controller?.addActor(actor);
    return () => {
      //销毁
      cb && cb();
    };
  }, []);
  //这里同样返回一个provider 吧actor暴露出去
  return <ActorProvider value={actor}>{children}</ActorProvider>;
}

export default ActorComponent;
