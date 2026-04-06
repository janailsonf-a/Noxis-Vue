<script setup>
import { Search, Activity } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { to: '/', icon: Search, label: 'Search', description: 'Buscar arquivos' },
  { to: '/status', icon: Activity, label: 'Status', description: 'Monitoramento' },
]

function isActive(path) {
  return route.path === path
}
</script>

<template>
  <aside class="w-[260px] shrink-0 border-r border-white/6 bg-[#191919]">
    <div class="flex h-full flex-col px-4 py-5">
      <!-- Marca -->
      <div class="mb-8">
        <div class="flex items-center gap-3 rounded-2xl bg-[#202020] px-3 py-3">
          <div
            class="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[16px] bg-[#111111] p-[8px]"
          >
            <img
              src="/logo-noxis-dark.png"
              alt="Noxis"
              class="h-full w-full object-contain"
            />
          </div>

          <div class="min-w-0">
            <div class="text-[15px] font-semibold tracking-[-0.03em] text-white">
              Noxis
            </div>
            <div class="text-xs text-zinc-400">
              Workspace
            </div>
          </div>
        </div>
      </div>

      <!-- Seção -->
      <div class="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        Navegação
      </div>

      <!-- Navegação -->
      <nav class="flex flex-col gap-1.5">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="group rounded-xl px-3 py-3 transition-all duration-200"
          :class="
            isActive(item.to)
              ? 'bg-[#2A2A2A] text-white'
              : 'text-zinc-400 hover:bg-[#242424] hover:text-white'
          "
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition"
              :class="
                isActive(item.to)
                  ? 'bg-white/10 text-white'
                  : 'bg-[#232323] text-zinc-400 group-hover:bg-[#2B2B2B] group-hover:text-white'
              "
            >
              <component :is="item.icon" class="h-[18px] w-[18px]" />
            </div>

            <div class="min-w-0">
              <div
                class="truncate text-sm font-medium"
                :class="isActive(item.to) ? 'text-white' : 'text-zinc-200'"
              >
                {{ item.label }}
              </div>

              <div
                class="truncate text-xs"
                :class="isActive(item.to) ? 'text-zinc-400' : 'text-zinc-500'"
              >
                {{ item.description }}
              </div>
            </div>
          </div>
        </RouterLink>
      </nav>

      <!-- Rodapé -->
      <div class="mt-auto pt-6">
        <div class="rounded-2xl border border-white/6 bg-[#202020] px-3 py-3">
          <div class="text-xs text-zinc-500">Ambiente</div>
          <div class="mt-1 text-sm font-medium text-zinc-200">Noxis Core</div>
        </div>
      </div>
    </div>
  </aside>
</template>