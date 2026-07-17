<template>
  <!-- 线段新增/编辑弹窗：负责表单录入和校验，通过 confirm 事件向上提交。 -->
  <el-dialog
    v-model="isVisible"
    :title="addOrEditFlag ? '新增线段' : '修改线段'"
    :append-to-body="false"
    width="500"
    style="max-height: 600px; overflow-y: scroll"
  >
    <el-form ref="variableRulesRef" :rules="pathVariablevariableRules" :model="formData" label-width="auto">
      <el-form-item prop="type" label="线段类型">
        <el-select v-model="formData.type" placeholder="请选择线段类型">
          <el-option label="线段" value="line" />
          <el-option label="圆弧" value="arc" />
        </el-select>
      </el-form-item>
      <template v-if="formData.type == 'arc'">
        <el-form-item prop="arcDirection" label="顺/逆时针" label-width="auto">
          <el-select v-model="formData.arcDirection" placeholder="请选择时针方向">
            <el-option label="顺时针" :value="true" />
            <el-option label="逆时针" :value="false" />
          </el-select>
        </el-form-item>
      </template>

      <span>起始点</span>
      <el-form-item prop="startPoint.x" label="x">
        <div style="width: 100%">
          <ExpressionEditor
            v-model="formData.startPoint.x"
            :placeholder="previousEndPointPlaceholder.x || '请输入计算式...'"
          />
        </div>
      </el-form-item>
      <el-form-item prop="startPoint.y" label="y">
        <div style="width: 100%">
          <ExpressionEditor
            v-model="formData.startPoint.y"
            :placeholder="previousEndPointPlaceholder.y || '请输入计算式...'"
          />
        </div>
      </el-form-item>
      <el-form-item prop="startPoint.z" label="z">
        <div style="width: 100%">
          <ExpressionEditor
            v-model="formData.startPoint.z"
            :placeholder="previousEndPointPlaceholder.z || '请输入计算式...'"
          />
        </div>
      </el-form-item>
      <div class="textCenter">
        预览: x:{{ calculateExpressionFn(formData.startPoint.x) }} y:
        {{ calculateExpressionFn(formData.startPoint.y) }} z: {{ calculateExpressionFn(formData.startPoint.z) }}
      </div>

      <span>终止点</span>
      <el-form-item prop="endPoint.x" label="x">
        <div style="width: 100%">
          <ExpressionEditor v-model="formData.endPoint.x" placeholder="请输入计算式..." />
        </div>
      </el-form-item>
      <el-form-item prop="endPoint.y" label="y">
        <div style="width: 100%">
          <ExpressionEditor v-model="formData.endPoint.y" placeholder="请输入计算式..." />
        </div>
      </el-form-item>
      <el-form-item prop="endPoint.z" label="z">
        <div style="width: 100%">
          <ExpressionEditor v-model="formData.endPoint.z" placeholder="请输入计算式..." />
        </div>
      </el-form-item>
      <div class="textCenter">
        预览: x:{{ calculateExpressionFn(formData.endPoint.x) }} y: {{ calculateExpressionFn(formData.endPoint.y) }} z:
        {{ calculateExpressionFn(formData.endPoint.z) }}
      </div>

      <template v-if="formData.type == 'arc'">
        <el-form-item prop="radius" label="半径">
          <div style="width: 100%">
            <ExpressionEditor v-model="formData.radius" placeholder="请输入计算式..." />
          </div>
        </el-form-item>
        <el-form-item prop="count" label="分段数">
          <div style="width: 100%">
            <ExpressionEditor @change="changeCount" v-model="formData.count" placeholder="请输入计算式..." />
          </div>
        </el-form-item>
        <div class="textCenter">
          预览: 半径:{{ calculateExpressionFn(formData.radius) }} 分段数:
          {{ calculateExpressionFn(formData.count) }}
        </div>
      </template>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="isVisible = false">取消</el-button>
        <el-button type="primary" @click="confirm(variableRulesRef)"> {{ addOrEditFlag ? "添加" : "保存" }} </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ExpressionUtil } from "@/three/src/interface/modelEditor/util/ExpressionUtil";
import ExpressionEditor from "../../../../../../pages/expression/ExpressionEditor.vue";
import { useVariableFormRules } from "@/hooks/useVariableRules";
import type { ICountParams } from "@/three/src/object/bim/math/ArcSegment";
import { IVariableJson } from "@/three/src/interface/modelEditor/json/IVariableJson";
import { ElMessage } from "element-plus";
import { cloneDeep } from "lodash-es";
const props = withDefaults(
  defineProps<{
    modelValue: any;
    addOrEditFlag: boolean;
    addOrSave?: boolean;
    formData: any;
    pathInfo: any;
    insertIndex: number;
  }>(),
  {},
);

const emit = defineEmits(["update:modelValue", "confirm", "cancle"]);

const { variableRulesRef, pathVariablevariableRules } = useVariableFormRules(props);

const formData = ref(cloneDeep(props.formData));

watch(
  () => props.formData,
  newVal => {
    formData.value = cloneDeep(newVal);
    if (props.modelValue) {
      applyDefaultStartPoint();
    }
  },
);

const toExpressionText = value => {
  if (value && typeof value === "object") {
    if ("content" in value) {
      return String(value.content ?? "");
    }
    if ("value" in value) {
      return String(value.value ?? "");
    }
  }
  return String(value ?? "");
};

const calculateExpressionFn = expression => {
  const expressionText = toExpressionText(expression);
  if (expressionText) {
    return ExpressionUtil.calculate(expressionText);
  }
};

const isVisible = ref(props.modelValue);

const confirm = formEl => {
  //
  formEl.validate(async valid => {
    console.log(valid, "valid");
    if (valid) {
      emit("confirm", formData.value);
      isVisible.value = false;
    } else {
      console.log("error submit!");
    }
  });
};

const isValidArcForm = (formData): boolean => {
  const topFields = ["radius", "arcDirection"] as const;
  for (const field of topFields) {
    if (typeof formData[field] != "boolean" && !formData[field]?.trim()) {
      return false;
    }
  }
  const points = [formData.startPoint, formData.endPoint] as const;
  for (const point of points) {
    for (const coord of ["x", "y", "z"] as const) {
      if (!point[coord]?.trim()) {
        return false;
      }
    }
  }

  return true;
};

const isChangeCount = ref(false);
const changeCount = () => {
  isChangeCount.value = true;
};

const calc = (expr: string) => calculateExpressionFn(expr) ?? 0;

const calculateCount = () => {
  const { startPoint, endPoint, arcDirection, radius } = formData.value;
  const data: ICountParams = {
    startPoint: {
      x: calc(startPoint.x),
      y: calc(startPoint.y),
      z: calc(startPoint.z),
    },
    endPoint: {
      x: calc(endPoint.x),
      y: calc(endPoint.y),
      z: calc(endPoint.z),
    },
    arcDirection,
    radius: calc(radius),
  };
  try {
    formData.value.count = String(IVariableJson.getArcCount(data));
  } catch (error) {
    ElMessage({
      message: error.message,
      type: "warning",
    });
  }
};

watch(isVisible, val => {
  emit("update:modelValue", val);
});

watch(
  () => formData.value,
  val => {
    if (val.type === "arc") {
      const flag = isValidArcForm(formData.value);
      flag && !isChangeCount.value ? calculateCount() : "";
      isChangeCount.value ? (isChangeCount.value = false) : "";
    }
  },
  { deep: true },
);

watch(
  () => props.modelValue,
  val => {
    isVisible.value = val;
    if (val && variableRulesRef.value) {
      variableRulesRef.value.clearValidate();
    }
    if (val) {
      applyDefaultStartPoint();
    }
  },
);

const getPreviousEndPoint = () => {
  const segments = props.pathInfo?.segments?.filter(item => !item?.isMergeRow) || [];
  console.log(segments, "线段集合:::::::::::yyn...");

  const previousIndex = props.insertIndex >= 0 ? props.insertIndex : segments.length - 1;
  const endPoint = segments[previousIndex]?.endPoint;
  if (!endPoint) {
    return undefined;
  }

  const previousEndPoint = {
    x: toExpressionText(endPoint.x),
    y: toExpressionText(endPoint.y),
    z: toExpressionText(endPoint.z),
  };
  return previousEndPoint.x || previousEndPoint.y || previousEndPoint.z ? previousEndPoint : undefined;
};

interface PointExpressionText {
  x: string;
  y: string;
  z: string;
}

const previousEndPointPlaceholder = computed<PointExpressionText>(
  () =>
    getPreviousEndPoint() || {
      x: "",
      y: "",
      z: "",
    },
);

/** 新增线段时默认使用前一条线段终点，但起点输入仍然可以继续编辑。 */
const applyDefaultStartPoint = (): void => {
  if (!props.addOrEditFlag) {
    return;
  }
  const previousEndPoint = getPreviousEndPoint();
  if (previousEndPoint) {
    formData.value.startPoint = previousEndPoint;
  }
};
</script>

<style lang="scss" scoped>
.textCenter {
  text-align: center;
}
:deep(.el-dialog__body) {
  overflow-y: scroll;
}
</style>
