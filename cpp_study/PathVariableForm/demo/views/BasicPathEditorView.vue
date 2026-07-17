<template>
  <div class="basic-path-editor-view">
    <!-- BasicVariableInfoView：基础模式下的变量公共信息。 -->
    <div class="basic-path-editor-view__variable-info">
      <BasicVariableInfoView />
    </div>

    <!-- BasicTemplateEditorView：模板选择和当前模板编辑。 -->
    <div class="basic-path-editor-view__template-editor">
      <BasicTemplateEditorView />
    </div>
  </div>
</template>

<script setup lang="ts">
import BasicTemplateEditorView from "../components/basic/BasicTemplateEditorView.vue";
import BasicVariableInfoView from "../components/basic/BasicVariableInfoView.vue";

// 当前阶段先迁移基础模式的布局结构和样式，暂不接入旧版业务数据。
</script>

<style scoped lang="scss">
.basic-path-editor-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  min-width: 0;
  width: 100%;
}

.basic-path-editor-view__variable-info,
.basic-path-editor-view__template-editor,
.basic-path-editor-view__corner-editor {
  min-width: 0;
}
</style>
