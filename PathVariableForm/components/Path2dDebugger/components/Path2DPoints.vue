<!-- Path2D 点渲染组件：负责绘制每个路径段的起点和终点。 -->
<template>
  <div class="path-2d-points" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { Graphics, type Container } from "pixi.js";
import { inject, onBeforeUnmount, onMounted, watch } from "vue";
import { bus } from "@/utils/bus";
import type { RenderController } from "../controller/Path2dRenderController";
import type { Path2dDebuggerStore } from "../store";

const renderControllerContext = inject<{ renderController: RenderController }>("renderController");
const viewStoreContext = inject<{ store: Path2dDebuggerStore }>("renderStore");

if (!renderControllerContext || !viewStoreContext) {
  throw new Error("Path2DPoints must be used inside Path2dDebugger");
}

const renderController = renderControllerContext.renderController;
const viewStore = viewStoreContext.store;
let pointLayer: Container | null = null;
let pointGraphic: Graphics | null = null;

/** Pixi 初始化完成后创建 layer 并绘制当前路径端点。 */
const handleRenderControllerInitEnd = (): void => {
  drawPoints();
};

onMounted(() => {
  bus.on("onRenderControllerInitEnd", handleRenderControllerInitEnd);
});

watch(
  [viewStore.segmentModels, viewStore.issues, viewStore.selectedIndex, viewStore.showPoints],
  () => {
    if (renderController.renderer) {
      drawPoints();
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  bus.off("onRenderControllerInitEnd", handleRenderControllerInitEnd);
  clearPoints();

  if (pointLayer) {
    renderController.removeLayer(pointLayer);
    pointLayer = null;
  }
});

function drawPoints(): void {
  if (!renderController.renderer) return;

  if (!pointLayer) {
    pointLayer = renderController.createLayer(20);
  }

  clearPoints();

  if (!viewStore.showPoints.value) return;

  const nextPointGraphic = new Graphics();
  for (const segment of viewStore.segmentModels.value) {
    const hasError = viewStore.issues.value.some(issue => issue.segmentIndex === segment.index);
    const color = hasError ? 0xf56c6c : viewStore.selectedIndex.value === segment.index ? 0x1677ff : 0x606266;
    const start = segment.projectedPoints[0];
    const end = segment.projectedPoints[segment.projectedPoints.length - 1];

    if (start) {
      nextPointGraphic.circle(start.x, start.y, 3.5).fill({ color });
    }
    if (end) {
      nextPointGraphic.circle(end.x, end.y, 3.5).fill({ color });
    }
  }

  pointLayer.addChild(nextPointGraphic);
  pointGraphic = nextPointGraphic;
}

function clearPoints(): void {
  if (pointGraphic) {
    pointGraphic.destroy();
    pointGraphic = null;
  }
}
</script>

<style scoped lang="scss">
.path-2d-points {
  display: none;
}
</style>
