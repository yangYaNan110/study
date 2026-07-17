<template>
  <!-- 线段展示表格：合并行只用于提供插入按钮，真实数据由父组件和 Store 管理。 -->
  <el-table
    :data="data"
    border
    :span-method="spanMethod"
    :row-class-name="rowClassName"
    @row-click="handleRowClick"
  >
    <el-table-column type="index" label="序号" width="50">
      <template #default="{ row, $index }">
        <div style="display: flex; justify-content: center; align-items: center" v-if="row.isMergeRow">
          <el-button @click="addLineSegment($index)" size="small" link>
            <SvgIcon icon-class="Plus" />
          </el-button>
        </div>
        <div v-else>{{ getVisibleIndex($index) }}</div>
      </template>
    </el-table-column>
    <el-table-column prop="type" label="线段类型">
      <template #default="{ row, $index }">
        <div>
          <div>{{ row.type === "line" ? "线段" : "圆弧" }}</div>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="startPoint" label="起始点">
      <template #default="{ row }">
        <span>{{ displayPoint(row.startPoint) }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="endPoint" label="终止点">
      <template #default="{ row }">
        <span>{{ displayPoint(row.endPoint) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="半径">
      <template #default="{ row }">
        <span>{{ displayExpressionValue(row.radius) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="数量">
      <template #default="{ row }">
        <span>{{ displayExpressionValue(row.count) }}</span>
      </template>
    </el-table-column>
    <el-table-column fixed="right" label="操作">
      <template #default="{ row, $index }">
        <el-button @click.stop="deleteVariable($index)" size="small" link>
          <el-icon><Delete /></el-icon>
        </el-button>
        <el-button @click.stop="editVariable(row, $index)" size="small" link>
          <el-icon><Edit /></el-icon>
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { Delete, Edit } from "@element-plus/icons-vue";
const props = withDefaults(
  defineProps<{
    data: any;
    selectedIndex?: number;
  }>(),
  {
    selectedIndex: -1,
  },
);

const emits = defineEmits<{
  (e: "addLineSegment", index: number);
  (e: "editLineSegment", row: any, index: number);
  (e: "deleteLineSegment", index: number);
  (e: "selectLineSegment", row: any, visibleIndex: number, rawIndex: number);
}>();

const addLineSegment = index => {
  emits("addLineSegment", (index - 1) / 2);
};

const editVariable = (row, index) => {
  emits("editLineSegment", row, index);
};

const deleteVariable = index => {
  emits("deleteLineSegment", index);
};

const handleRowClick = row => {
  if (row?.isMergeRow) return;
  const rawIndex = props.data.indexOf(row);
  const visibleIndex = getVisibleIndex(rawIndex) - 1;
  emits("selectLineSegment", row, visibleIndex, rawIndex);
};

const spanMethod = ({ row, columnIndex }) => {
  if (row?.isMergeRow) {
    if (columnIndex === 0) {
      return { rowspan: 1, colspan: 7 };
    }
    return { rowspan: 0, colspan: 0 };
  }
  return { rowspan: 1, colspan: 1 };
};

const rowClassName = ({ row, rowIndex }) => {
  if (row?.isMergeRow) return "special-row";
  return getVisibleIndex(rowIndex) - 1 === props.selectedIndex ? "selected-row" : "";
};

const getVisibleIndex = (currentIndex: number) => {
  let count = 0;
  for (let i = 0; i <= currentIndex; i++) {
    if (!props.data[i]?.isMergeRow) {
      count++;
    }
  }
  return count;
};

const displayExpressionValue = value => {
  if (!value) return "";
  if (typeof value === "object") {
    if ("value" in value && value.value !== undefined) {
      return value.value;
    }
    if ("content" in value) {
      return value.content;
    }
  }
  return value;
};

const displayPoint = point => {
  if (!point) return "";
  return [displayExpressionValue(point.x), displayExpressionValue(point.y), displayExpressionValue(point.z)].join(" - ");
};
</script>

<style lang="scss" scoped>
.special-row {
  background-color: #fdf6ec;
}
.special-row :deep(.el-table__cell) {
  padding: 0 !important;
}
:deep(.special-row .el-table__cell) {
  padding: 0 !important;
}
.special-content {
  width: 100%;
  padding: 10px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
:deep(.el-scrollbar__wrap) {
  padding-bottom: 15px !important;
}
:deep(.selected-row .el-table__cell) {
  background-color: #ecf5ff !important;
}
:deep(.el-table__row:not(.special-row)) {
  cursor: pointer;
}
</style>
