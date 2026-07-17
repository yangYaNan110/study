<!-- 基础模板编辑入口：创建真实 Store，并通过 provider 提供给所有基础子组件。 -->
<template>
  <div class="r-angle-edit">
    <!-- 基础变量信息区域：子组件通过 provider Store 读取名称和引用名并提交修改。 -->
    <BasicVariableInfoView />

    <!-- 基础模板编辑区域：子组件通过 provider Store 完成模板切换和参数编辑。 -->
    <BasicTemplateEditorView />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, watch } from "vue";
import BasicTemplateEditorView from "./components/BasicTemplateEditorView.vue";
import BasicVariableInfoView from "./components/BasicVariableInfoView.vue";
import { RAngleEditStore, RANGLE_EDIT_CONTEXT } from "./store";
import { bus } from "@/utils/bus";

const props = defineProps<{
  /** 外层 PathVariableForm 传入的变量编辑上下文，真实 Store 从中读取 modelValue。 */
  contextProps?: Record<string, unknown>;
}>();

const emit = defineEmits<{
  /** 将 Store 草稿生成的预览线段暴露给外层预览，不写回外层变量。 */
  (event: "previewSegments", segments: unknown[]): void;
}>();

const contextProps = props.contextProps;
const modelValue = contextProps?.modelValue as { name?: string; refName?: string; contourInfo?: unknown } | undefined;
const addOrSave = Boolean(contextProps?.addOrSave ?? true);

/** 每个入口实例独立创建真实编辑会话，避免不同变量编辑窗口共享模板对象。 */
const store = new RAngleEditStore(modelValue, addOrSave);
provide(RANGLE_EDIT_CONTEXT, { store });

/** 变量值变化后沿旧版 refreshCount 链路刷新表达式预览，避免 Store 保留旧的 0 值。 */
const refreshExpressionValues = (): void => {
  store.refreshExpressionValues();
};

/** 暴露确认/取消接口给外层 PathVariableForm，保持弹窗级保存链路由父级统一控制。 */
defineExpose({
  commit: (): void => store.commit(),
  cancel: (): void => store.cancel(),
});

/** 监听真实模板线段变化，为外层 Path2dDebugger 保留稳定预览事件出口。 */
watch(
  () => store.previewSegments.value,
  segments => {
    // 每次模板参数变化都发出新的数组引用，确保外层基础模式草稿和右侧 Debug 重新接收线段。
    emit("previewSegments", [...segments]);
  },
  { immediate: true, deep: true },
);

onMounted(() => {
  bus.on("refreshCount", refreshExpressionValues);
});

onBeforeUnmount(() => {
  bus.off("refreshCount", refreshExpressionValues);
});
</script>

<style scoped lang="scss">
.r-angle-edit {
  display: grid;
  gap: 16px;
  min-width: 0;
  width: 100%;
}
</style>
