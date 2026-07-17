<template>
  <el-dialog v-model="dialogVisible" title="修改角点" width="500px">
    <el-form label-width="90px">
      <el-form-item label="角点类型">
        <el-select v-model="formData.type" placeholder="请选择角点类型">
          <el-option v-for="item in cornerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <template v-if="formData.type === 'Fillet'">
        <div class="rect-corner-edit-dialog__subtitle">圆角参数</div>
        <el-form-item label="R">
          <ExpressionEditor
            v-model="formData.radiusExpression"
            placeholder="请输入计算式..."
            @change="updateSegmentCountFromRadius"
          />
        </el-form-item>
        <div class="rect-corner-edit-dialog__preview">预览：R {{ radiusPreview }}</div>
        <el-form-item label="分段数">
          <!-- 分段数由半径和圆弧几何自动计算，以置灰输入框展示且不可手动修改。 -->
          <el-input
            class="rect-corner-edit-dialog__segment-count-input"
            :model-value="String(formData.segmentCountExpression || formData.segmentCount || '')"
            disabled
          />
        </el-form-item>
      </template>

      <template v-if="formData.type === 'Chamfer'">
        <el-form-item label="切段距离">
          <ExpressionEditor v-model="formData.cutDistanceExpression" placeholder="请输入计算式..." />
        </el-form-item>
        <div class="rect-corner-edit-dialog__preview">预览：切段距离 {{ cutDistancePreview }}</div>
      </template>
    </el-form>

    <template #footer>
      <div class="rect-corner-edit-dialog__footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirm">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import ExpressionEditor from "@/layout/components/ModelEditor/components/LeftPanel/pages/expression/ExpressionEditor.vue";
import { ExpressionUtil } from "@/three/src/interface/modelEditor/util/ExpressionUtil";
import { IVariableJson } from "@/three/src/interface/modelEditor/json/IVariableJson";
import { usePathEditorContext } from "../../../store/PathEditorStore";

type RectCornerType = "Right" | "Fillet" | "Chamfer";

interface RectCornerData {
  direction: string;
  type: RectCornerType;
  radiusExpression: string;
  radius: number;
  segmentCount: number;
  cutDistanceExpression: string;
  cutDistance: number;
}

interface RectCornerFormData extends RectCornerData {
  segmentCountExpression: string;
}

const props = defineProps<{
  modelValue: boolean;
  corner: RectCornerData | null;
  index: number;
}>();

const { store } = usePathEditorContext();

const emits = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "confirm", value: RectCornerData, index: number): void;
}>();

const cornerTypeOptions = [
  { value: "Right" as const, label: "直角" },
  { value: "Fillet" as const, label: "圆角" },
  { value: "Chamfer" as const, label: "斜切" },
];

const dialogVisible = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean): void => emits("update:modelValue", value),
});

const formData = ref<RectCornerFormData>(createEmptyFormData());

/** 计算弹窗中正在编辑的表达式，失败时保留旧的实际值。 */
const calculatePreviewValue = (expression: string, fallback: number): number => {
  if (!expression?.trim()) return fallback;
  try {
    const value = ExpressionUtil.calculate(expression);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    const value = Number(expression);
    return Number.isFinite(value) ? value : fallback;
  }
};

/** 圆角半径表达式对应的实际预览值。 */
const radiusPreview = computed(() => calculatePreviewValue(formData.value.radiusExpression, formData.value.radius));

/** 斜切距离表达式对应的实际预览值。 */
const cutDistancePreview = computed(() =>
  calculatePreviewValue(formData.value.cutDistanceExpression, formData.value.cutDistance),
);

/** 将领域线段点转换成 ArcCount 计算需要的普通数值点。 */
const toPointValue = (point: any) => ({
  x: Number(point?.x?.value ?? point?.x ?? 0),
  y: Number(point?.y?.value ?? point?.y ?? 0),
  z: Number(point?.z?.value ?? point?.z ?? 0),
});

/** 半径变化后重建圆弧，并根据新圆弧几何结果自动计算分段数。 */
const updateSegmentCountFromRadius = (): void => {
  if (formData.value.type !== "Fillet" || props.index < 0) return;

  const currentCorner = store.rectCornerInfos.value[props.index];
  if (!currentCorner) return;

  store.updateRectCorner(props.index, {
    ...currentCorner,
    R: formData.value.radiusExpression,
    ArcSegment: currentCorner.ArcSegment || "1",
  });

  const arcSegment = store.previewSegments.value
    .slice(props.index)
    .find(segment => (segment as any)?.type === "arc" || (segment as any)?.__type === "arc") as any;
  if (!arcSegment) return;

  try {
    const count = IVariableJson.getArcCount({
      startPoint: toPointValue(arcSegment.startPoint),
      endPoint: toPointValue(arcSegment.endPoint),
      arcDirection: arcSegment.arcDirection,
      radius: Number(arcSegment.radius?.value ?? arcSegment.radius ?? 0),
    });
    formData.value.segmentCount = count;
    formData.value.segmentCountExpression = String(count);
  } catch (error) {
    console.warn("[RectCornerEditDialog] 圆角分段数计算失败", error);
  }
};

watch(
  () => [props.modelValue, props.corner] as const,
  ([visible, corner]) => {
    if (visible && corner) {
      formData.value = {
        ...corner,
        segmentCountExpression: String(corner.segmentCount || 1),
      };
      if (corner.type === "Fillet") {
        void nextTick(updateSegmentCountFromRadius);
      }
    }
  },
  { immediate: true },
);

function createEmptyFormData(): RectCornerFormData {
  return {
    direction: "",
    type: "Right",
    radiusExpression: "",
    radius: 0,
    segmentCount: 1,
    segmentCountExpression: "1",
    cutDistanceExpression: "",
    cutDistance: 0,
  };
}

const confirm = (): void => {
  emits("confirm", {
    ...formData.value,
    segmentCount: Number(formData.value.segmentCountExpression) || 1,
  }, props.index);
  dialogVisible.value = false;
};
</script>

<style scoped lang="scss">
.rect-corner-edit-dialog__subtitle {
  margin: 0 0 10px 21px;
  font-weight: 700;
}

.rect-corner-edit-dialog__preview {
  margin-bottom: 5px;
  text-align: center;
}

.rect-corner-edit-dialog__segment-count-input {
  width: 340px;
  max-width: 100%;
}

.rect-corner-edit-dialog__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
