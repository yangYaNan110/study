<template>
  <el-dialog
    v-model="isVisible"
    title="修改角点"
    :append-to-body="false"
    width="500"
    style="max-height: 600px; overflow-y: scroll"
  >
    <el-form ref="variableRulesRef" :rules="pathVariablevariableRules" :model="formData" label-width="90px">
      <el-form-item prop="type" label="角点类型">
        <el-select v-model="formData.type" placeholder="请选择角点类型">
          <el-option v-for="item in cornerTypeList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <template v-if="formData.type == 'Fillet'">
        <div style="display: inline-block; width: 100%; font-weight: bold; margin-bottom: 10px; margin-left: 21px">
          角点参数：
        </div>
        <el-form-item prop="R" label="R">
          <div style="width: 100%">
            <ExpressionEditor v-model="formData.R" @blur="updateCornerR" placeholder="请输入计算式..." />
          </div>
        </el-form-item>
        <div class="textCenter">预览: R:{{ calculateExpressionFn(formData.R) }}</div>

        <el-form-item prop="y" label="分段数">
          <div style="width: 100%">
            <ExpressionEditor v-model="formData.ArcSegment" placeholder="请输入计算式..." />
          </div>
        </el-form-item>
        <div class="textCenter">预览: 分段数:{{ calculateExpressionFn(formData.ArcSegment) }}</div>
      </template>

      <template v-if="formData.type == 'Chamfer'">
        <el-form-item prop="cutDistance" label="切段距离">
          <div style="width: 100%">
            <ExpressionEditor v-model="formData.d" placeholder="请输入计算式..." />
          </div>
        </el-form-item>
        <div class="textCenter">预览: 切段距离:{{ calculateExpressionFn(formData.d) }}</div>
      </template>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="isVisible = false">取消</el-button>
        <el-button type="primary" @click="confirm(variableRulesRef)"> 保存 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ExpressionUtil } from "@/three/src/interface/modelEditor/util/ExpressionUtil";
import ExpressionEditor from "../../../expression/ExpressionEditor.vue";
import { useVariableFormRules } from "@/hooks/useVariableRules";
import { IVariableJson } from "@/three/src/interface/modelEditor/json/IVariableJson";
import { cloneDeep } from "lodash-es";
const props = withDefaults(
  defineProps<{
    modelValue: any;
    formData: any;
    index: number;
    contourInfo: any;
  }>(),
  {},
);

const emit = defineEmits(["update:modelValue", "confirm", "cancle"]);

const cornerTypeList = ref([
  { value: "Right", label: "直角" },
  { value: "Fillet", label: "圆角" },
  { value: "Chamfer", label: "斜切" },
]);

const { variableRulesRef, pathVariablevariableRules } = useVariableFormRules(props);

const formData = ref(cloneDeep(props.formData));

watch(
  () => props.formData,
  newVal => {
    formData.value = cloneDeep(newVal);
  },
);

const isVisible = ref(props.modelValue);

const confirm = formEl => {
  //
  formEl.validate(async valid => {
    console.log(valid, "valid::编辑轮廓角点参数以后调用", formData.value, props.index);
    if (valid) {
      handleFormData();
      emit("confirm", formData.value, props.index);
      isVisible.value = false;
    } else {
      console.log("error submit!");
    }
  });
};

const handleFormData = () => {
  if (formData.value.type == "Right") {
    formData.value.R = "";
    formData.value.ArcSegment = "";
    formData.value.d = "";
  }
  if (formData.value.type == "Fillet") {
    formData.value.d = "";
  }
  if (formData.value.type == "Chamfer") {
    formData.value.R = "";
    formData.value.ArcSegment = "";
  }
};

watch(isVisible, val => {
  emit("update:modelValue", val);
});

watch(
  () => props.modelValue,
  val => {
    isVisible.value = val;
    if (val && variableRulesRef.value) {
      variableRulesRef.value.clearValidate();
    }
  },
);

const updateCornerR = () => {
  if (!props.contourInfo) {
    return;
  }
  //当分段数没值或者 r发生更新时 重新计算分段数
  const cornerInfos = props.contourInfo.getCornerInfos() || [];
  if (!formData.value.ArcSegment || formData.value.R != cornerInfos[props.index].R) {
    props.contourInfo?.updateCorners([props.index], formData.value);
    const segments = props.contourInfo?.getSegments();
    let segment = null;
    for (let i = props.index; i < segments.length; i++) {
      segment = segments[i];
      if (segment.type == "arc") {
        break;
      }
    }

    const count = String(
      IVariableJson.getArcCount({
        startPoint: { x: segment.startPoint.x.value, y: segment.startPoint.y.value, z: segment.startPoint.z.value },
        endPoint: { x: segment.endPoint.x.value, y: segment.endPoint.y.value, z: segment.endPoint.z.value },
        arcDirection: segment.arcDirection,
        radius: segment.radius.value,
      }),
    );
    formData.value.ArcSegment = count;
  }
};

const calculateExpressionFn = expression => {
  if (expression) {
    return ExpressionUtil.calculate(expression);
  }
};
</script>

<style lang="scss" scoped>
.textCenter {
  text-align: center;
  margin-bottom: 5px;
}
:deep(.el-dialog__body) {
  overflow-y: scroll;
}
</style>
