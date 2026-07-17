<template>
  <!-- 与正式 PathVariableForm 保持一致，使用 Element Plus 默认 Tab 样式。 -->
  <el-tabs v-model="activeMode" class="demo-tabs">
    <!-- 手工/DXF 来源下基础模式不可用，规则与旧版 basicEditorEnabled 一致。 -->
    <el-tab-pane :disabled="basicDisabled" label="基础" name="basic" />
    <el-tab-pane label="高级" name="advanced" />
  </el-tabs>
</template>

<script setup lang="ts">
import { computed } from "vue";

type PathEditorMode = "basic" | "advanced";

const props = defineProps<{
  modelValue: PathEditorMode;
  basicDisabled?: boolean;
}>();

const emits = defineEmits<{
  (event: "update:modelValue", value: PathEditorMode): void;
}>();

/** 将 Element Plus Tab 的内部值转发给页面级编辑 Store。 */
const activeMode = computed<PathEditorMode>({
  get: (): PathEditorMode => props.modelValue,
  set: (value: PathEditorMode): void => emits("update:modelValue", value),
});
</script>
