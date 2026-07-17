<template>
  <el-form-item label="投影面">
    <el-select v-model="activeProjection">
      <el-option label="XZ" value="XZ" />
      <el-option label="XY" value="XY" />
      <el-option label="YZ" value="YZ" />
    </el-select>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRAngleEditContext } from "../store";
import type { TProjectionInfo } from "@/three/src/object/bim/variable/contour/type";

/** 投影面选择通过 Store 驱动基础模板轮廓和右侧预览同步刷新。 */
const { store } = useRAngleEditContext();

/** 投影面选择通过 Store 读写当前真实模板，并驱动轮廓预览刷新。 */
const activeProjection = computed<TProjectionInfo>({
  get: (): TProjectionInfo => store.getProjection(),
  set: (value: TProjectionInfo): void => store.updateProjection(value),
});
</script>
