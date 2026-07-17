<!-- Path2D 画布尺寸同步组件：只负责监听容器尺寸并通知 RenderController。 -->
<template>
  <div class="path-2d-viewport" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, watch } from "vue";
import { bus } from "@/utils/bus";
import type { RenderController } from "../../controller/Path2dRenderController";
import { Path2dDebuggerService } from "../../service/Path2dDebuggerService";
import type { Path2dDebuggerStore } from "../../store/Path2dDebuggerStore";

const context = inject<{ renderController: RenderController }>("renderController");
const viewStoreContext = inject<{ store: Path2dDebuggerStore }>("renderStore");

if (!context || !viewStoreContext) {
  throw new Error("Path2DViewport must be used inside Path2dDebugger");
}

const renderController = context.renderController;
const viewStore = viewStoreContext.store;
let resizeObserver: ResizeObserver | null = null;

/** Pixi 初始化完成后开始监听容器，并立即同步一次初始尺寸。 */
const handleRenderControllerInitEnd = (): void => {
  renderController.resizeToContainer();
  fitView();

  const container = renderController.renderContainer;
  if (!container) return;

  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(() => {
    // 容器尺寸变化只更新 renderer 尺寸，不负责任何业务图形绘制。
    renderController.resizeToContainer();
  });
  resizeObserver.observe(container);
};

/** 响应工具栏等业务组件发出的 1:1 视图恢复事件。 */
const handleResetView = (): void => {
  resetView();
};

/** 响应工具栏发出的适应画布事件。 */
const handleFitView = (): void => {
  fitView();
};

/** 响应问题列表等业务组件发出的线段定位事件。 */
const handleFocusSegment = (index: number): void => {
  focusSegment(index);
};

watch(
  viewStore.segmentModels,
  () => {
    if (renderController.renderer) {
      fitView();
    }
  },
  { deep: true },
);

onMounted(() => {
  // 子组件先注册，等待父组件完成 Pixi 初始化后发送事件。
  bus.on("onRenderControllerInitEnd", handleRenderControllerInitEnd);
  bus.on("onResetView", handleResetView);
  bus.on("onFitView", handleFitView);
  bus.on("onFocusSegment", handleFocusSegment);
});

onBeforeUnmount(() => {
  // 组件卸载时取消事件和尺寸监听，避免保留 DOM 引用。
  bus.off("onRenderControllerInitEnd", handleRenderControllerInitEnd);
  bus.off("onResetView", handleResetView);
  bus.off("onFitView", handleFitView);
  bus.off("onFocusSegment", handleFocusSegment);
  resizeObserver?.disconnect();
  resizeObserver = null;
});

/** 使用 Store 当前路径包围盒执行旧版 fitView 行为。 */
function fitView(): void {
  if (viewStore.segmentModels.value.length) {
    renderController.fitView(viewStore.projectedBounds.value);
    bus.emit("onViewChanged");
    return;
  }

  renderController.centerRoot();
  bus.emit("onViewChanged");
}

function resetView(): void {
  const rect = renderController.renderContainer?.getBoundingClientRect();
  if (!rect || rect.width <= 1 || rect.height <= 1) return;

  if (!viewStore.segmentModels.value.length) {
    renderController.resetView();
    bus.emit("onViewChanged");
    return;
  }

  const bounds = Path2dDebuggerService.getResetViewBounds(
    viewStore.segmentModels.value,
    viewStore.selectedIndex.value,
    rect.width,
    rect.height,
  );
  renderController.resetView(bounds);
  bus.emit("onViewChanged");
}

function focusSegment(index: number): void {
  const segment = viewStore.segmentModels.value.find(item => item.index === index);
  if (!segment) return;

  const bounds = Path2dDebuggerService.getPointsBounds(segment.projectedPoints);
  renderController.focusView(bounds);
  bus.emit("onViewChanged");
}
</script>

<style scoped lang="scss">
.path-2d-viewport {
  display: none;
}
</style>
