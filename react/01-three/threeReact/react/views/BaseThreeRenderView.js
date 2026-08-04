import { useRef } from "react"
import { RenderController } from "../../core/system/RenderController"
import RenderView from "../components/RenderView";
// threejs的基础视图
//他使用的渲染控制器是明确的
function BaseThreeRenderView({ store = {}, children }) {
    const controllerRef = useRef()
    if (!controllerRef) {
        controllerRef.current = new RenderController();
    }
    return <RenderView controller={controllerRef.current} store={store}>
        {children}
    </RenderView>
}