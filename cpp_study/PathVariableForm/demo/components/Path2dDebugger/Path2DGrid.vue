<!-- Path2D 网格渲染组件：只负责网格的创建和清理。 -->
<template>
  <div class="path-2d-grid" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { Graphics, type Container } from "pixi.js";
import { inject, onBeforeUnmount, onMounted, watch } from "vue";
import type { RenderController } from "../../controller/Path2dRenderController";
import { bus } from "@/utils/bus";
import type { Path2dDebuggerStore } from "../../store/Path2dDebuggerStore";
const renderControllerContext = inject<{ renderController: RenderController }>("renderController");
const viewStoreContext = inject<{ store: Path2dDebuggerStore }>("renderStore");
if (!renderControllerContext) {
  throw new Error("Path2DGrid must be used inside Path2dDebugger");
}
const renderController = renderControllerContext.renderController;
const viewStore = viewStoreContext.store;
let layer: Container | null = null;
let grid: Graphics | null = null;

onMounted(() => {
  bus.on("onRenderControllerInitEnd", drawGrid);
});

watch(
  [viewStore.segmentModels, viewStore.showGrid],
  () => {
    if (renderController.renderer) {
      drawGrid();
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  clearGrid();
  bus.off("onRenderControllerInitEnd", drawGrid);
  if (layer) {
    renderController.removeLayer(layer);
    layer = null;
  }
});

function drawGrid(): void {
  if (!viewStore.showGrid.value) {
    clearGrid();
    return;
  }

  if (!renderController.renderer) return;

  if (!layer) {
    layer = renderController.createLayer(0);
  }

  clearGrid();

  const bounds = viewStore.projectedBounds.value;
  const range = Math.max(bounds.width, bounds.height, 400);
  const step = chooseGridStep(range);
  const minX = Math.floor((bounds.centerX - range) / step) * step;
  const maxX = Math.ceil((bounds.centerX + range) / step) * step;
  const minY = Math.floor((bounds.centerY - range) / step) * step;
  const maxY = Math.ceil((bounds.centerY + range) / step) * step;
  const nextGrid = new Graphics();

  for (let x = minX; x <= maxX; x += step) {
    nextGrid.moveTo(x, minY).lineTo(x, maxY);
  }

  for (let y = minY; y <= maxY; y += step) {
    nextGrid.moveTo(minX, y).lineTo(maxX, y);
  }

  nextGrid.stroke({ width: 1, color: 0xdcdfe6, alpha: 0.45 });
  nextGrid.moveTo(minX, 0).lineTo(maxX, 0).stroke({
    width: 1,
    color: 0xf56c6c,
    alpha: 0.7,
  });
  nextGrid.moveTo(0, minY).lineTo(0, maxY).stroke({
    width: 1,
    color: 0x67c23a,
    alpha: 0.7,
  });

  layer.addChild(nextGrid);
  grid = nextGrid;
}

function clearGrid(): void {
  if (!grid) return;

  grid.destroy();
  grid = null;
}

function chooseGridStep(range: number): number {
  if (range > 3000) return 500;
  if (range > 1200) return 200;
  if (range > 600) return 100;
  if (range > 240) return 50;
  return 20;
}
</script>

<style scoped lang="scss">
.path-2d-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
