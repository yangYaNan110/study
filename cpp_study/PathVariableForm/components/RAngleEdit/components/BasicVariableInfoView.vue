<!-- 基础变量信息组件：只负责名称和引用名的展示、输入及事件转发。 -->
<template>
  <div class="basic-variable-info-view">
    <el-form label-width="90px">
      <el-form-item label="变量名">
        <el-input v-model="name" maxlength="10" autocomplete="off" />
      </el-form-item>
      <el-form-item label="引用名">
        <el-input v-model="refName" :disabled="!store.addOrSave.value" maxlength="20" autocomplete="off" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRAngleEditContext } from "../store";

const { store } = useRAngleEditContext();

/** 将文本输入映射为 Store 方法，组件不直接修改静态草稿对象。 */
const name = computed({
  get: (): string => store.name.value,
  set: (value: string): void => store.updateName(value),
});

const refName = computed({
  get: (): string => store.refName.value,
  set: (value: string): void => store.updateRefName(value),
});
</script>

<style scoped lang="scss">
.basic-variable-info-view {
  min-width: 0;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}
</style>
