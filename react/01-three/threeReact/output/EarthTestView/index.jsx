import BaseThreeRenderView from "../../react/views/BaseThreeRenderView";
import EarthActor from "./components/earth/EarthActor";

function EarthTestView({ children, store }) {
  return (
    //
    <BaseThreeRenderView store={store}>
      {/* 地球actor */}
      <EarthActor />
      {/* 也可以放其他actor来丰富场景 */}

      {/* 子组件 */}
      {children}
    </BaseThreeRenderView>
  );
}
