<!-- 学习props传值的使用 -->
<template>
  <child :msg1="msg" :desc="desc" msg="hello world" title="你好 vue!"></child>
</template>
<script setup>
import child from "./child.vue";
const msg = "这是父组件传来的数据";
const desc = "这是动态传值";
</script>
