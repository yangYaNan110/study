<!-- 基础模板编辑容器：负责模板选择和动态组件分发，不处理具体模板参数。 -->
<template>
  <div class="basic-template-editor-view">
    <div class="basic-template-editor-view__selectors">
      <TemplateSelect />
      <ProjectionSelect />
    </div>

    <!-- 动态模板区域：已实现模板展示编辑 UI，未实现模板展示空状态。 -->
    <div class="basic-template-editor-view__content">
      <!-- 矩形模板编辑器：读取 Store 矩形草稿并提交尺寸、角点修改。 -->
      <RectTemplateEditor v-if="activeTemplate === 'rect'" />
      <!-- 圆形模板编辑器：读取 Store 圆形草稿并提交半径修改。 -->
      <CircleTemplateEditor v-else-if="activeTemplate === 'circle'" />
      <!-- L 型模板占位：保留切换入口，暂不生成真实模板数据。 -->
      <LShapeTemplateEditor v-else-if="activeTemplate === 'l-shape'" />
      <!-- 梯形模板占位：后续在组件内部扩展参数编辑。 -->
      <TrapezoidTemplateEditor v-else-if="activeTemplate === 'trapezoid'" />
      <!-- 斜切边模板占位：后续在组件内部扩展参数编辑。 -->
      <BevelTemplateEditor v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BevelTemplateEditor from "./BevelTemplateEditor.vue";
import CircleTemplateEditor from "./CircleTemplateEditor.vue";
import LShapeTemplateEditor from "./LShapeTemplateEditor.vue";
import ProjectionSelect from "./ProjectionSelect.vue";
import RectTemplateEditor from "./RectTemplateEditor.vue";
import TemplateSelect from "./TemplateSelect.vue";
import TrapezoidTemplateEditor from "./TrapezoidTemplateEditor.vue";
import { useRAngleEditContext } from "../store";
import type { RAngleTemplateType } from "../types";

const { store } = useRAngleEditContext();

/** 动态模板区域继续使用 Store 中的当前模板类型进行组件分发。 */
const activeTemplate = computed<RAngleTemplateType>(() => store.templateType.value);
</script>

<style scoped lang="scss">
.basic-template-editor-view {
  display: grid;
  gap: 16px;
  width: 100%;
}

.basic-template-editor-view__content {
  height: 380px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.basic-template-editor-view__selectors {
  width: 100%;
}

.basic-template-editor-view__selectors :deep(.el-form-item) {
  width: 100%;
  margin-bottom: 12px;
}

.basic-template-editor-view__selectors :deep(.el-form-item__label) {
  width: 90px;
  flex: 0 0 90px;
}

.basic-template-editor-view__selectors :deep(.el-form-item__content) {
  min-width: 0;
  flex: 1;
}

.basic-template-editor-view__selectors :deep(.el-select) {
  width: 100%;
}
</style>
