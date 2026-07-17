<!-- Path2D 坐标轴覆盖层：显示固定在画布左下角的 X/Z 投影方向。 -->
<template>
  <div class="path-2d-axis" aria-hidden="true">
    <span class="axis-origin"></span>
    <span class="axis-line axis-x"><em>{{ viewStore.projectionAxes.value.horizontal }}</em></span>
    <span class="axis-line axis-z"><em>{{ viewStore.projectionAxes.value.vertical }}</em></span>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import type { Path2dDebuggerStore } from "../../store/Path2dDebuggerStore";

const viewStoreContext = inject<{ store: Path2dDebuggerStore }>("renderStore");

if (!viewStoreContext) {
  throw new Error("Path2DAxis must be used inside Path2dDebugger");
}

const viewStore = viewStoreContext.store;
</script>

<style scoped lang="scss">
.path-2d-axis {
  position: absolute;
  left: 18px;
  // 坐标轴属于 layout 覆盖层，需要避开底部状态栏和问题栏。
  bottom: 90px;
  width: 82px;
  height: 82px;
  z-index: 2;
  color: var(--el-text-color-primary);
  pointer-events: none;
}

.axis-origin {
  position: absolute;
  left: 10px;
  top: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #303133;
  transform: translate(-50%, -50%);
}

.axis-line {
  position: absolute;
  left: 10px;
  top: 10px;
  display: block;

  &::after {
    position: absolute;
    content: "";
    width: 0;
    height: 0;
  }

  em {
    position: absolute;
    font-size: 11px;
    font-style: normal;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }
}

.axis-x {
  width: 54px;
  height: 2px;
  background: #f56c6c;

  &::after {
    right: -1px;
    top: -4px;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 8px solid #f56c6c;
  }

  em {
    right: -22px;
    top: -5px;
    color: #c45656;
  }
}

.axis-z {
  width: 2px;
  height: 54px;
  background: #67c23a;
  transform: translateX(-1px);

  &::after {
    left: -4px;
    bottom: -1px;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid #67c23a;
  }

  em {
    left: -4px;
    bottom: -20px;
    color: #529b2e;
  }
}
</style>
