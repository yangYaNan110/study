<template>
  <el-form-item label="模板选择">
    <el-select v-model="activeTemplate">
      <el-option
        v-for="template in store.templateOptions"
        :key="template.value"
        :label="template.label"
        :value="template.value"
      />
    </el-select>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRAngleEditContext } from "../store";
import type { RAngleTemplateType } from "../types";

const { store } = useRAngleEditContext();

/** 模板选择组件只负责展示选项和转发当前模板切换。 */
const activeTemplate = computed<RAngleTemplateType>({
  get: (): RAngleTemplateType => store.templateType.value,
  set: (value: RAngleTemplateType): void => store.switchTemplate(value),
});
</script>
