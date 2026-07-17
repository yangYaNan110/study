<template>
  <div>
    <el-form-item label="宽" :label-width="formLabelWidth">
      <!-- <el-input v-model="contourInfoW" maxlength="10" autocomplete="off" /> -->
      <ExpressionEditor v-model="contourInfoW" />
      <span style="margin-left: 20px">预览： 宽： {{ contourInfoWValue }} </span>
    </el-form-item>
    <el-form-item label="深" :label-width="formLabelWidth">
      <!-- <el-input v-model="contourInfoD" maxlength="10" autocomplete="off" /> -->
      <ExpressionEditor v-model="contourInfoD" />
      <span style="margin-left: 20px">预览： 深： {{ contourInfoDValue }} </span>
    </el-form-item>
    <el-table :data="cornerInfos" border>
      <el-table-column prop="dir" label="序号"></el-table-column>
      <el-table-column prop="type" label="角点类型">
        <template #default="{ row }">
          <span>{{ transformType(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="R" label="半径计算式"> </el-table-column>
      <el-table-column prop="R" label="半径值">
        <template #default="{ row }">
          <span>{{ calculateExpressionFn(row.R) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="ArcSegment" label="分段数"> </el-table-column>
      <el-table-column prop="d" label="切段距离计算式"> </el-table-column>
      <el-table-column prop="d" label="切段距离值">
        <template #default="{ row }">
          <span>{{ calculateExpressionFn(row.d) }}</span>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作">
        <template #default="{ row, $index }">
          <el-button size="small" link>
            <el-icon><Delete /></el-icon>
          </el-button>
          <el-button @click="editContourForm(row, $index)" size="small" link>
            <el-icon><Edit /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <ContourLineForm
    v-if="modelValue.contourInfo"
    v-model="ContourLineFormVisiable"
    :formData="contourForm"
    :index="curIndex"
    @confirm="ContourLineConfirm"
    :contourInfo="modelValue.contourInfo"
  />
</template>

<script setup lang="ts">
import { Delete, Edit } from "@element-plus/icons-vue";
import { useVariableFormRules } from "@/hooks/useVariableRules";
import { ExpressionUtil } from "@/three/src/interface/modelEditor/util/ExpressionUtil";
import { computed, ref } from "vue";
import ExpressionEditor from "../../../expression/ExpressionEditor.vue";
import ContourLineForm from "./ContourLineForm.vue";
import { type PathTemplateStore } from "../store/PathTemplateStore.js";
import { bus } from "@/utils/bus";

const props = defineProps<{
  contextProps: any;
  pathTemplateManager: PathTemplateStore;
}>();

const { modelValue: propsModelValue } = props.contextProps;
const { pathTemplateManager } = props;
const modelValue = ref(propsModelValue);
console.log("矩形模板收到的参数:::::", modelValue);

const { formLabelWidth } = useVariableFormRules(props.contextProps);
const contourForm = ref();
const curIndex = ref(0);
const ContourLineFormVisiable = ref(false);
const updateCount = ref(0);
const transformType = (type: string) => {
  switch (type) {
    case "Right":
      return "直角";
    case "Fillet":
      return "圆角";
    case "Chamfer":
      return "斜切边";
  }
};

const calculateExpressionFn = expression => {
  if (expression) {
    return ExpressionUtil.calculate(expression);
  }
};

const contourInfoW = computed({
  get: () => {
    updateCount.value;
    return pathTemplateManager.getRectTemplateW();
  },
  set: (width: string | number) => {
    pathTemplateManager.updateRectTemplateW(width);
    updateCount.value++;
    bus.emit("refreshCount");
  },
});
const contourInfoWValue = computed(() => {
  return ExpressionUtil.calculate(contourInfoW.value);
});

const contourInfoD = computed({
  get: () => {
    updateCount.value;
    return pathTemplateManager.getRectTemplateD();
  },
  set: (d: string | number) => {
    pathTemplateManager.updateRectTemplateD(d);
    updateCount.value++;
    bus.emit("refreshCount");
  },
});
const contourInfoDValue = computed(() => {
  return ExpressionUtil.calculate(contourInfoD.value);
});

const editContourForm = (row, index) => {
  contourForm.value = row;
  curIndex.value = index;
  ContourLineFormVisiable.value = true;
};

const ContourLineConfirm = (data, index) => {
  console.log("确认::修改角点信息", data, index, modelValue.value.contourInfo);
  modelValue.value.contourInfo?.updateCorners([index], data);
  bus.emit("refreshCount");
};

const cornerInfos = ref(pathTemplateManager.getRectTemplateCornerInfos());
</script>
