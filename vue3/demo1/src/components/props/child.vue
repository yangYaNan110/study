<template>
  <div>
    <h1>{{ msg }}</h1>
    <p>{{ title }}</p>
    <p>传变量用:{{ msg1 }}</p>
    <p>{{ desc }}</p>
  </div>
</template>
<script setup>
defineProps({
  msg: String,
  title: String,
  msg1: String,
  desc: String,
});
</script>
<style scoped></style>
