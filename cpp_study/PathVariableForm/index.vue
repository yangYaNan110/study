<template>
  <el-tabs v-model="activeEditorName" class="demo-tabs">
    <el-tab-pane :disabled="!basicEditorEnabled" label="基础" name="basic">
      <div class="path-editor-layout basic-mode">
        <div class="path-editor-main">
          <el-form v-if="basicContourReady" ref="basicVariableRulesRef" :rules="variableRules" :model="modelValue">
            <!-- R角编辑 -->
            <!-- RAngleEdit 基础模板编辑器：通过 contextProps 接入真实 Store，父级负责确认和取消时机。 -->
            <RAngleEdit
              ref="basicRAngleEditRef"
              :context-props="props"
              @preview-segments="updateBasicPreviewSegments"
            />
          </el-form>
          <div v-else class="basic-mode-empty">当前路径没有模板数据，旧手工路径请在高级模式中编辑。</div>
        </div>

        <Path2dDebugger
          v-if="activeName === 'basic'"
          v-model:selected-index="selectedSegmentIndex"
          class="path-editor-preview"
          :segments="basicPreviewSegments"
        />
      </div>
    </el-tab-pane>
    <el-tab-pane label="高级" name="advanced">
      <div class="path-editor-layout advanced-mode">
        <div class="path-editor-main advanced-list">
          <el-form ref="variableRulesRef" :rules="variableRules" :model="modelValue">
            <el-form-item prop="directory" label="所属变量分组" :label-width="formLabelWidth">
              <el-select
                v-model="modelValue.directory"
                multiple
                filterable
                allow-create
                default-first-option
                :reserve-keyword="false"
              >
                <el-option
                  v-for="item in directoryNameList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item prop="name" label="变量名" :label-width="formLabelWidth">
              <el-input v-model="modelValue.name" maxlength="10" autocomplete="off" />
            </el-form-item>
            <el-form-item prop="refName" label="引用名" :label-width="formLabelWidth">
              <el-input :disabled="!addOrSave" maxlength="5" v-model="modelValue.refName" autocomplete="off" />
            </el-form-item>
          </el-form>
          <div class="advanced-test-actions">
            <label class="dxf-axis-field">
              <span>CAD X →</span>
              <el-select v-model="dxfXAxisDirection" class="dxf-axis-select">
                <el-option
                  v-for="axisDirection in DxfPathAxisDirections"
                  :key="axisDirection"
                  :label="`场景 ${axisDirection}`"
                  :value="axisDirection"
                />
              </el-select>
            </label>
            <label class="dxf-axis-field">
              <span>CAD Y →</span>
              <el-select v-model="dxfYAxisDirection" class="dxf-axis-select">
                <el-option
                  v-for="axisDirection in dxfYAxisDirectionOptions"
                  :key="axisDirection"
                  :label="`场景 ${axisDirection}`"
                  :value="axisDirection"
                />
              </el-select>
            </label>
            <input ref="dxfFileInputRef" type="file" accept=".dxf" hidden @change="importDxfFileAsync" />
            <el-button @click="dxfFileInputRef?.click()">导入 DXF 轮廓</el-button>
          </div>
          <!-- 高级模式线段表：固定 380px，Element Plus 仅滚动表体，表头保持固定。 -->
          <LineSegmentTable
            :data="modelValue.pathInfo.segments"
            height="380"
            :selected-index="selectedSegmentIndex"
            @addLineSegment="index => addOrEditPathItem('add', '', index)"
            @editLineSegment="(row, index) => addOrEditPathItem('edit', row, index)"
            @deleteLineSegment="deleteLineSegment"
            @selectLineSegment="selectLineSegment"
          />
          <el-button class="advanced-add-button" @click="addOrEditPathItem('add')" link>
            <SvgIcon icon-class="Plus" />
          </el-button>
        </div>

        <Path2dDebugger
          v-if="activeName === 'advanced'"
          v-model:selected-index="selectedSegmentIndex"
          class="path-editor-preview advanced-preview"
          :segments="modelValue.pathInfo.segments"
        />
      </div>
    </el-tab-pane>
  </el-tabs>
  <div class="btn">
    <el-button @click="cancle">取消</el-button>
    <el-button type="primary" @click="confirm(activeName == 'basic' ? basicVariableRulesRef : variableRulesRef)">
      {{ addOrSave ? "添加" : "保存" }}
    </el-button>
  </div>

  <LineSegmentForm
    v-model="LineSegmentFormDialogVisiable"
    :addOrEditFlag="addOrEditFlag"
    :formData="form"
    :path-info="modelValue.pathInfo"
    :insert-index="middleIndex"
    @confirm="LineSegmentConfirm"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { IVariableJson } from "@/three/src/interface/modelEditor/json/IVariableJson";
import LineSegmentTable from "./components/LineSegmentTable.vue";
import LineSegmentForm from "./components/LineSegmentForm.vue";
// import Path2dDebugger from "./components/Path2dDebugger.vue";
import Path2dDebugger from "./components/Path2dDebugger/index.vue";
import { useVariableFormRules } from "@/hooks/useVariableRules";
import { ElMessage } from "element-plus";
import { PathInfo } from "@/three/src/object/bim/variable/PathInfo";
import {
  DxfPathAxisDirections,
  DxfPathImporter,
  type DxfPathAxisDirection,
} from "@/three/src/object/bim/profile/DxfPathImporter";
import { PathSourceKind } from "@/three/src/object/bim/variable/PathSourceKind";
import { PathVariableSemanticUtil } from "@/three/src/object/bim/variable/PathVariableSemanticUtil";
import { PathTemplateCompiler, RectShape } from "@/three/src/object/bim/variable/contour";
import { LegacyVariableTypeName } from "@/three/src/object/bim/variable/LegacyVariableType";
// import RAngleEdit from "./components/RAngleEdit.vue";
import RAngleEdit from "./components/RAngleEdit/index.vue";

import { bus } from "@/utils/bus";

const props = withDefaults(
  defineProps<{
    modelValue: any;
    addOrSave: boolean;
    directoryNameList: Array<any>;
  }>(),
  {},
);

const emits = defineEmits<{
  (e: "confirm");
  (e: "cancle");
}>();
const pathTemplateCompiler = new PathTemplateCompiler();
if (!props.modelValue.contourInfo) {
  props.modelValue.contourInfo = new RectShape();
}
const basicEditorEnabled = computed(() => PathVariableSemanticUtil.canUseBasicEditor(props.modelValue));
const basicContourReady = computed(() => basicEditorEnabled.value && !!props.modelValue.contourInfo);
const activeName = ref<"basic" | "advanced">("advanced");
const basicPreviewVersion = ref(0);
/** 编辑草稿预览线段；为空时使用外层已保存模板生成初始预览。 */
const basicPreviewSegmentsDraft = ref<any[] | null>(null);
const basicPreviewSegments = computed(() => {
  if (!basicContourReady.value) {
    return props.modelValue.pathInfo?.segments || [];
  }
  if (basicPreviewSegmentsDraft.value) {
    return basicPreviewSegmentsDraft.value;
  }
  try {
    basicPreviewVersion.value;
    return pathTemplateCompiler.compile(createPreviewContour()).segments;
  } catch (err) {
    console.warn("[PathVariableForm] 基础模式 2D 预览生成失败。", err);
    return props.modelValue.pathInfo?.segments || [];
  }
});

/** 接收 Store 草稿预览，避免编辑未确认时读取外层旧模板。 */
const updateBasicPreviewSegments = (segments: unknown[]): void => {
  // 使用新的数组引用替换基础模式草稿，确保投影切换后的轮廓触发右侧 Debug 更新。
  basicPreviewSegmentsDraft.value = [...segments] as any[];
};

const createPreviewContour = () => {
  const contourInfo = props.modelValue.contourInfo;
  return contourInfo;
};

watch(
  () => props.modelValue,
  modelValue => {
    activeName.value = PathVariableSemanticUtil.getDefaultEditorView(modelValue);
  },
  { immediate: true },
);

watch(basicEditorEnabled, enabled => {
  if (!enabled && activeName.value === "basic") {
    activeName.value = "advanced";
  }
});

const selectedSegmentIndex = ref(-1);
/** 基础模板编辑器实例，用于外层确认/取消时提交或恢复真实 Store 草稿。 */
const basicRAngleEditRef = ref<InstanceType<typeof RAngleEdit>>();

/**
 * 编辑器模式切换状态。
 * 进入高级模式前先提交基础 Store 草稿到当前弹窗的临时 modelValue，
 * 这样高级模式继续读取原有 pathInfo 链路；点击取消时外层仍会丢弃整个临时对象。
 */
const activeEditorName = computed<"basic" | "advanced">({
  get: (): "basic" | "advanced" => activeName.value,
  set: (value: "basic" | "advanced"): void => {
    if (value === "advanced" && activeName.value === "basic") {
      commitBasicDraft();
    }
    if (value === "basic" && !basicEditorEnabled.value) return;
    activeName.value = value;
  },
});
const dxfFileInputRef = ref<HTMLInputElement>();
const dxfXAxisDirection = ref<DxfPathAxisDirection>("+X");
const dxfYAxisDirection = ref<DxfPathAxisDirection>("-Z");
const dxfYAxisDirectionOptions = computed(() => DxfPathImporter.listOrthogonalAxisDirections(dxfXAxisDirection.value));

watch(dxfXAxisDirection, () => {
  if (!dxfYAxisDirectionOptions.value.includes(dxfYAxisDirection.value)) {
    dxfYAxisDirection.value = dxfYAxisDirectionOptions.value[0];
  }
});

/** 测试入口：读取本地 DXF 文件，创建 PathInfo 后输出解析结果。 */
const importDxfFileAsync = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const dxfSource = await file.text();
    const pathInfo = DxfPathImporter.createPathInfo(dxfSource, {
      xAxis: dxfXAxisDirection.value,
      yAxis: dxfYAxisDirection.value,
    });
    if (!pathInfo.segments.length) {
      ElMessage.warning("DXF 文件中没有可导入的路径");
      return;
    }

    props.modelValue.pathInfo = pathInfo;
    props.modelValue.pathInfo.segments = insertBetween(pathInfo.segments, { isMergeRow: true });
    props.modelValue.pathSourceKind = PathSourceKind.Import;
    props.modelValue.isUseContourEditor = false;
    selectedSegmentIndex.value = -1;
    console.log("[PathVariableForm] DXF 已填充到当前路径变量：", props.modelValue.pathInfo);
  } catch (error) {
    console.error("[PathVariableForm] DXF 导入测试失败：", error);
    ElMessage.error("DXF 文件解析失败");
  } finally {
    input.value = "";
  }
};

const { variableRules, formLabelWidth, variableRulesRef, basicVariableRulesRef, clearFormValidate } =
  useVariableFormRules(props);

const cancle = () => {
  props.modelValue.pathInfo.segments = props.modelValue.pathInfo.segments.filter(item => !item.isMergeRow);
  if (activeName.value === "basic") {
    // 基础模式取消时恢复 RAngleEdit 真实 Store 进入编辑前的 contourInfo 和变量信息。
    basicRAngleEditRef.value?.cancel();
  }
  emits("cancle");
};

const confirm = formEl => {
  formEl.validate(async valid => {
    console.log(
      "props.modelValue.contourInfo:::点击角点编辑弹窗保存按钮后会走这里001...",
      props.modelValue.contourInfo,
      valid,
      activeName.value,
    );
    if (valid) {
      if (activeName.value === "basic" && basicEditorEnabled.value) {
        // 基础模式确认前固化 Store 草稿，再沿既有模板编译链路生成 pathInfo。
        commitBasicDraft();
      } else {
        const segments = props.modelValue.pathInfo.segments.filter(item => !item.isMergeRow);
        if (!segments.length) {
          ElMessage({
            message: "线段不能为空！",
            type: "warning",
          });
          return;
        }
        props.modelValue.pathInfo = new PathInfo({ segments });
        if (props.modelValue.pathSourceKind !== PathSourceKind.Import) {
          props.modelValue.pathSourceKind = PathSourceKind.Manual;
        }
        props.modelValue.isUseContourEditor = false;
      }
      props.modelValue.variableType = LegacyVariableTypeName.Path;
      emits("confirm");
    } else {
      console.log("error submit!");
    }
  });
};

/** 将基础 Store 草稿同步到当前弹窗对象，并生成高级模式读取的路径数据。 */
const commitBasicDraft = (): void => {
  basicRAngleEditRef.value?.commit();
  if (!props.modelValue.contourInfo) return;
  props.modelValue.contourInfo.update();
  props.modelValue.pathInfo = pathTemplateCompiler.compile(props.modelValue.contourInfo);
  props.modelValue.pathSourceKind = PathSourceKind.Template;
  props.modelValue.isUseContourEditor = true;
};

const insertBetween = (arr, newItem) => {
  if (arr.length <= 1) return [...arr];
  return arr.reduce((acc, current, index) => {
    acc.push(current);
    if (index < arr.length - 1) {
      acc.push(newItem);
    }
    return acc;
  }, []);
};

const LineSegmentConfirm = formData => {
  console.log("高级模式下新增和编辑线段会走这里:::007...", formData);
  props.modelValue.pathInfo.segments = props.modelValue.pathInfo.segments.filter(item => !item.isMergeRow);
  if (addOrEditFlag.value) {
    // 新增线段
    props.modelValue.pathInfo.segments = IVariableJson.addPathSegments(
      formData,
      props.modelValue.pathInfo.segments,
      middleIndex.value,
    );
  } else {
    // 修改线段
    const oldData = props.modelValue.pathInfo.segments[editRowIndex.value];
    const editRowData = IVariableJson.changePathSegments(oldData, formData);
    props.modelValue.pathInfo.segments[editRowIndex.value] = editRowData;
  }
  props.modelValue.pathInfo.segments = insertBetween(props.modelValue.pathInfo.segments, { isMergeRow: true });
  selectedSegmentIndex.value = clampSelectedIndex(selectedSegmentIndex.value);
  LineSegmentFormDialogVisiable.value = false;
  props.modelValue.pathSourceKind = PathSourceKind.Manual;
  props.modelValue.isUseContourEditor = false;
};

const deleteLineSegment = index => {
  IVariableJson.deletePathSegments(props.modelValue.pathInfo.segments, index);
  props.modelValue.pathInfo.segments.splice(index, 1);
  selectedSegmentIndex.value = clampSelectedIndex(selectedSegmentIndex.value);
  props.modelValue.pathSourceKind = PathSourceKind.Manual;
  props.modelValue.isUseContourEditor = false;
};

const selectLineSegment = (row, visibleIndex) => {
  if (row?.isMergeRow) return;
  selectedSegmentIndex.value = visibleIndex;
};

const clampSelectedIndex = (index: number) => {
  const segments = props.modelValue.pathInfo.segments.filter(item => !item.isMergeRow);
  if (!segments.length) return -1;
  return Math.max(-1, Math.min(index, segments.length - 1));
};

// 定义表单初始状态
const createInitialForm = () => ({
  type: "line",
  startPoint: { x: "", y: "", z: "" },
  endPoint: { x: "", y: "", z: "" },
  arcDirection: true,
  radius: "",
  count: "",
});

const getExpressionContent = value => {
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

const initEditFormData = row => {
  form.value = {
    type: row?.type,
    startPoint: {
      x: getExpressionContent(row?.startPoint?.x),
      y: getExpressionContent(row?.startPoint?.y),
      z: getExpressionContent(row?.startPoint?.z),
    },
    endPoint: {
      x: getExpressionContent(row?.endPoint?.x),
      y: getExpressionContent(row?.endPoint?.y),
      z: getExpressionContent(row?.endPoint?.z),
    },
    arcDirection: row?.arcDirection,
    radius: getExpressionContent(row?.radius),
    count: getExpressionContent(row?.count),
  };
};

const form = ref(createInitialForm());

const LineSegmentFormDialogVisiable = ref(false);

const editRowIndex = ref();
const addOrEditFlag = ref(true);
const middleIndex = ref(-1);
const addOrEditPathItem = (flag: "add" | "edit", row?, index?) => {
  console.log("高级模式下新加线段:::006:::::yyn", row, index);

  // 新增线段
  if (flag === "add") {
    if (typeof index === "number") {
      middleIndex.value = index;
    } else {
      middleIndex.value = -1;
    }
    form.value = createInitialForm();
    addOrEditFlag.value = true;
  } else {
    // 修改线段
    editRowIndex.value = index / 2;
    addOrEditFlag.value = false;
    initEditFormData(row);
  }
  LineSegmentFormDialogVisiable.value = true;
};

defineExpose({
  clearFormValidate,
});
const refreshBasicPreview = (): void => {
  basicPreviewVersion.value += 1;
};
onMounted(() => {
  bus.on("refreshCount", refreshBasicPreview);
});
onBeforeUnmount(() => {
  bus.off("refreshCount", refreshBasicPreview);
});
</script>

<style lang="scss" scoped>
.btn {
  padding-top: 16px;
  display: flex;
  justify-content: end;
}

.basic-mode-empty {
  padding: 16px 0;
  color: var(--el-text-color-secondary);
}

.path-editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

.path-editor-main,
.path-editor-preview {
  min-width: 0;
}

.path-editor-preview {
  min-height: 360px;
}

.advanced-add-button {
  width: 100%;
  display: flex;
}

.advanced-test-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.dxf-axis-field {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.dxf-axis-select {
  width: 108px;
}

@media (min-width: 1040px) {
  .path-editor-layout {
    grid-template-columns: minmax(0, 1.12fr) minmax(340px, 0.88fr);
  }
}
</style>
