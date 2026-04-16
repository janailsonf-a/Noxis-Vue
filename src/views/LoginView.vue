<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LockKeyhole, Mail, LogIn, ShieldCheck, Search } from 'lucide-vue-next'
import api from '../services/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submitLogin() {
  error.value = ''
  loading.value = true

  try {
    const response = await api.post('/api/auth/login', {
      email: email.value,
      password: password.value,
    })

    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))

    router.push('/')
  } catch (err) {
    error.value =
      err?.response?.data?.detail || 'Não foi possível entrar. Verifique suas credenciais.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
    <div class="pointer-events-none absolute inset-0">
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--app-grid-radial),transparent_32%)]"
      ></div>
      <div
        class="absolute inset-0 bg-[linear-gradient(var(--app-grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--app-grid-line)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70"
      ></div>
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-[1400px] items-center px-4 py-8 sm:px-6 lg:px-8">
      <div class="grid w-full gap-8 lg:grid-cols-[1.1fr_520px] lg:items-center">
        <section class="hidden lg:block">
          <div class="max-w-xl">
            <div
              class="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm text-[var(--app-text-soft)] shadow-[var(--app-shadow)]"
            >
              <ShieldCheck class="h-4 w-4 text-[var(--app-accent-text)]" />
              Acesso seguro ao Noxis
            </div>

            <h1 class="text-5xl font-semibold leading-[1.05] tracking-[-0.05em] text-[var(--app-text)]">
              Organize, localize e gerencie arquivos com mais controle.
            </h1>

            <p class="mt-5 max-w-lg text-base leading-7 text-[var(--app-text-muted)]">
              Entre na plataforma para pesquisar arquivos, visualizar metadados e acessar seu
              ambiente com segurança e permissões por perfil.
            </p>

            <div class="mt-8 grid gap-4 sm:grid-cols-2">
              <div
                class="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]"
              >
                <div
                  class="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-surface-3)] text-[var(--app-accent-text)]"
                >
                  <Search class="h-5 w-5" />
                </div>
                <h2 class="text-sm font-medium text-[var(--app-text)]">Busca centralizada</h2>
                <p class="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                  Encontre rapidamente arquivos por nome, caminho, campanha, descrição e tags.
                </p>
              </div>

              <div
                class="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]"
              >
                <div
                  class="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-surface-3)] text-[var(--app-accent-text)]"
                >
                  <ShieldCheck class="h-5 w-5" />
                </div>
                <h2 class="text-sm font-medium text-[var(--app-text)]">Permissões por perfil</h2>
                <p class="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                  Usuários autenticados visualizam arquivos, enquanto administradores editam
                  metadados com segurança.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="w-full">
          <div
            class="mx-auto w-full max-w-[520px] rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[var(--app-shadow-strong)] sm:p-8"
          >
            <div class="mb-8">
              <div
                class="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--app-text-subtle)]"
              >
                Noxis
              </div>

              <h1 class="text-3xl font-semibold tracking-[-0.04em] text-[var(--app-text)] sm:text-4xl">
                Entrar
              </h1>

              <p class="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">
                Acesse sua conta para visualizar, pesquisar e gerenciar arquivos na plataforma.
              </p>
            </div>

            <div
              v-if="error"
              class="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {{ error }}
            </div>

            <form class="space-y-4" @submit.prevent="submitLogin">
              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  E-mail
                </label>
                <div class="relative">
                  <Mail
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    class="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-subtle)] focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-hover)]"
                    placeholder="admin@noxis.com"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  Senha
                </label>
                <div class="relative">
                  <LockKeyhole
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    v-model="password"
                    type="password"
                    autocomplete="current-password"
                    class="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-subtle)] focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-hover)]"
                    placeholder="Sua senha"
                  />
                </div>
              </div>

              <button
                type="submit"
                class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-4 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="loading"
              >
                <LogIn class="h-4 w-4" />
                {{ loading ? 'Entrando...' : 'Entrar' }}
              </button>
            </form>

            <div class="mt-6 border-t border-[var(--app-border)] pt-5">
              <p class="text-xs leading-5 text-[var(--app-text-subtle)]">
                Seu acesso é validado com autenticação e permissões por perfil para proteger a
                edição de metadados e o ambiente da plataforma.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>