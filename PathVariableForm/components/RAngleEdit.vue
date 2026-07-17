<!-- R角编辑 -->
<template>
  <el-form-item prop="name" label="变量名" :label-width="formLabelWidth">
    <el-input v-model="(modelValue as any).name" maxlength="10" autocomplete="off" />
  </el-form-item>
  <el-form-item prop="refName" label="引用名" :label-width="formLabelWidth">
    <el-input :disabled="!addOrSave" maxlength="5" v-model="(modelValue as any).refName" autocomplete="off" />
  </el-form-item>
  <el-form-item prop="contourInfo.type" label="模版选择" :label-width="formLabelWidth">
    <el-select v-model="selectedTemplateType">
      <el-option v-for="item in templateList" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
  <!-- 矩形模板组件 -->
  <RectTemplate v-if="isRectTemplate" :context-props="contextProps" :pathTemplateManager="pathTemplateManager" />
  <!-- 圆形模板组件 -->
  <CicleTemplate v-if="isCicleTemplate" :context-props="contextProps" :pathTemplateManager="pathTemplateManager" />
</template>
<script setup lang="ts">
import { useVariableFormRules } from "@/hooks/useVariableRules";
import { computed, ref } from "vue";
import CicleTemplate from "./CicleTemplate.vue";
import RectTemplate from "./RectTemplate.vue";
import { PathTemplateStore, templatesMap } from "../store/PathTemplateStore";
import { ElMessage } from "element-plus";

const props = defineProps<{
  contextProps: Record<string, unknown>;
}>();
const { modelValue: propsModelValue, addOrSave: propsAddOrSave } = props.contextProps;
const modelValue = ref(propsModelValue);
const addOrSave = ref(propsAddOrSave);
const isRectTemplate = ref(false);
const isCicleTemplate = ref(false);
//每次进来 创建一个新的pathTemplateStore -- 模板管理器

console.log("R角界面参数::::", modelValue, addOrSave);
const pathTemplateManager = new PathTemplateStore();
pathTemplateManager.init((modelValue.value as any).contourInfo as any);
(modelValue.value as any).contourInfo = pathTemplateManager.currentHandler.template;
reset();
//处理传进来的数据

const { formLabelWidth } = useVariableFormRules(props.contextProps as any);
const templateList = ref<Record<string, unknown>[]>(Object.values(templatesMap));

const selectedTemplateType = computed({
  get: (): string => {
    return ((modelValue.value as any).contourInfo?.type as string) || "矩形模板";
  },
  set: (type: string): void => {
    try {
      const contourInfo = pathTemplateManager.switchTemplate(type as any);
      (modelValue.value as any).contourInfo = contourInfo;
      reset();
    } catch (error) {
      ElMessage.error("改模板暂未开发");
    }
  },
});

function reset() {
  isRectTemplate.value = pathTemplateManager.isRectTemplate();
  isCicleTemplate.value = pathTemplateManager.isCicleTemplate();
}
</script>
