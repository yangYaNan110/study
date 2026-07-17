<!-- 梯形模板占位组件：当前只展示未实现状态，不生成正式模板数据。 -->
<template>
  <!-- 占位组件保留模板切换入口，后续只需在此扩展参数编辑 UI。 -->
  <div class="template-placeholder">
    <el-empty description="梯形模板暂未实现" />
  </div>
</template>

<style scoped lang="scss">
.template-placeholder {
  min-height: 180px;
}
</style>
