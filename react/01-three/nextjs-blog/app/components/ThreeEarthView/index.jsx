"use client";

// children 是可选插槽，页面可直接用 <ThreeEarthView />。
import BaseThreeRenderView from "@/threeReact/react/views/BaseThreeRenderView.jsx";
//study/react/01-three/threeReact/output/EarthTestView/components/earth/EarthActor.jsx
import EarthActor from "@/threeReact/output/EarthTestView/components/earth/EarthActor.jsx";

function ThreeEarthView() {
  return (
    <>
      地球视图
      <BaseThreeRenderView>
        <EarthActor></EarthActor>
      </BaseThreeRenderView>
    </>
  );
}

export default ThreeEarthView;
