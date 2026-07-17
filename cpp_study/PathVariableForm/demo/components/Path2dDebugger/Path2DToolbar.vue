<!-- Path2D 工具栏：提供视图操作和调试图层开关。 -->
<template>
  <div class="path-2d-toolbar">
    <div class="toolbar-title">
      <span>2D轮廓调试</span>
      <em>{{ viewStore.pathStatusText.value }}</em>
    </div>

    <div class="toolbar-actions">
      <el-button size="small" @click="emitFitView">适应</el-button>
      <el-button
        size="small"
        title="原寸显示：1单位=1像素，优先居中选中线段"
        @click="emitResetView"
      >
        1:1
      </el-button>
      <el-switch
        :model-value="viewStore.showPoints.value"
        size="small"
        active-text="点"
        @click.stop="toggleShowPoints"
      />
      <el-switch
        :model-value="viewStore.showLabels.value"
        size="small"
        active-text="段号"
        @click.stop="toggleShowLabels"
      />
      <el-switch
        :model-value="viewStore.showGrid.value"
        size="small"
        active-text="网格"
        @click.stop="toggleShowGrid"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { bus } from "@/utils/bus";
import type { Path2dDebuggerStore } from "../../store/Path2dDebuggerStore";

const viewStoreContext = inject<{ store: Path2dDebuggerStore }>("renderStore");

if (!viewStoreContext) {
  throw new Error("Path2DToolbar must be used inside Path2dDebugger");
}

const viewStore = viewStoreContext.store;

/** 通知视图层执行适应画布操作。 */
function emitFitView(): void {
  bus.emit("onFitView");
}

/** 通知视图层恢复默认视图。 */
function emitResetView(): void {
  bus.emit("onResetView");
}

/** 使用显式点击切换，兼容不同 Element Plus 版本的 Switch 事件行为。 */
function toggleShowPoints(): void {
  viewStore.setShowPoints(!viewStore.showPoints.value);
}

function toggleShowLabels(): void {
  viewStore.setShowLabels(!viewStore.showLabels.value);
}

function toggleShowGrid(): void {
  viewStore.setShowGrid(!viewStore.showGrid.value);
}
</script>

<style scoped lang="scss">
.path-2d-toolbar {
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  min-height: 42px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color);
  background: #fff;
  box-sizing: border-box;
  pointer-events: auto;
}

.toolbar-title,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-title {
  color: #303133;
  font-size: 14px;
}

.toolbar-title em {
  color: #909399;
  font-size: 12px;
  font-style: normal;
}
</style>
