<template>
  <div class="advanced-path-editor-view">
    <!-- 高级模式的公共变量信息：负责目录、名称和引用名编辑。 -->
    <VariableInfoForm />
    <!-- DXF 导入区域：负责坐标轴选择和文件导入入口。 -->
    <AdvancedDxfImportPanel />
    <!-- 线段编辑区域：负责线段列表、增删改以及编辑弹窗。 -->
    <AdvancedSegmentEditor />
  </div>
</template>

<script setup lang="ts">
import AdvancedDxfImportPanel from "../components/advanced/AdvancedDxfImportPanel.vue";
import AdvancedSegmentEditor from "../components/advanced/AdvancedSegmentEditor.vue";
import VariableInfoForm from "../components/common/VariableInfoForm.vue";

/** 高级模式视图只负责组合公共信息、DXF 操作和线段编辑三个区域。 */
</script>

<style scoped lang="scss">
.advanced-path-editor-view {
  display: grid;
  gap: 12px;
  min-width: 0;
}
</style>
