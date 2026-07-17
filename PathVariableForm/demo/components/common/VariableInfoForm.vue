<template>
  <!-- 基础模式和高级模式共用的变量公共信息表单。 -->
  <!-- 110px 与正式版 useVariableFormRules 返回的 formLabelWidth 保持一致。 -->
  <el-form label-width="110px" class="variable-info-form">
    <el-form-item prop="directory" label="所属变量分组">
      <el-select
        v-model="directory"
        multiple
        filterable
        allow-create
        default-first-option
        :reserve-keyword="false"
      >
        <el-option v-for="item in directory" :key="item" :label="item" :value="item" />
      </el-select>
    </el-form-item>
    <el-form-item prop="name" label="变量名">
      <el-input v-model="name" maxlength="10" autocomplete="off" />
    </el-form-item>
    <el-form-item prop="refName" label="引用名">
      <el-input
        v-model="refName"
        :disabled="!store.advancedAddOrSave.value"
        maxlength="5"
        autocomplete="off"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePathEditorContext } from "../../store/PathEditorStore";

const { store } = usePathEditorContext();

/** 公共信息统一写入 Store，避免基础和高级模式各自维护一份数据。 */
const directory = computed({
  get: (): string[] => store.advancedDirectory.value,
  set: (value: string[]): void => (store.advancedDirectory.value = value),
});
const name = computed({
  get: (): string => store.advancedName.value,
  set: (value: string): void => (store.advancedName.value = value),
});
const refName = computed({
  get: (): string => store.advancedRefName.value,
  set: (value: string): void => (store.advancedRefName.value = value),
});
</script>

<style scoped lang="scss">
.variable-info-form {
  display: block;
}
</style>
