import { useEffect } from "react";
import RenderViewProvider from "../context/RenderViewProvider";
/**
 *
 * 基础的视图组件 视图下面可以有很多的actor
 * @param controller : 渲染控制器
 * @param store : 业务store 用于存储业务状态 最好是一个react的context 后期可能不用props了
 */

function RenderView({ children, controller, store }) {
  const canvasRef = useRef(null);
  //使用provider 吧 一些通用的对象和业务实例传给子孙组件 让子孙组件能在这个基础上编写代码 并提供canvas和dom容器
  useEffect(() => {
    let canvas = document.createElement("canvas");
    controller?.init(canvas);
    return () => {
      controller?.destroy();
      canvas.width = 1;
      canvas.height = 1;
    };
  }, []);
  return (
    <RenderViewProvider controller={controller} store={store}>
      {/* canvas容器 */}
      <div ref={canvasRef}></div>
      {/* dom布局容器 */}
      <div>{children}</div>
    </RenderViewProvider>
  );
}
export default RenderView;
