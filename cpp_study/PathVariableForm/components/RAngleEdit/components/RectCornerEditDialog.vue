<!-- 矩形角点编辑弹窗：维护临时表单，确认时提交，取消时不回写。 -->
<template>
  <el-dialog v-model="visible" title="编辑角点" width="460px">
    <el-form label-width="90px">
      <el-form-item label="角点类型">
        <el-select v-model="form.type">
          <el-option v-for="item in cornerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.type === 'Fillet'" label="圆角 R">
        <ExpressionEditor v-model="form.radiusExpression" placeholder="请输入计算式..." />
        <div class="expression-preview">预览: R: {{ radiusPreviewValue }}</div>
      </el-form-item>
      <el-form-item v-if="form.type === 'Fillet'" label="分段数">
        <span class="readonly-value">{{ segmentCountPreview || form.segmentCount || "0" }}</span>
      </el-form-item>
      <el-form-item v-if="form.type === 'Chamfer'" label="切段距离">
        <ExpressionEditor v-model="form.cutDistanceExpression" placeholder="请输入计算式..." />
        <div class="expression-preview">预览: d: {{ cutDistancePreviewValue }}</div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ExpressionEditor from "@/layout/components/ModelEditor/components/LeftPanel/pages/expression/ExpressionEditor.vue";
import { ExpressionUtil } from "@/three/src/interface/modelEditor/util/ExpressionUtil";
import { useRAngleEditContext } from "../store";
import type { RAngleCornerInfo } from "../types";

/** 弹窗接收当前角点快照，不直接依赖真实模板对象。 */
const props = defineProps<{
  modelValue: boolean;
  corner: RAngleCornerInfo | null;
  index: number;
}>();

/** visible 控制弹窗生命周期，confirm 提交结构化角点数据。 */
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "confirm", value: RAngleCornerInfo, index: number): void;
}>();

const cornerTypeOptions = [
  { value: "Right" as const, label: "直角" },
  { value: "Fillet" as const, label: "圆角" },
  { value: "Chamfer" as const, label: "斜切" },
];

const visible = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean): void => emit("update:modelValue", value),
});

const form = ref<RAngleCornerInfo>(createEmptyCorner());
const { store } = useRAngleEditContext();

/** 计算当前圆角半径表达式的预览值，不改写表达式原文。 */
const radiusPreviewValue = computed((): number => calculateExpression(form.value.radiusExpression));
/** 计算当前斜切距离表达式的预览值，不改写表达式原文。 */
const cutDistancePreviewValue = computed(() => calculateExpression(form.value.cutDistanceExpression));
/** 半径草稿对应的自动分段数，只读展示，不提前修改 Store。 */
const segmentCountPreview = computed(() => {
  if (form.value.type !== "Fillet" || !form.value.radiusExpression) return 0;
  return store.getRectCornerSegmentCount(props.index, form.value);
});

/** 每次打开弹窗都从表格数据创建编辑草稿，取消时不回写。 */
watch(
  () => [props.modelValue, props.corner] as const,
  ([isVisible, corner]) => {
    if (isVisible && corner) form.value = { ...corner };
  },
  { immediate: true },
);

/** 提交临时角点草稿；真实校验和领域转换后续交给 Store/Service。 */
const confirm = (): void => {
  if (form.value.type === "Right") {
    form.value.radiusExpression = "";
    form.value.radius = 0;
    form.value.segmentCount = 0;
    form.value.cutDistanceExpression = "";
    form.value.cutDistance = 0;
  } else if (form.value.type === "Fillet") {
    form.value.cutDistanceExpression = "";
    form.value.cutDistance = 0;
  } else {
    form.value.radiusExpression = "";
    form.value.radius = 0;
    form.value.segmentCount = 0;
  }
  emit("confirm", { ...form.value }, props.index);
  visible.value = false;
};

/** 弹窗首次创建时的初始化兜底模型，打开后会被真实角点快照覆盖。 */
function createEmptyCorner(): RAngleCornerInfo {
  return {
    direction: "",
    type: "Right",
    radiusExpression: "",
    radius: 0,
    segmentCount: 0,
    cutDistanceExpression: "",
    cutDistance: 0,
  };
}

/** 按当前变量上下文计算表达式，失败时回退为普通数字。 */
function calculateExpression(value: unknown): number {
  const content = String(value ?? "").trim();
  if (!content) return 0;
  try {
    const calculated = ExpressionUtil.calculate(content);
    if (typeof calculated === "number" && Number.isFinite(calculated)) return calculated;
  } catch {
    // 输入中的表达式暂不完整时保持可编辑状态。
  }
  const numberValue = Number(content);
  return Number.isFinite(numberValue) ? numberValue : 0;
}
</script>

<style scoped lang="scss">
.readonly-value {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  color: var(--el-text-color-regular);
}

.expression-preview {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
</style>
