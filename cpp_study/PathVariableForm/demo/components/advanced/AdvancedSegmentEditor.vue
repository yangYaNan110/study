<template>
  <!-- 线段编辑器组合表格和弹窗，具体数据变更统一委托给 PathEditorStore。 -->
  <div class="advanced-segment-editor">
    <!-- 表格中的合并行仅用于视觉分隔，不会写入 Store。 -->
    <LineSegmentTable
      :max-height="340"
      :data="tableSegments"
      :selected-index="store.selectedSegmentIndex.value"
      @add-line-segment="openAddDialog"
      @edit-line-segment="openEditDialog"
      @delete-line-segment="deleteSegment"
      @select-line-segment="selectSegment"
    />
    <el-button class="advanced-segment-editor__add" link @click="openAddDialog(-1)">＋ 新增线段</el-button>

    <LineSegmentForm
      v-model="dialogVisible"
      :add-or-edit-flag="isAdding"
      :form-data="formData"
      :path-info="store.advancedPathInfo.value"
      :insert-index="insertIndex"
      @confirm="confirmSegment"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import LineSegmentForm from "./LineSegmentForm.vue";
import LineSegmentTable from "./LineSegmentTable.vue";
import { usePathEditorContext } from "../../store/PathEditorStore";

const { store } = usePathEditorContext();

/** 表格插入行是视图辅助数据，真实线段仍只保存在 Store 中。 */
const tableSegments = computed(() => {
  const result: any[] = [];
  for (const [index, segment] of store.advancedSegments.value.entries()) {
    result.push(segment);
    if (index < store.advancedSegments.value.length - 1) result.push({ isMergeRow: true });
  }
  return result;
});

// 以下状态只描述当前弹窗交互，线段实体仍由 Store 维护。
const dialogVisible = ref(false);
const isAdding = ref(true);
const insertIndex = ref(-1);
const editIndex = ref(-1);
const formData = ref(createInitialForm());

const openAddDialog = (index = -1): void => {
  isAdding.value = true;
  insertIndex.value = index;
  formData.value = createInitialForm();
  dialogVisible.value = true;
};

const openEditDialog = (row: any, tableIndex: number): void => {
  isAdding.value = false;
  editIndex.value = toRawIndex(tableIndex);
  formData.value = toFormData(row);
  dialogVisible.value = true;
};

const confirmSegment = (data: any): void => {
  if (isAdding.value) {
    store.addAdvancedSegment(data, insertIndex.value);
  } else {
    store.updateAdvancedSegment(editIndex.value, data);
  }
  dialogVisible.value = false;
};

const deleteSegment = (tableIndex: number): void => {
  store.deleteAdvancedSegment(toRawIndex(tableIndex));
};

const selectSegment = (_row: any, visibleIndex: number): void => {
  store.setSelectedSegmentIndex(visibleIndex);
};

function createInitialForm(): any {
  // 新增线段使用与旧高级模式兼容的默认表单结构。
  return {
    type: "line",
    startPoint: { x: "", y: "", z: "" },
    endPoint: { x: "", y: "", z: "" },
    arcDirection: true,
    radius: "",
    count: "",
  };
}

function toFormData(row: any): any {
  const value = (item: any): string => {
    if (item && typeof item === "object") return String(item.content ?? item.value ?? "");
    return String(item ?? "");
  };
  return {
    type: row?.type,
    startPoint: { x: value(row?.startPoint?.x), y: value(row?.startPoint?.y), z: value(row?.startPoint?.z) },
    endPoint: { x: value(row?.endPoint?.x), y: value(row?.endPoint?.y), z: value(row?.endPoint?.z) },
    arcDirection: row?.arcDirection,
    radius: value(row?.radius),
    count: value(row?.count),
  };
}

function toRawIndex(tableIndex: number): number {
  // 将包含视觉合并行的表格索引转换为真实线段数组索引。
  return tableSegments.value.slice(0, tableIndex).filter(segment => !segment.isMergeRow).length;
}
</script>

<style scoped lang="scss">
.advanced-segment-editor {
  // 高级模式线段编辑区保持 380px 高度，表格主体超出后由 Element Plus 内部滚动。
  height: 380px;
  max-height: 380px;
  overflow: hidden;
  display: grid;
  gap: 8px;
}

.advanced-segment-editor__add {
  width: 100%;
}
</style>
