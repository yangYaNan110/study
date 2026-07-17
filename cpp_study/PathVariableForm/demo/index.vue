<!-- PathVariableForm 新结构迁移 demo 入口，暂不接入正式旧入口。 -->
<template>
  <div class="path-editor-demo">
    <!-- PathEditorHeaderView：标题、变量基础信息和关闭操作。 -->
    <div class="path-editor-demo__header">
      <!-- 计划使用：views/PathEditorHeaderView.vue -->
    </div>

    <div class="path-editor-demo__body">
      <!-- PathEditorModeView：基础模式和高级模式的切换。 -->
      <div class="path-editor-demo__mode-tabs">
        <!-- PathEditorModeView：编辑模式切换组件。 -->
        <PathEditorModeView v-model="activeMode" :basic-disabled="!editorStore.basicEditorEnabled" />
      </div>

      <div class="path-editor-demo__content">
        <div class="path-editor-demo__editor">
          <!-- BasicPathEditorView：基础模式编辑组件。 -->
          <BasicPathEditorView v-if="activeMode === 'basic'" />
          <!-- AdvancedPathEditorView：高级模式编辑组件。 -->
          <AdvancedPathEditorView v-else />
        </div>

        <div class="path-editor-demo__preview">
          <!-- Path2dPreviewView：Path2D 预览组件。 -->
          <Path2dPreviewView
            :segments="editorStore.previewSegments"
            :selected-index="editorStore.selectedSegmentIndex"
            @update:selected-index="editorStore.setSelectedSegmentIndex"
          />
        </div>
      </div>
    </div>

    <!-- PathEditorFooterView：保存、取消和表单校验结果。 -->
    <div class="path-editor-demo__footer">
      <PathEditorFooterView @save="handleSave" @cancel="handleCancel" />
      <!-- 计划使用：views/PathEditorFooterView.vue -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, watch } from "vue";
import AdvancedPathEditorView from "./views/AdvancedPathEditorView.vue";
import BasicPathEditorView from "./views/BasicPathEditorView.vue";
import Path2dPreviewView from "./views/Path2dPreviewView.vue";
import PathEditorFooterView from "./views/PathEditorFooterView.vue";
import PathEditorModeView from "./views/PathEditorModeView.vue";
import { PATH_EDITOR_CONTEXT, PathEditorStore } from "./store/PathEditorStore";

type PathEditorMode = "basic" | "advanced";

const props = withDefaults(
  defineProps<{
    modelValue: any;
    addOrSave: boolean;
    directoryNameList: any[];
  }>(),
  {
    modelValue: undefined,
    addOrSave: true,
    directoryNameList: () => [],
  },
);

const emits = defineEmits<{
  (event: "confirm"): void;
  (event: "cancle"): void;
}>();

/** demo 根入口创建唯一编辑会话，所有后代组件共享同一个 Store。 */
const editorStore = new PathEditorStore(props.modelValue);
provide(PATH_EDITOR_CONTEXT, { store: editorStore });

/** 监听外部变量替换，确保编辑已有 Path 时不会继续显示 Store 的新建默认值。 */
watch(
  () => props.modelValue,
  model => editorStore.loadModel(model),
  { immediate: true },
);

/** 页面模式直接映射编辑 Store，切换高级模式时同步切换预览数据源。 */
const activeMode = computed<PathEditorMode>({
  get: (): PathEditorMode => editorStore.editorMode.value,
  set: (mode: PathEditorMode): void => editorStore.switchMode(mode),
});

/** 保存当前 demo 草稿；正式入口接入后再将结果映射为 confirm 事件。 */
const handleSave = (): void => {
  if (editorStore.saveToModel(props.modelValue)) emits("confirm");
};

/** 取消当前编辑并恢复 Store 中最近一次保存的快照。 */
const handleCancel = (): void => {
  editorStore.cancel();
  emits("cancle");
};
</script>

<style scoped lang="scss">
.path-editor-demo {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 600px;
  width: 100%;
}

.path-editor-demo__body {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
}

.path-editor-demo__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.9fr);
  gap: 16px;
  min-height: 0;
}

.path-editor-demo__editor,
.path-editor-demo__preview {
  min-width: 0;
}

@media (max-width: 1040px) {
  .path-editor-demo__content {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
