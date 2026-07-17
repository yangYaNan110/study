<!-- path2d调试组件 -->
<!-- 使用类似rect里的provider context来开发这一块 不然这个文件里的代码太多了 不方便扩展和维护以及阅读 -->
<template>
  <div class="path-debugger">
    <!-- 这个div下面存放画布  画布组件  提供画布 以及绘制管理-->
    <div ref="canvasRef" class="debugger-canvas">
      <!-- 增加各种插件组件 提供各种绘制能力  这些-->
      <!-- 网格图层组件 -->
      <Path2DGrid />
      <!-- 绘制路径轮廓、选中态和轮廓交互。 -->
      <Path2DOutline
        @update:selected-index="index => (store.setSelectedIndex(index), $emit('update:selectedIndex', index))"
        @select-segment="index => $emit('selectSegment', index)"
      />
      <!-- 绘制路径段的起点和终点。 -->
      <Path2DPoints />
      <!-- 绘制路径段编号、标签背景和标签边框。 -->
      <Path2DLabels />
      <!-- 监听容器尺寸并同步 Pixi 画布大小。 -->
      <Path2DViewport />
      <!-- 启用 Pixi 内置相机的滚轮缩放能力。 -->
      <Path2DZoom />
    </div>
    <!-- 这个画布下面存放界面UI 使用相对定位 浮动在画布上 -->
    <div class="layout">
      <!-- UI布局组件 这些组件会条用数据状态实例 更改数据 数据会驱动画布渲染 -->
      <!-- Path2D 工具栏：负责视图适应、1:1 重置以及点/段号/网格显示开关。 -->
      <Path2DToolbar />
      <!-- Path2D 状态栏：展示当前选中线段和投影方向。 -->
      <Path2DStatus />
      <!-- Path2D 问题列表：展示校验结果并支持定位对应线段。 -->
      <Path2DChecks
        @select-segment="
          index => (store.setSelectedIndex(index), $emit('update:selectedIndex', index), $emit('selectSegment', index))
        "
      />
      <!-- Path2D 坐标轴 UI 覆盖层：显示当前投影面的正方向。 -->
      <Path2DAxis />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import Path2DGrid from "../components/Path2dDebugger/Path2DGrid.vue";
import Path2DOutline from "../components/Path2dDebugger/Path2DOutline.vue";
import Path2DPoints from "../components/Path2dDebugger/Path2DPoints.vue";
import Path2DLabels from "../components/Path2dDebugger/Path2DLabels.vue";
import Path2DToolbar from "../components/Path2dDebugger/Path2DToolbar.vue";
import Path2DStatus from "../components/Path2dDebugger/Path2DStatus.vue";
import Path2DChecks from "../components/Path2dDebugger/Path2DChecks.vue";
import Path2DViewport from "../components/Path2dDebugger/Path2DViewport.vue";
import Path2DZoom from "../components/Path2dDebugger/Path2DZoom.vue";
import Path2DAxis from "../components/Path2dDebugger/Path2DAxis.vue";
import { RenderController } from "../controller/Path2dRenderController";
import { Path2dDebuggerStore } from "../store/Path2dDebuggerStore";

const props = withDefaults(
  defineProps<{
    segments?: any[];
    selectedIndex?: number;
  }>(),
  {
    segments: () => [],
    selectedIndex: -1,
  },
);
const emits = defineEmits<{
  (event: "update:selectedIndex", index: number): void;
  (event: "selectSegment", index: number): void;
}>();
const canvasRef = ref<HTMLDivElement | null>(null);
// 数据管理状态机- 处理和维护业务数据的
const store = new Path2dDebuggerStore();
// 渲染器 因为使用的是pixi引擎 所有 底层绘制组件 都用它 或者自己取出canvas自己绘制也行
// 渲染控制器 - 控制各个渲染组件的渲染的
const renderController = new RenderController();

// 渲染上下文 为子孙组件提供必要的对象或接口
provide("renderController", {
  renderController,
});
// 数据状态 上下文  Ui或者画布都是通过改变数据 来互相驱动的
provide("renderStore", {
  store,
});
onMounted(async (): Promise<void> => {
  if (!canvasRef.value) {
    return;
  }
  await renderController.init(canvasRef.value);
});

onBeforeUnmount(() => {
  renderController.unmount();
});

/** 兼容模板传入数组或 Ref 的情况，避免调试器 Store 展开非数组值。 */
const normalizeSegments = (value: unknown): readonly unknown[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "value" in value) {
    const refValue = (value as { value?: unknown }).value;
    return Array.isArray(refValue) ? refValue : [];
  }
  return [];
};

watch(
  () => props.segments,
  segments => {
    store.setSegments(normalizeSegments(segments));
    // 原始路径变化后由 Store 统一重建 segmentModels 和 issues。
    store.setSegments(segments);
  },
  {
    immediate: true,
    deep: true,
  },
);

watch(
  () => props.selectedIndex,
  index => {
    store.setSelectedIndex(index ?? -1);
    // 外部选中状态变化时同步到调试器内部 Store。
    store.setSelectedIndex(index ?? -1);
  },
  {
    immediate: true,
  },
);
</script>
<style scoped lang="scss">
.path-debugger {
  height: 100%;
  min-height: 420px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(300px, 1fr) auto auto;
}

.debugger-canvas {
  grid-row: 2;
  position: relative;
  width: 100%;
  height: auto;
  min-height: 300px;
  overflow: hidden;
  background: #fafafa;

  // Pixi 动态插入的 canvas 不带当前组件的 scoped 属性，需要使用 :deep。
  :deep(canvas) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
}
.layout {
  display: contents;
  // 空的 UI 覆盖层不能拦截 canvas 的 wheel、pointer 等事件。
  pointer-events: none;
}
</style>
