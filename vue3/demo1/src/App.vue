<script setup>
import EmitParent from "./components/emit/Parent.vue";
import HelloWorld from "./components/HelloWorld.vue";
import PropsParent from "./components/props/Parent.vue";
import SlotBase from "./components/slot/base/Parent.vue";
</script>

<template>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">Vue 3 Study</p>
      <h1>Vue 学习模块展示区</h1>
      <p class="intro">
        后面你可以继续在这里按模块引入组件，每个模块都会显示成一张独立卡片。
      </p>
    </header>

    <section class="card-grid">
      <article class="card card-sky">
        <div class="card-header">
          <span class="tag">基础</span>
          <h2>HelloWorld</h2>
        </div>
        <HelloWorld />
      </article>

      <article class="card card-peach">
        <div class="card-header">
          <span class="tag">Props</span>
          <h2>组件传值</h2>
        </div>
        <PropsParent />
      </article>

      <article class="card card-peach">
        <div class="card-header">
          <span class="tag">Props</span>
          <h2>组件传值</h2>
        </div>
        <EmitParent />
      </article>

      <article class="card card-peach">
        <div class="card-header">
          <span class="tag">Props</span>
          <h2>组件传值</h2>
        </div>
        <SlotBase />
      </article>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  gap: 2rem;
  padding: 32px 20px 48px;
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 214, 165, 0.45),
      transparent 30%
    ),
    radial-gradient(
      circle at top right,
      rgba(173, 216, 255, 0.45),
      transparent 28%
    ),
    linear-gradient(180deg, #f7f7fb 0%, #eef4ff 100%);
}

.hero {
  width: min(1100px, 100%);
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #7a5cff;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0;
  color: #1f2937;
  font-size: clamp(2rem, 5vw, 3.4rem);
}

.intro {
  max-width: 760px;
  margin: 0.9rem 0 0;
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.7;
}

.card-grid {
  width: min(1100px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  padding: 1.5rem;
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(31, 41, 55, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(6px);
  color: #111827;
}

.card-sky {
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
}

.card-peach {
  background: linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%);
}

.card-header {
  margin-bottom: 1.25rem;
}

.tag {
  display: inline-block;
  margin-bottom: 0.75rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #374151;
  font-size: 0.78rem;
  font-weight: 700;
}

.card-header h2 {
  margin: 0;
  color: #111827;
  font-size: 1.35rem;
}

@media (max-width: 640px) {
  .page {
    padding: 20px 14px 32px;
  }

  .card {
    padding: 1.1rem;
    border-radius: 20px;
  }
}
</style>
