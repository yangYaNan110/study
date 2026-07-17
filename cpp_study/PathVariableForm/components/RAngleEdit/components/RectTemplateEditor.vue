<!-- 矩形模板编辑器：展示尺寸、角点表格，并负责打开角点编辑弹窗。 -->
<template>
  <div class="rect-template-editor">
    <el-form label-width="80px">
      <el-form-item label="宽度">
        <!-- ExpressionEditor：复用旧版表达式输入和变量上下文能力，输入变化通过 v-model 写回 Store。 -->
        <ExpressionEditor v-model="widthExpression" />
        <span class="expression-preview">预览 {{ store.getRectTemplateWValue() }}</span>
      </el-form-item>
      <el-form-item label="高度">
        <!-- ExpressionEditor：复用旧版表达式输入和变量上下文能力，输入变化通过 v-model 写回 Store。 -->
        <ExpressionEditor v-model="heightExpression" />
        <span class="expression-preview">预览 {{ store.getRectTemplateDValue() }}</span>
      </el-form-item>
    </el-form>

    <el-table :data="store.getRectTemplateCornerInfos()" border>
      <el-table-column prop="direction" label="角点" width="80" />
      <el-table-column label="类型" min-width="90">
        <template #default="{ row }">{{ cornerTypeLabel(row.type) }}</template>
      </el-table-column>
      <el-table-column label="R 表达式" min-width="110">
        <!-- 直角和斜切角没有圆角半径，禁止展示历史残留值。 -->
        <template #default="{ row }">{{ row.type === "Fillet" ? row.radiusExpression : "" }}</template>
      </el-table-column>
      <el-table-column label="R 值" width="80">
        <!-- 直角和斜切角没有圆角半径，预览值保持为空而不是 0。 -->
        <template #default="{ row }">{{ row.type === "Fillet" ? row.radius : "" }}</template>
      </el-table-column>
      <el-table-column label="圆弧分段数" width="100">
        <template #default="{ row }">{{ row.type === "Fillet" ? row.segmentCount : "" }}</template>
      </el-table-column>
      <el-table-column label="d 表达式" min-width="110">
        <!-- 只有斜切角展示切段距离表达式，避免直角和圆角残留无效字段。 -->
        <template #default="{ row }">{{ row.type === "Chamfer" ? row.cutDistanceExpression : "" }}</template>
      </el-table-column>
      <el-table-column label="d 值" width="80">
        <!-- 斜切距离按当前变量上下文展示计算值。 -->
        <template #default="{ row }">{{ row.type === "Chamfer" ? row.cutDistance : "" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="70" fixed="right">
        <template #default="{ row, $index }">
          <el-button link size="small" @click="openCornerEditor(row, $index)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 角点编辑弹窗：接收当前角点快照，确认后调用 Store 更新角点。 -->
    <RectCornerEditDialog
      v-model="dialogVisible"
      :corner="editingCorner"
      :index="editingIndex"
      @confirm="confirmCorner"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ExpressionEditor from "@/layout/components/ModelEditor/components/LeftPanel/pages/expression/ExpressionEditor.vue";
import RectCornerEditDialog from "./RectCornerEditDialog.vue";
import { useRAngleEditContext } from "../store";
import type { RAngleCornerInfo } from "../types";

const { store } = useRAngleEditContext();
const dialogVisible = ref(false);
const editingIndex = ref(-1);
const editingCorner = ref<RAngleCornerInfo | null>(null);

/** 使用可写 computed 将尺寸输入转换为 Store 更新方法。 */
const widthExpression = computed({
  get: (): string => store.getRectTemplateW(),
  set: (value: string): void => store.updateRectTemplateW(value),
});

const heightExpression = computed({
  get: (): string => store.getRectTemplateD(),
  set: (value: string): void => store.updateRectTemplateD(value),
});

const cornerTypeLabel = (type: RAngleCornerInfo["type"]): string => {
  if (type === "Fillet") return "圆角";
  if (type === "Chamfer") return "斜切";
  return "直角";
};

/** 打开角点弹窗时复制临时数据，取消时不回写 Store。 */
const openCornerEditor = (corner: RAngleCornerInfo, index: number): void => {
  editingIndex.value = index;
  editingCorner.value = { ...corner };
  dialogVisible.value = true;
};

/** 接收弹窗确认结果，统一通过 Store 更新角点并重建静态预览。 */
const confirmCorner = (corner: RAngleCornerInfo, index: number): void => {
  store.updateRectTemplateCorner(index, corner);
};
</script>

<style scoped lang="scss">
.rect-template-editor {
  display: grid;
  gap: 16px;
  min-width: 0;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

.expression-preview {
  margin-left: 12px;
  color: #606266;
  white-space: nowrap;
}
</style>
