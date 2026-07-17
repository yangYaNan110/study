<template>
  <div class="path-editor-footer-view">
    <!-- 取消只恢复 Store 最近一次保存的快照，不修改正式业务数据。 -->
    <el-button @click="$emit('cancel')">取消</el-button>
    <!-- 保存提交当前 demo 草稿，后续接入正式入口时再映射为 confirm 事件。 -->
    <el-button type="primary" @click="$emit('save')">保存</el-button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  /** 用户点击取消按钮。 */
  cancel: [];
  /** 用户点击保存按钮。 */
  save: [];
}>();
</script>

<style scoped lang="scss">
.path-editor-footer-view {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
}
</style>
