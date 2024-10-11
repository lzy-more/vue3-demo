<script setup lang="ts">
import { ref } from "vue";

defineProps<{ msg: string }>();

const count = ref(0);
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card flex-1 bg-slate-500">
    <button type="button" @click="count++" class="button">
      count is {{ count }}
    </button>
    <a-space wrap>
      <a-button type="primary">Primary Button</a-button>
      <a-button>Default Button</a-button>
      <a-button type="dashed">Dashed Button</a-button>
      <a-button type="text">Text Button</a-button>
      <a-button type="link">Link Button</a-button>
    </a-space>
    <div
      class="bg-slate-500 text-3xl font-bold bg-sky-500 hover:bg-sky-700 cursor-pointer"
    >
      tailwindcss
    </div>
  </div>
</template>

<style scoped lang="scss">
.read-the-docs {
  color: #888;
}
.button {
  color: $secondary-color;
}
</style>
