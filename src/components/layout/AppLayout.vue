<script setup>
import Sidebar from './Sidebar.vue'

defineProps({
  title: String,
})
</script>

<template>
  <div class="min-h-screen bg-[#141414] text-white">
    <div class="flex min-h-screen">
      <Sidebar />

      <main class="relative flex-1 overflow-hidden bg-[#141414]">
        <!-- textura de fundo sutil -->
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_30%)]"></div>
          <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
        </div>

        <div class="relative mx-auto max-w-[1480px] px-6 py-6 xl:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>