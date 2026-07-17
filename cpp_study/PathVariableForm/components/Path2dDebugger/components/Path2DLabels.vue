<!-- Path2D 标签渲染组件：负责绘制路径段编号和标签背景。 -->
<template>
  <div class="path-2d-labels" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { Container, Graphics, Text } from "pixi.js";
import { inject, onBeforeUnmount, onMounted, watch } from "vue";
import { bus } from "@/utils/bus";
import type { RenderController } from "../controller/Path2dRenderController";
import { Path2dDebuggerService } from "../service/Path2dDebuggerService";
import type { Path2dDebuggerStore } from "../store";

const renderControllerContext = inject<{ renderController: RenderController }>("renderController");
const viewStoreContext = inject<{ store: Path2dDebuggerStore }>("renderStore");

if (!renderControllerContext || !viewStoreContext) {
  throw new Error("Path2DLabels must be used inside Path2dDebugger");
}

const renderController = renderControllerContext.renderController;
const viewStore = viewStoreContext.store;
let labelLayer: Container | null = null;

const handleRenderControllerInitEnd = (): void => {
  drawLabels();
};

onMounted(() => {
  bus.on("onRenderControllerInitEnd", handleRenderControllerInitEnd);
  bus.on("onViewChanged", drawLabels);
});

watch(
  [viewStore.segmentModels, viewStore.issues, viewStore.selectedIndex, viewStore.showLabels],
  () => {
    if (renderController.renderer) {
      drawLabels();
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  bus.off("onRenderControllerInitEnd", handleRenderControllerInitEnd);
  bus.off("onViewChanged", drawLabels);
  clearLabels();

  if (labelLayer) {
    renderController.removeLayer(labelLayer);
    labelLayer = null;
  }
});

function drawLabels(): void {
  if (!renderController.renderer) return;

  if (!labelLayer) {
    labelLayer = renderController.createLayer(30);
  }

  clearLabels();
  if (!viewStore.showLabels.value) return;

  const viewScale = getViewScale();
  const screenToWorld = 1 / viewScale;
  const fontSize = 14 * screenToWorld;
  const offset = 16 * screenToWorld;
  const paddingX = 6 * screenToWorld;
  const paddingY = 3 * screenToWorld;
  const radius = 4 * screenToWorld;
  const borderWidth = 1 * screenToWorld;

  for (const segment of viewStore.segmentModels.value) {
    const placement = Path2dDebuggerService.getPolylineLabelPlacement(segment.projectedPoints);
    if (!placement || !labelLayer) continue;

    const selected = viewStore.selectedIndex.value === segment.index;
    const hasError = viewStore.issues.value.some(issue => issue.segmentIndex === segment.index);
    const labelColor = hasError ? 0xf56c6c : selected ? 0x1677ff : 0x606266;
    const borderColor = hasError ? 0xf56c6c : selected ? 0x1677ff : 0xdcdfe6;
    const backgroundColor = selected ? 0xeaf2ff : 0xffffff;

    const label = new Text({
      text: "段 " + (segment.index + 1),
      style: {
        fontSize,
        fill: labelColor,
        fontFamily: "Arial, sans-serif",
        fontWeight: "600",
      },
    });
    label.anchor.set(0.5);

    const background = new Graphics();
    background
      .roundRect(
        -label.width / 2 - paddingX,
        -label.height / 2 - paddingY,
        label.width + paddingX * 2,
        label.height + paddingY * 2,
        radius,
      )
      .fill({ color: backgroundColor, alpha: 0.92 })
      .stroke({ width: borderWidth, color: borderColor, alpha: 0.72 });

    const labelGroup = new Container();
    labelGroup.x = placement.point.x + placement.normal.x * offset;
    labelGroup.y = placement.point.y + placement.normal.y * offset;
    labelGroup.eventMode = "none";
    labelGroup.addChild(background);
    labelGroup.addChild(label);
    labelLayer.addChild(labelGroup);
  }
}

function clearLabels(): void {
  if (!labelLayer) return;
  renderController.clearLayer(labelLayer);
}

function getViewScale(): number {
  const root = renderController.renderer?.getRoot();
  const scale = root?.scale.x ?? 1;
  return Math.max(0.01, Math.min(Math.abs(scale), 80));
}
</script>

<style scoped lang="scss">
.path-2d-labels {
  display: none;
}
</style>
