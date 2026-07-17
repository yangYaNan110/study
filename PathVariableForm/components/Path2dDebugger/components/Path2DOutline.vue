<!-- Path2D 轮廓渲染组件：负责线段、圆弧、折线及其选中交互。 -->
<template>
  <div class="path-2d-outline" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { Graphics, type Container } from "pixi.js";
import { inject, onBeforeUnmount, onMounted, watch } from "vue";
import { bus } from "@/utils/bus";
import type { RenderController } from "../controller/Path2dRenderController";
import type { Path2dDebuggerStore, PathSegmentModel } from "../store";

const emits = defineEmits<{
  (event: "update:selectedIndex", index: number): void;
  (event: "selectSegment", index: number): void;
}>();

const renderControllerContext = inject<{ renderController: RenderController }>("renderController");
const viewStoreContext = inject<{ store: Path2dDebuggerStore }>("renderStore");

if (!renderControllerContext || !viewStoreContext) {
  throw new Error("Path2DOutline must be used inside Path2dDebugger");
}

const renderController = renderControllerContext.renderController;
const viewStore = viewStoreContext.store;
let outlineLayer: Container | null = null;

/** Pixi 初始化完成后创建 layer 并绘制当前路径。 */
const handleRenderControllerInitEnd = (): void => {
  draw();
};

onMounted(() => {
  bus.on("onRenderControllerInitEnd", handleRenderControllerInitEnd);
});

watch(
  [viewStore.segmentModels, viewStore.issues, viewStore.selectedIndex],
  () => {
    if (renderController.renderer) {
      draw();
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  bus.off("onRenderControllerInitEnd", handleRenderControllerInitEnd);
  clear();

  if (outlineLayer) {
    renderController.removeLayer(outlineLayer);
    outlineLayer = null;
  }
});

function draw(): void {
  if (!renderController.renderer) return;

  if (!outlineLayer) {
    outlineLayer = renderController.createLayer(10);
  }

  renderController.clearLayer(outlineLayer);

  for (const segment of viewStore.segmentModels.value) {
    drawSegment(segment);
  }
}

function clear(): void {
  if (outlineLayer) {
    renderController.clearLayer(outlineLayer);
  }
}

function drawSegment(segment: PathSegmentModel): void {
  if (!outlineLayer) return;

  const selected = viewStore.selectedIndex.value === segment.index;
  const hasError = viewStore.issues.value.some(issue => issue.segmentIndex === segment.index);
  const color = hasError ? 0xf56c6c : selected ? 0x1677ff : 0x409eff;
  const width = selected ? 4 : 2;

  const visiblePath = new Graphics();
  drawPolyline(visiblePath, segment.projectedPoints);
  visiblePath.stroke({
    width,
    color,
    alpha: selected ? 1 : 0.85,
  });
  outlineLayer.addChild(visiblePath);

  const hitPath = new Graphics();
  drawPolyline(hitPath, segment.projectedPoints);
  hitPath.stroke({
    width: 16,
    color: 0xffffff,
    alpha: 0.001,
  });
  hitPath.eventMode = "static";
  hitPath.cursor = "pointer";
  hitPath.on("pointertap", () => selectSegment(segment.index));
  outlineLayer.addChild(hitPath);

  if (selected && segment.type === "arc" && segment.projectedCenter) {
    drawArcHelper(segment);
  }
}

function drawPolyline(graphics: Graphics, points: PathSegmentModel["projectedPoints"]): void {
  if (!points.length) return;

  graphics.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    graphics.lineTo(point.x, point.y);
  }
}

function drawArcHelper(segment: PathSegmentModel): void {
  if (!outlineLayer || !segment.projectedCenter || !segment.projectedPoints.length) return;

  const helper = new Graphics();
  const center = segment.projectedCenter;
  const start = segment.projectedPoints[0];
  const end = segment.projectedPoints[segment.projectedPoints.length - 1];

  helper.circle(center.x, center.y, 3).fill({ color: 0x303133 });
  helper.moveTo(center.x, center.y).lineTo(start.x, start.y).stroke({ width: 1, color: 0x909399, alpha: 0.8 });
  helper.moveTo(center.x, center.y).lineTo(end.x, end.y).stroke({ width: 1, color: 0x909399, alpha: 0.8 });

  outlineLayer.addChild(helper);
}

function selectSegment(index: number): void {
  viewStore.setSelectedIndex(index);
  emits("update:selectedIndex", index);
  emits("selectSegment", index);
}
</script>

<style scoped lang="scss">
.path-2d-outline {
  display: none;
}
</style>
