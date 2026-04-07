<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import api from '../services/api'
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Clock3,
  Terminal,
  TrendingUp,
  Database,
} from 'lucide-vue-next'

const loading = ref(false)
const error = ref('')

const status = ref({
  overall_status: '...',
  metrics: {
    cpu: 0,
    ram: 0,
  },
  disk: {
    usage_percent: 0,
    used_tb: 0,
    free_tb: 0,
    total_tb: 0,
  },
  services: {
    rclone_active: false,
  },
})

const indexer = ref({
  processed: 0,
  total: 0,
  percent: 0,
  speed: 0,
  eta_sec: 0,
  last_new: 0,
  last_updated: 0,
  last_deleted: 0,
  last_finished_time: null,
})

const activities = ref([])
const history = ref({
  dates: [],
  values: [],
})

function formatNumber(value) {
  if (value == null) return '--'
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatValue(value) {
  if (value == null || Number.isNaN(Number(value))) return 0
  return Number(value)
}

function formatTerminalTime(value) {
  if (!value) return '--'
  return String(value).replace('T', ' ').slice(0, 19)
}
function formatDateTime(value) {
  if (!value) return '--'

  try {
    // se for número (timestamp)
    const timestamp = Number(value)

    if (!isNaN(timestamp)) {
      const date = new Date(timestamp * 1000) // 🔥 conversão correta
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(date)
    }

    // fallback (caso venha string ISO no futuro)
    const date = new Date(value)
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(date)

  } catch {
    return value
  }
}

function normalizeActionLabel(action) {
  if (!action) return 'evento'
  const map = {
    created: 'created',
    updated: 'updated',
    deleted: 'deleted',
    indexed: 'indexed',
    new: 'new',
  }
  return map[String(action).toLowerCase()] || String(action).toLowerCase()
}

function terminalOutput(activity) {
  const action = normalizeActionLabel(activity?.action)
  const file = activity?.filename || activity?.rel_path || '--'

  return [
    '$ noxis indexer',
    `> arquivo: ${file}`,
    `> ação: ${action}`,
    '> status: concluído',
    `> horário: ${formatTerminalTime(activity?.created_at)}`,
  ]
}

const chartData = computed(() => {
  const dates = history.value?.dates || []
  const values = history.value?.values || []

  return dates.map((date, index) => ({
    date,
    value: formatValue(values[index]),
  }))
})

const chartMax = computed(() => {
  if (!chartData.value.length) return 1
  const max = Math.max(...chartData.value.map((item) => item.value))
  return max <= 0 ? 1 : max
})

const chartMin = computed(() => {
  if (!chartData.value.length) return 0
  return Math.min(...chartData.value.map((item) => item.value))
})

const lastChartValue = computed(() => {
  if (!chartData.value.length) return '--'
  return chartData.value[chartData.value.length - 1]?.value ?? '--'
})

const chartPoints = computed(() => {
  const data = chartData.value
  if (!data.length) return ''

  const width = 760
  const height = 260
  const paddingX = 28
  const paddingY = 24
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingY * 2

  const min = chartMin.value
  const max = chartMax.value
  const range = max - min || 1

  return data
    .map((item, index) => {
      const x =
        data.length === 1
          ? width / 2
          : paddingX + (index / (data.length - 1)) * usableWidth

      const y =
        paddingY + usableHeight - ((item.value - min) / range) * usableHeight

      return `${x},${y}`
    })
    .join(' ')
})

const chartAreaPoints = computed(() => {
  const line = chartPoints.value
  if (!line) return ''

  const points = line.split(' ')
  const first = points[0]
  const last = points[points.length - 1]

  if (!first || !last) return ''

  const firstX = first.split(',')[0]
  const lastX = last.split(',')[0]
  const baseY = 260 - 24

  return `${line} ${lastX},${baseY} ${firstX},${baseY}`
})

const chartDots = computed(() => {
  const data = chartData.value
  if (!data.length) return []

  const width = 760
  const height = 260
  const paddingX = 28
  const paddingY = 24
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingY * 2

  const min = chartMin.value
  const max = chartMax.value
  const range = max - min || 1

  return data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX + (index / (data.length - 1)) * usableWidth

    const y =
      paddingY + usableHeight - ((item.value - min) / range) * usableHeight

    return {
      ...item,
      x,
      y,
      isLast: index === data.length - 1,
    }
  })
})

async function fetchStatus() {
  loading.value = true
  error.value = ''

  try {
    const [statusRes, indexerRes, activitiesRes, historyRes] = await Promise.all([
      api.get('/api/status'),
      api.get('/api/index-status'),
      api.get('/api/activities?limit=6'),
      api.get('/api/history'),
    ])

    status.value = statusRes.data
    indexer.value = indexerRes.data
    activities.value = activitiesRes.data
    history.value = historyRes.data
  } catch {
    error.value = 'Não foi possível carregar os dados do status.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStatus()
})
</script>

<template>
  <AppLayout title="Status">
    <div class="grid gap-6">
      <div>
        <div class="mb-2 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
          <span>Noxis</span>
          <span>/</span>
          <span class="font-medium text-[var(--app-text-soft)]">Status</span>
        </div>

        <h1 class="text-[34px] font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          Status do sistema
        </h1>

        <p class="mt-1 text-sm text-[var(--app-text-muted)]">
          Monitoramento em tempo real do indexador e dos principais indicadores.
        </p>
      </div>

      <section
        v-if="error"
        class="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      >
        {{ error }}
      </section>

      <section class="grid gap-4 md:grid-cols-4">
        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
            <Activity class="h-4 w-4" />
            Status geral
          </div>
          <div class="text-3xl font-semibold capitalize text-[var(--app-text)]">
            {{ status.overall_status }}
          </div>
        </div>

        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
            <Cpu class="h-4 w-4" />
            CPU
          </div>
          <div class="text-3xl font-semibold text-[var(--app-text)]">
            {{ status.metrics.cpu }}%
          </div>
        </div>

        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
            <MemoryStick class="h-4 w-4" />
            RAM
          </div>
          <div class="text-3xl font-semibold text-[var(--app-text)]">
            {{ status.metrics.ram }}%
          </div>
        </div>

        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
            <HardDrive class="h-4 w-4" />
            Disco
          </div>
          <div class="text-3xl font-semibold text-[var(--app-text)]">
            {{ status.disk.usage_percent }}%
          </div>
        </div>
      </section>

      <section class="grid gap-6">
        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-[var(--app-text)]">Indexação</h2>
            <p class="mt-1 text-sm text-[var(--app-text-muted)]">
              Visão atual do worker e do volume processado.
            </p>
          </div>

          <div class="mb-5 h-3 overflow-hidden rounded-full bg-[var(--app-surface-3)]">
            <div
              class="h-full rounded-full bg-[var(--app-primary)]"
              :style="{ width: `${indexer.percent || 0}%` }"
            ></div>
          </div>

          <div class="grid gap-4 md:grid-cols-5">
            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Percentual</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ indexer.percent }}%
              </div>
            </div>

            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Processados</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ formatNumber(indexer.processed) }}
              </div>
            </div>

            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Velocidade</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ formatNumber(indexer.speed) }}
              </div>
            </div>

            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Novos</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ formatNumber(indexer.last_new) }}
              </div>
            </div>

            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Última execução</div>
              <div class="mt-1 text-base font-semibold text-[var(--app-text)]">
                {{ formatDateTime(indexer.last_finished_time) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h2 class="flex items-center gap-2 text-xl font-semibold text-[var(--app-text)]">
                <Terminal class="h-5 w-5 text-[var(--app-primary)]" />
                Atividades recentes
              </h2>
              <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                Saída recente do worker em formato de terminal.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span class="h-3 w-3 rounded-full bg-[#FF5F57]"></span>
              <span class="h-3 w-3 rounded-full bg-[#FEBC2E]"></span>
              <span class="h-3 w-3 rounded-full bg-[#28C840]"></span>
            </div>
          </div>

          <div class="overflow-hidden rounded-[20px] border border-[var(--app-border)] bg-[var(--app-terminal)]">
            <div class="border-b border-[var(--app-border)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[var(--app-text-subtle)]">
              noxis@worker:~$
            </div>

            <div v-if="loading" class="px-4 py-8 font-mono text-sm text-[var(--app-text-subtle)]">
              <span class="text-[var(--app-primary)]">$</span> carregando atividades...
            </div>

            <div v-else-if="activities.length" class="space-y-0 font-mono text-sm">
              <div
                v-for="(activity, index) in activities"
                :key="index"
                class="border-b border-[var(--app-border-soft)] px-4 py-4 last:border-b-0"
              >
                <div
                  v-for="line in terminalOutput(activity)"
                  :key="line"
                  class="mb-1 break-all text-[var(--app-text-soft)] last:mb-0"
                >
                  <span
                    v-if="line.startsWith('$')"
                    class="text-[var(--app-primary)]"
                  >
                    {{ line }}
                  </span>
                  <span
                    v-else
                    class="text-[var(--app-text-muted)]"
                  >
                    {{ line }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="px-4 py-8 font-mono text-sm text-[var(--app-text-subtle)]">
              <span class="text-[var(--app-primary)]">$</span> aguardando novas atividades...
            </div>
          </div>

          <div class="mt-4 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-terminal)] px-4 py-4 font-mono text-sm text-[var(--app-text-soft)]">
            <div class="mb-2 flex items-center gap-2 text-[var(--app-text-subtle)]">
              <Database class="h-4 w-4" />
              noxis status
            </div>
            <div class="space-y-1">
              <p>
                <span class="text-emerald-400">✔</span> rclone:
                {{ status.services.rclone_active ? 'ativo' : 'inativo' }}
              </p>
              <p>
                <span class="text-emerald-400">✔</span> disco usado:
                {{ status.disk.used_tb }} TB
              </p>
              <p>
                <span class="text-emerald-400">✔</span> disco livre:
                {{ status.disk.free_tb }} TB
              </p>
              <p>
                <span class="text-emerald-400">✔</span> total:
                {{ status.disk.total_tb }} TB
              </p>
              <p>
                <span class="text-emerald-400">✔</span> status geral:
                {{ status.overall_status }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 class="flex items-center gap-2 text-xl font-semibold text-[var(--app-text)]">
                <TrendingUp class="h-5 w-5 text-[var(--app-primary)]" />
                Histórico de crescimento
              </h2>
              <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                Evolução do uso registrado ao longo do tempo.
              </p>
            </div>

            <div class="text-right">
              <div class="text-xs uppercase tracking-[0.14em] text-[var(--app-text-subtle)]">
                Último valor
              </div>
              <div class="text-2xl font-semibold text-[var(--app-text)]">
                {{ lastChartValue }} TB
              </div>
            </div>
          </div>

          <div
            v-if="loading"
            class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-3)] p-4"
          >
            <div class="animate-pulse">
              <div class="mb-3 flex items-center justify-between">
                <div class="h-4 w-24 rounded bg-[var(--app-surface-hover)]"></div>
                <div class="h-4 w-20 rounded bg-[var(--app-surface-hover)]"></div>
              </div>
              <div class="h-[260px] rounded bg-[var(--app-surface-2)]"></div>
            </div>
          </div>

          <div v-else-if="chartData.length" class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-3)] p-4">
            <div class="mb-3 flex items-center justify-between">
              <div class="text-sm text-[var(--app-text-subtle)]">Volume total</div>
              <div class="text-sm font-medium text-[var(--app-text)]">
                Pico: {{ chartMax }} TB
              </div>
            </div>

            <div class="overflow-x-auto">
              <svg
                viewBox="0 0 760 260"
                class="h-[260px] min-w-[760px] w-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="noxisArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#FF9200" stop-opacity="0.28" />
                    <stop offset="100%" stop-color="#FF9200" stop-opacity="0.03" />
                  </linearGradient>
                </defs>

                <line x1="28" y1="236" x2="732" y2="236" stroke="#2A2A2A" />
                <line x1="28" y1="180" x2="732" y2="180" stroke="#2A2A2A" />
                <line x1="28" y1="124" x2="732" y2="124" stroke="#2A2A2A" />
                <line x1="28" y1="68" x2="732" y2="68" stroke="#2A2A2A" />
                <line x1="28" y1="24" x2="732" y2="24" stroke="#2A2A2A" />

                <polygon
                  :points="chartAreaPoints"
                  fill="url(#noxisArea)"
                />

                <polyline
                  :points="chartPoints"
                  fill="none"
                  stroke="#FF9200"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <g v-for="dot in chartDots" :key="dot.date">
                  <circle
                    :cx="dot.x"
                    :cy="dot.y"
                    :r="dot.isLast ? 7 : 5"
                    :fill="dot.isLast ? '#FF9200' : '#1C1C1C'"
                    stroke="#FF9200"
                    stroke-width="3"
                  />
                </g>
              </svg>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div
                v-for="item in chartDots"
                :key="item.date"
                class="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
              >
                <div class="truncate text-xs text-[var(--app-text-subtle)]">
                  {{ item.date }}
                </div>
                <div class="mt-1 text-sm font-medium text-[var(--app-text)]">
                  {{ item.value }} TB
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-10 text-sm text-[var(--app-text-muted)]"
          >
            Nenhum dado de histórico disponível.
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>