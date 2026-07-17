<!-- Path2D 问题列表：展示路径校验结果，并支持定位到对应线段。 -->
<template>
  <div class="path-2d-checks">
    <button
      v-for="issue in viewStore.issues.value"
      :key="issue.id"
      :class="['check-item', issue.level]"
      type="button"
      @click="focusIssue(issue)"
    >
      {{ issue.message }}
    </button>
    <span v-if="!viewStore.issues.value.length" class="check-ok">
      未发现连接异常
    </span>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { bus } from "@/utils/bus";
import type { Path2dDebuggerStore, PathIssue } from "../store";

const viewStoreContext = inject<{ store: Path2dDebuggerStore }>("renderStore");

if (!viewStoreContext) {
  throw new Error("Path2DChecks must be used inside Path2dDebugger");
}

const viewStore = viewStoreContext.store;

const emits = defineEmits<{
  (event: "selectSegment", index: number): void;
}>();

/** 选中问题关联的线段，并通知视图控制组件完成定位。 */
function focusIssue(issue: PathIssue): void {
  if (typeof issue.segmentIndex !== "number") return;

  viewStore.setSelectedIndex(issue.segmentIndex);
  emits("selectSegment", issue.segmentIndex);
  bus.emit("onFocusSegment", issue.segmentIndex);
}
</script>

<style scoped lang="scss">
.path-2d-checks {
  grid-row: 4;
  position: relative;
  min-height: 36px;
  padding: 6px 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: rgba(255, 255, 255, 0.94);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  pointer-events: auto;
}

.check-item {
  border: 0;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;

  &.warning {
    background: #fdf6ec;
    color: #b88230;
  }

  &.error {
    background: #fef0f0;
    color: #c45656;
  }
}

.check-ok {
  color: var(--el-color-success);
  font-size: 12px;
}
</style>
