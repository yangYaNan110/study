<template>
  <div class="circle-template-editor">
    <el-form label-width="80px">
      <el-form-item label="半径">
        <ExpressionEditor v-model="radiusExpression" placeholder="请输入半径表达式..." />
        <span class="circle-template-editor__preview">预览：R {{ radiusValue }}</span>
      </el-form-item>

      <el-form-item label="分段数">
        <!-- 分段数由半径自动计算，只展示实际数字，不再显示输入框和预览文案。 -->
        <span class="circle-template-editor__value">{{ arcSegmentValue }}</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ExpressionEditor from "@/layout/components/ModelEditor/components/LeftPanel/pages/expression/ExpressionEditor.vue";
import { usePathEditorContext } from "../../../store/PathEditorStore";

const { store } = usePathEditorContext();

/** 圆形模板只负责表单展示，参数更新和预览重建统一交给 PathEditorStore。 */
const radiusExpression = computed({
  get: (): string => store.circleRadius.value,
  set: (value: string): void => store.updateCircleRadius(value),
});

const radiusValue = computed((): number => store.circleRadiusValue.value);
const arcSegmentValue = computed((): number => store.circleArcSegmentValue.value);
</script>

<style scoped lang="scss">
.circle-template-editor {
  display: grid;
  gap: 16px;
  min-width: 0;
  width: 100%;
}

.circle-template-editor__preview {
  margin-left: 20px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.circle-template-editor__value {
  color: var(--el-text-color-regular);
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
