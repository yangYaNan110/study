<script setup>
import { ref } from "vue";
import Child from "./Child.vue";
let childMessage = ref("");
const getMessage = (message) => {
  console.log("父组件收到了:", message);
  childMessage.value = message;
};
</script>
<template>
  <Child @send-message="getMessage" />
  <p>
    {{ childMessage }}
  </p>
</template>
