<!-- Path2D 状态栏：展示当前选中线段和投影方向。 -->
<template>
  <div class="path-2d-status">
    <span>{{ viewStore.selectedStatusText.value }}</span>
    <span>
      {{ viewStore.projectionText.value }}（{{ viewStore.projectionAxes.value.horizontal }}
      向右 / {{ viewStore.projectionAxes.value.vertical }} 向下）
    </span>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import type { Path2dDebuggerStore } from "../store";

const viewStoreContext = inject<{ store: Path2dDebuggerStore }>("renderStore");

if (!viewStoreContext) {
  throw new Error("Path2DStatus must be used inside Path2dDebugger");
}

const viewStore = viewStoreContext.store;
</script>

<style scoped lang="scss">
.path-2d-status {
  grid-row: 3;
  position: relative;
  min-height: 32px;
  padding: 6px 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: rgba(255, 255, 255, 0.94);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  pointer-events: none;
}
</style>
