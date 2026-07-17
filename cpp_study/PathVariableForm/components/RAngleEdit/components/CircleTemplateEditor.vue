<!-- 圆形模板编辑器：展示半径和派生分段数，不处理真实圆弧几何。 -->
<template>
  <div class="circle-template-editor">
    <el-form label-width="80px">
      <el-form-item label="半径">
        <!-- ExpressionEditor：复用旧版圆形半径的表达式输入和变量计算能力。 -->
        <ExpressionEditor v-model="radiusExpression" />
        <span class="expression-preview">预览: R: {{ store.getCircleTemplateRValue() }}</span>
      </el-form-item>
      <el-form-item label="分段数">
        <span class="circle-template-editor__segment-count">
          {{ store.getCircleTemplateArcSegmentValue() }}
        </span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ExpressionEditor from "@/layout/components/ModelEditor/components/LeftPanel/pages/expression/ExpressionEditor.vue";
import { useRAngleEditContext } from "../store";

const { store } = useRAngleEditContext();

/** 通过可写 computed 将圆形半径输入转发给真实模板 Store。 */
const radiusExpression = computed({
  get: (): string => store.getCircleTemplateR(),
  set: (value: string): void => store.updateCircleTemplateR(value),
});
</script>

<style scoped lang="scss">
.circle-template-editor {
  min-width: 0;
}

.expression-preview {
  margin-left: 12px;
  color: #606266;
  white-space: nowrap;
}

.circle-template-editor__segment-count {
  color: var(--el-text-color-regular);
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}
</style>
