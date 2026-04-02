<template>
  <div class="card">
    <slot> 这是插槽的默认内容 </slot>
  </div>
</template>
<script setup></script>
<style scoped>
.card {
  padding: 20px;
  border-radius: 16px;
  background: #fef3c7;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}
</style>
