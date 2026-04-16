<script setup>
import { computed } from 'vue'
import { LogOut, Shield, User } from 'lucide-vue-next'
import Sidebar from './Sidebar.vue'

defineProps({
  title: String,
})

const authUser = computed(() => {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
})

const roleLabel = computed(() => {
  if (authUser.value?.role === 'admin') return 'Administrador'
  if (authUser.value?.role === 'user') return 'Usuário'
  return 'Visitante'
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}
</script>

<template>
  <div class="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-300">
    <div class="min-h-screen">
      <Sidebar />

      <main class="relative ml-[280px] min-h-screen bg-[var(--app-bg)] transition-colors duration-300">
        <div class="pointer-events-none absolute inset-0">
          <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--app-grid-radial),transparent_32%)]"
          ></div>
          <div
            class="absolute inset-0 bg-[linear-gradient(var(--app-grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--app-grid-line)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70"
          ></div>
        </div>

        <div class="relative mx-auto max-w-[1480px] px-6 py-6 xl:px-8">
          <header
            v-if="authUser"
            class="mb-6 flex flex-col gap-3 rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-4 shadow-[var(--app-shadow)] sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-surface-3)] text-[var(--app-text-soft)]"
              >
                <User class="h-5 w-5" />
              </div>

              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-[var(--app-text)]">
                  {{ authUser.name }}
                </p>

                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <span class="truncate text-xs text-[var(--app-text-subtle)]">
                    {{ authUser.email }}
                  </span>

                  <span
                    class="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-3)] px-2.5 py-1 text-[11px] text-[var(--app-text-soft)]"
                  >
                    <Shield class="h-3 w-3" />
                    {{ roleLabel }}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
              @click="logout"
            >
              <LogOut class="h-4 w-4" />
              Sair
            </button>
          </header>

          <slot />
        </div>
      </main>
    </div>
  </div>
</template>