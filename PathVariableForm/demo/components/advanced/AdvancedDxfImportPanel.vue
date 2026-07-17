<template>
  <!-- DXF 导入面板只负责收集导入参数，文件解析和线段替换交给 Store。 -->
  <div class="advanced-dxf-import-panel">
    <label>
      CAD X →
      <el-select v-model="dxfXAxisDirection">
        <el-option v-for="direction in DxfPathAxisDirections" :key="direction" :label="direction" :value="direction" />
      </el-select>
    </label>
    <label>
      CAD Y →
      <el-select v-model="dxfYAxisDirection">
        <el-option v-for="direction in dxfYAxisDirectionOptions" :key="direction" :label="direction" :value="direction" />
      </el-select>
    </label>
    <input ref="fileInputRef" type="file" accept=".dxf" hidden @change="importDxfFileAsync" />
    <el-button @click="fileInputRef?.click()">导入 DXF 轮廓</el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { DxfPathAxisDirections, DxfPathImporter, type DxfPathAxisDirection } from "@/three/src/object/bim/profile/DxfPathImporter";
import { usePathEditorContext } from "../../store/PathEditorStore";

const { store } = usePathEditorContext();
const fileInputRef = ref<HTMLInputElement>();
const dxfXAxisDirection = ref<DxfPathAxisDirection>("+X");
const dxfYAxisDirection = ref<DxfPathAxisDirection>("-Z");
const dxfYAxisDirectionOptions = computed(() => DxfPathImporter.listOrthogonalAxisDirections(dxfXAxisDirection.value));

// X 轴变化后重新校正 Y 轴，避免用户选择两个相同或不垂直的方向。
watch(dxfXAxisDirection, () => {
  if (!dxfYAxisDirectionOptions.value.includes(dxfYAxisDirection.value)) {
    dxfYAxisDirection.value = dxfYAxisDirectionOptions.value[0];
  }
});

/** DXF 文件只在此处读取，解析结果交由编辑 Store 替换高级线段。 */
const importDxfFileAsync = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    await store.importDxfAsync(await file.text(), dxfXAxisDirection.value, dxfYAxisDirection.value);
  } finally {
    input.value = "";
  }
};
</script>

<style scoped lang="scss">
.advanced-dxf-import-panel {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.advanced-dxf-import-panel label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.advanced-dxf-import-panel .el-select {
  width: 100px;
}
</style>
