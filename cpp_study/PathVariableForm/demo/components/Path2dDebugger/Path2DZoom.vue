<!-- Path2D 缩放组件：启用 Pixi 内置 CameraController，不重复监听 wheel。 -->
<template>
  <div class="path-2d-zoom" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted } from "vue";
import { bus } from "@/utils/bus";
import type { RenderController } from "../../controller/Path2dRenderController";

const context = inject<{ renderController: RenderController }>("renderController");

if (!context) {
  throw new Error("Path2DZoom must be used inside Path2dDebugger");
}

const renderController = context.renderController;

/** Pixi 初始化完成后开启内置相机，滚轮缩放中心会跟随鼠标位置。 */
const handleRenderControllerInitEnd = (): void => {
  renderController.setCameraEnabled(true);
};

onMounted(() => {
  // 子组件先注册，等待父组件完成 Pixi 初始化后发送事件。
  bus.on("onRenderControllerInitEnd", handleRenderControllerInitEnd);
});

onBeforeUnmount(() => {
  // 卸载时关闭相机交互，避免组件销毁后仍响应鼠标事件。
  bus.off("onRenderControllerInitEnd", handleRenderControllerInitEnd);
  renderController.setCameraEnabled(false);
});
</script>

<style scoped lang="scss">
.path-2d-zoom {
  display: none;
}
</style>
