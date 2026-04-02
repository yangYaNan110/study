<!-- emit是子组件给父组件传值 -->
<script setup>
const test = "子组件的数据";
const emit = defineEmits(["send-message"]);
const handleClick = () => {
  emit("send-message", test + Math.random());
};
</script>
<template>
  <button @click="handleClick">子组件给父组件传数据</button>
</template>
