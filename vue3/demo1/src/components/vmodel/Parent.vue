<!-- 父组件 -->
<script setup>
import { ref } from "vue";
import Child from "./Child.vue";

const sum = ref(100);
</script>
<template>
  <div>
    <h2>父组件 sum: {{ sum }}</h2>
    <Child v-model="sum" />
  </div>
</template>
