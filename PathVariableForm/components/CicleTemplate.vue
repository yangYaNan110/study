<template>
  <div>
    <el-form-item label="半径" :label-width="formLabelWidth">
      <ExpressionEditor v-model="cicleR" @blur="updateCornerR" placeholder="请输入计算式..." />
      <div class="textCenter" style="margin-left: 20px">预览: R:{{ RValue }}</div>
    </el-form-item>
    <el-form-item label="分段数" :label-width="formLabelWidth">
      <div style="width: 100%">
        <!-- <ExpressionEditor v-model="arcSegment" placeholder="请输入计算式..." /> -->
        <div class="textCenter">{{ arcSegmentValue }}</div>
      </div>
      <!-- <div class="textCenter">预览: 分段数:{{ arcSegmentValue }}</div> -->
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useVariableFormRules } from "@/hooks/useVariableRules";
import ExpressionEditor from "../../../expression/ExpressionEditor.vue";
import { type PathTemplateStore } from "../store/PathTemplateStore.js";
import { bus } from "@/utils/bus";

const props = defineProps<{
  contextProps: any;
  pathTemplateManager: PathTemplateStore;
}>();
console.log("圆形模板收到的参数::::", props.contextProps);
const { pathTemplateManager } = props;
const { formLabelWidth } = useVariableFormRules(props.contextProps);
const RValue = ref(pathTemplateManager.getCicleTemplateRValue());
const arcSegmentValue = ref();
//更新圆形模板半径
const updateCornerR = () => {
  pathTemplateManager.resetCicleTemplateArcSegment();
  arcSegmentValue.value = pathTemplateManager.getCicleTemplateArcSegmentValue();
};
const cicleR = computed({
  get: () => {
    return pathTemplateManager.getCicleTemplateR();
  },
  set: (value: string | number) => {
    pathTemplateManager.updateCicleTemplateR(value);
    RValue.value = pathTemplateManager.getCicleTemplateRValue();
    updateCornerR();
    bus.emit("refreshCount");
  },
});

const arcSegment = computed({
  get: () => {
    return pathTemplateManager.getCicleTemplateArcSegment();
  },
  set: (value: string | number) => {
    pathTemplateManager.updateCicleTemplateArcSegment(value);
    arcSegmentValue.value = pathTemplateManager.getCicleTemplateArcSegmentValue();
    bus.emit("refreshCount");
  },
});

onMounted(() => {
  //默认使用系统分段数
  try {
    updateCornerR();
  } catch (error) {}
});
</script>
