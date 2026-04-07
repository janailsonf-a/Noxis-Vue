<script setup>
import Sidebar from './Sidebar.vue'

defineProps({
  title: String,
})
</script>

<template>
  <div class="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-300">
    <div class="flex min-h-screen">
      <Sidebar />

      <main class="relative flex-1 overflow-hidden bg-[var(--app-bg)] transition-colors duration-300">
        <div class="pointer-events-none absolute inset-0">
          <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--app-grid-radial),transparent_32%)]"
          ></div>
          <div
            class="absolute inset-0 bg-[linear-gradient(var(--app-grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--app-grid-line)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70"
          ></div>
        </div>

        <div class="relative mx-auto max-w-[1480px] px-6 py-6 xl:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
