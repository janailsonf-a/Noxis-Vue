<script setup>
import { Search, Activity, MoonStar, SunMedium } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useTheme } from '../../composables/useTheme'

const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const items = [
  { to: '/', icon: Search, label: 'Search', description: 'Buscar arquivos' },
  { to: '/status', icon: Activity, label: 'Status', description: 'Monitoramento' },
]

const logoSrc = computed(() => (isDark.value ? '/logo-noxis-dark.png' : '/logo-noxis-dark.png'))

function isActive(path) {
  return route.path === path
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 z-40 h-screen w-[280px] shrink-0 border-r border-[var(--app-border)] bg-[var(--app-sidebar)] transition-colors duration-300"
  >
    <div class="flex h-full flex-col px-4 py-5">
      <div class="mb-8">
        <div
          class="flex items-center gap-4 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-4 py-4 shadow-[var(--app-shadow)] transition-colors duration-300"
        >
        <div
          class="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-[1px] shadow-sm"
        >
          <img
            :src="logoSrc"
            alt="Noxis"
            class="h-full w-full object-contain scale-110"
          />
        </div>

          <div class="min-w-0">
            <div class="text-[20px] font-semibold tracking-[-0.03em] text-[var(--app-text)]">
              Noxis
            </div>
            <div class="mt-1 text-sm text-[var(--app-text-muted)]">
              Workspace
            </div>
          </div>
        </div>
      </div>

      <div class="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--app-text-subtle)]">
        Navegação
      </div>

      <nav class="flex flex-col gap-1.5">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="group rounded-xl px-3 py-3 transition-all duration-200"
          :class="
            isActive(item.to)
              ? 'border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text)]'
              : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-2)] hover:text-[var(--app-text)]'
          "
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] transition"
              :class="
                isActive(item.to)
                  ? 'bg-[var(--app-surface)] text-[var(--app-text)]'
                  : 'bg-[var(--app-surface-2)] text-[var(--app-text-muted)] group-hover:bg-[var(--app-surface-3)] group-hover:text-[var(--app-text)]'
              "
            >
              <component :is="item.icon" class="h-[18px] w-[18px]" />
            </div>

            <div class="min-w-0">
              <div
                class="truncate text-sm font-medium"
                :class="isActive(item.to) ? 'text-[var(--app-text)]' : 'text-[var(--app-text-strong)]'"
              >
                {{ item.label }}
              </div>

              <div
                class="truncate text-xs"
                :class="isActive(item.to) ? 'text-[var(--app-text-muted)]' : 'text-[var(--app-text-subtle)]'"
              >
                {{ item.description }}
              </div>
            </div>
          </div>
        </RouterLink>
      </nav>

      <div class="mt-auto space-y-3 pt-6">
        <button
          class="flex w-full items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-3 text-left transition hover:bg-[var(--app-surface-3)]"
          @click="toggleTheme"
        >
          <div>
            <div class="text-xs text-[var(--app-text-muted)]">Tema</div>
            <div class="mt-1 text-sm font-medium text-[var(--app-text-strong)]">
              {{ isDark ? 'Modo escuro' : 'Modo claro' }}
            </div>
          </div>

          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--app-surface)] text-[var(--app-primary)]">
            <MoonStar v-if="isDark" class="h-5 w-5" />
            <SunMedium v-else class="h-5 w-5" />
          </div>
        </button>

        <div class="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-3">
          <div class="text-xs text-[var(--app-text-muted)]">Ambiente</div>
          <div class="mt-1 text-sm font-medium text-[var(--app-text-strong)]">Noxis Core</div>
        </div>
      </div>
    </div>
  </aside>
</template>