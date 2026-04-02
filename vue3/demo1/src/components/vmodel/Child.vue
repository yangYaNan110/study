<template>
  <div>
    <p>子组件{{ modelValue }}</p>
    <button @click="handleChange">改变值</button>
  </div>
</template>
<script setup>
defineProps({
  modelValue: Number,
});

const emit = defineEmits(["update:modelValue"]);

const handleChange = () => {
  console.log("触发改变");

  emit("update:modelValue", Math.random() * 100);
};
</script>
