<template>
  <div class="basic-template-editor-view">
    <!-- 模板选择：使用正式版相同的 Element Plus 表单控件。 -->
    <el-form label-width="110px">
      <el-form-item label="模版选择">
        <el-select id="basic-template-type" v-model="activeTemplate">
          <el-option
            v-for="template in templateOptions"
            :key="template.value"
            :label="template.label"
            :value="template.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 当前模板编辑区域：由各模板组件负责具体参数和角点编辑。 -->
    <div class="basic-template-editor-view__content">
      <component :is="activeTemplateComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BevelTemplateEditor from "./templates/BevelTemplateEditor.vue";
import CircleTemplateEditor from "./templates/CircleTemplateEditor.vue";
import LShapeTemplateEditor from "./templates/LShapeTemplateEditor.vue";
import RectTemplateEditor from "./templates/RectTemplateEditor.vue";
import TrapezoidTemplateEditor from "./templates/TrapezoidTemplateEditor.vue";
import { usePathEditorContext, type BasicTemplateType } from "../../store/PathEditorStore";

const { store } = usePathEditorContext();

/** 模板切换只更新 Store，具体模板组件通过 Store 读取对应编辑数据。 */
const activeTemplate = computed<BasicTemplateType>({
  get: (): BasicTemplateType => store.templateType.value,
  set: (value: BasicTemplateType): void => store.switchTemplate(value),
});

const templateComponentMap = {
  rect: RectTemplateEditor,
  circle: CircleTemplateEditor,
  "l-shape": LShapeTemplateEditor,
  trapezoid: TrapezoidTemplateEditor,
  bevel: BevelTemplateEditor,
} as const;

const activeTemplateComponent = computed(() => templateComponentMap[activeTemplate.value]);

interface BasicTemplateOption {
  value: BasicTemplateType;
  label: string;
}

const templateOptions: BasicTemplateOption[] = [
  { value: "rect", label: "矩形模板" },
  { value: "circle", label: "圆形模板" },
  { value: "l-shape", label: "L 型模板" },
  { value: "trapezoid", label: "梯形模板" },
  { value: "bevel", label: "斜切边模板" },
];
</script>

<style scoped lang="scss">
.basic-template-editor-view {
  display: grid;
  gap: 16px;
  width: 100%;
}

.basic-template-editor-view__content {
  // 模板参数和角点表格固定在独立区域内，内容过多时只滚动此区域。
  height: 380px;
  max-height: 380px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 180px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  color: var(--el-text-color-regular);
}
</style>
