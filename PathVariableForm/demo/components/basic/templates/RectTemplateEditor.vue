<template>
  <div class="rect-template-editor">
    <el-form label-width="80px">
      <el-form-item label="宽度">
        <ExpressionEditor v-model="widthExpression" />
        <span class="rect-template-editor__preview">预览：宽 {{ widthPreview }}</span>
      </el-form-item>

      <el-form-item label="深度">
        <ExpressionEditor v-model="depthExpression" />
        <span class="rect-template-editor__preview">预览：深 {{ depthPreview }}</span>
      </el-form-item>
    </el-form>

    <el-table :data="cornerInfos" border>
      <el-table-column prop="direction" label="序号" />
      <el-table-column prop="type" label="角点类型">
        <template #default="{ row }">
          <span>{{ getCornerTypeLabel(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="radiusExpression" label="半径计算式" />
      <el-table-column prop="radius" label="半径值" />
      <el-table-column prop="segmentCount" label="分段数" />
      <el-table-column prop="cutDistanceExpression" label="切段距离计算式" />
      <el-table-column prop="cutDistance" label="切段距离值" />
      <el-table-column fixed="right" label="操作" width="90">
        <template #default="{ row, $index }">
          <el-button size="small" link>
            <el-icon><Delete /></el-icon>
          </el-button>
          <el-button size="small" link @click="openCornerEditor(row, $index)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- RectCornerEditDialog：矩形模板角点编辑弹窗。 -->
    <RectCornerEditDialog
      v-model="cornerDialogVisible"
      :corner="selectedCorner"
      :index="selectedCornerIndex"
      @confirm="updateCorner"
    />
  </div>
</template>

<script setup lang="ts">
import { Delete, Edit } from "@element-plus/icons-vue";
import { computed, ref } from "vue";
import ExpressionEditor from "@/layout/components/ModelEditor/components/LeftPanel/pages/expression/ExpressionEditor.vue";
import { ECornerType, EDir, type ICornerInfo } from "@/three/src/object/bim/variable/contour/type";
import { usePathEditorContext } from "../../../store/PathEditorStore";
import RectCornerEditDialog from "./RectCornerEditDialog.vue";

type RectCornerType = "Right" | "Fillet" | "Chamfer";

interface RectCornerPreview {
  direction: string;
  type: RectCornerType;
  radiusExpression: string;
  radius: number | string;
  segmentCount: number | string;
  cutDistanceExpression: string;
  cutDistance: number;
}

const { store } = usePathEditorContext();

/** 输入框通过可写 computed 连接 Store，组件不再维护尺寸副本。 */
const widthExpression = computed({
  get: (): string => store.rectWidth.value,
  set: (value: string): void => store.updateRectWidth(value),
});
const depthExpression = computed({
  get: (): string => store.rectDepth.value,
  set: (value: string): void => store.updateRectDepth(value),
});
/** 预览区展示表达式计算后的实际宽度，而不是输入框中的表达式文本。 */
const widthPreview = computed((): number => store.rectWidthValue.value);

/** 预览区展示表达式计算后的实际深度，而不是输入框中的表达式文本。 */
const depthPreview = computed((): number => store.rectDepthValue.value);

const cornerDialogVisible = ref(false);
const selectedCornerIndex = ref(-1);
const selectedCorner = ref<RectCornerPreview | null>(null);

/** 将领域层角点转换为表格和弹窗使用的展示模型，数据源仍然是 Store。 */
const cornerInfos = computed<RectCornerPreview[]>(() => {
  // RectShape 统一解析角点表达式，表格只展示解析后的实际值。
  const parsedCorners = store.rectTemplate.parseCornerInfos();
    return store.rectCornerInfos.value.map((corner, index) => {
      const parsed = parsedCorners[index]?.value ?? {};
      return {
        direction: corner.dir,
        type: corner.type,
        radiusExpression: corner.R ?? "",
        // 半径和分段数只属于圆角，直角和斜切角保持空白。
        radius: Number(parsed.R) || "",
        segmentCount: Number(parsed.ArcSegment) || "",
        cutDistanceExpression: corner.d ?? "",
        cutDistance: Number(parsed.d) || 0,
      };
  });
});

const getCornerTypeLabel = (type: RectCornerType): string => {
  if (type === "Fillet") return "圆角";
  if (type === "Chamfer") return "斜切";
  return "直角";
};

const openCornerEditor = (corner: RectCornerPreview, index: number): void => {
  selectedCorner.value = { ...corner };
  selectedCornerIndex.value = index;
  cornerDialogVisible.value = true;
};

/** 将弹窗展示模型转换回领域角点数据，并交由 Store 触发预览更新。 */
const updateCorner = (corner: RectCornerPreview, index: number): void => {
  if (index < 0 || index >= cornerInfos.value.length) return;

  const currentCorner = store.rectCornerInfos.value[index];
  const typeMap: Record<RectCornerType, ECornerType> = {
    Right: ECornerType.直角,
    Fillet: ECornerType.圆角,
    Chamfer: ECornerType.斜切,
  };
  const nextCorner: ICornerInfo = {
    type: typeMap[corner.type],
    dir: currentCorner?.dir ?? EDir.左上角,
    R: corner.radiusExpression || undefined,
    ArcSegment: String(corner.segmentCount || 1),
    d: corner.cutDistanceExpression || undefined,
  };
  store.updateRectCorner(index, nextCorner);
};
</script>

<style scoped lang="scss">
.rect-template-editor {
  display: grid;
  gap: 16px;
  min-width: 0;
  width: 100%;
}

.rect-template-editor__preview {
  margin-left: 20px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-table) {
  width: 100%;
}
</style>
