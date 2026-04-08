<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import api from '../services/api'
import {
  Search,
  FileText,
  Image,
  FileSpreadsheet,
  Clock3,
  Eye,
  Download,
  Clipboard,
  Grid2X2,
  List,
  File,
  ChevronRight,
  X,
  Calendar,
  HardDrive,
  FolderTree,
  Info,
  Check,
} from 'lucide-vue-next'

const quickFilters = [
  { label: 'PDF', value: 'pdf', icon: FileText },
  { label: 'Planilhas', value: 'xlsx', icon: FileSpreadsheet },
  { label: 'Imagens', value: 'png', icon: Image },
  { label: 'Recentes', value: '', icon: Clock3 },
]

const PREVIEWABLE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'pdf',
  'txt',
  'svg',
]

const query = ref('')
const order = ref('recent')
const page = ref(1)
const pageSize = ref(20)
const viewMode = ref('grid')

const selectedExt = ref('')

const loading = ref(false)
const error = ref('')
const files = ref([])
const selectedId = ref(null)
const showDetailsModal = ref(false)
const copied = ref(false)

const meta = ref({
  total_indexed: 0,
  total_matches: 0,
  query_ms: null,
  page: 1,
  total_pages: 0,
  page_size: 20,
  order: 'recent',
  pages_to_show: [],
})

let debounceTimer = null

const selectedFile = computed(() => {
  return files.value.find((file) => file.id === selectedId.value) ?? files.value[0] ?? null
})

function shortenPath(path, max = 72) {
  if (!path || path.length <= max) return path
  const start = path.slice(0, Math.floor(max / 2) - 2)
  const end = path.slice(-(Math.floor(max / 2) - 3))
  return `${start}...${end}`
}

function formatTypeLabel(type) {
  if (!type) return 'Arquivo'
  return String(type).toUpperCase()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text, term) {
  if (!text) return ''
  if (!term || term.trim().length < 1) return text

  const safeTerm = escapeRegExp(term.trim())
  const regex = new RegExp(`(${safeTerm})`, 'ig')

  return text.replace(
    regex,
    '<mark class="rounded px-1 py-0.5 bg-[var(--app-accent-bg)] text-[var(--app-accent-text)]">$1</mark>'
  )
}

function normalizeFile(item, index) {
  const ext =
    item.ext ||
    item.extension ||
    (item.filename?.includes('.') ? item.filename.split('.').pop() : 'file')

  return {
    id: item.id ?? `${item.rel_path}-${index}`,
    name: item.filename ?? 'Arquivo sem nome',
    path: item.rel_path ?? '',
    fullPath: item.full_path || item.fullPath || item.network_path || item.rel_path || '',
    size: item.size_mb != null ? `${item.size_mb} MB` : '--',
    updated: item.modified_at || '--',
    created: item.created_at || '--',
    type: String(ext || 'file').replace('.', '').toLowerCase(),
    area: item.area || item.rel_path?.split('/')?.[0] || 'Geral',
    description: item.rel_path ? `Arquivo localizado em ${item.rel_path}` : 'Arquivo indexado',
    previewLink: item.preview_link || item.previewLink || null,
    downloadLink:
      item.download_link ||
      item.downloadLink ||
      (item.rel_path ? `/download?path=${encodeURIComponent(item.rel_path)}` : null),
  }
}

function canPreview(file) {
  return PREVIEWABLE_EXTENSIONS.includes((file?.type || '').toLowerCase())
}

function isImage(file) {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(
    (file?.type || '').toLowerCase()
  )
}

function buildEncodedPath(path) {
  if (!path) return ''
  return path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

function getImageUrl(file) {
  if (!file?.path) return null
  return `http://192.168.0.162:9102/arquivos/${buildEncodedPath(file.path)}`
}

async function fetchSearch() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get('/api/search', {
      params: {
        query: query.value,
        page: page.value,
        page_size: pageSize.value,
        order: order.value,
        ext: selectedExt.value,
      },
    })

    const data = response.data ?? {}

    files.value = (data.results || []).map(normalizeFile)
    meta.value = {
      ...meta.value,
      ...(data.meta || {}),
    }

    error.value = data.error || ''

    if (files.value.length > 0) {
      const stillExists = files.value.some((file) => file.id === selectedId.value)
      if (!stillExists) selectedId.value = files.value[0].id
    } else {
      selectedId.value = null
      showDetailsModal.value = false
    }
  } catch (err) {
    error.value = 'Não foi possível carregar os resultados da busca.'
    files.value = []
    selectedId.value = null
    showDetailsModal.value = false
  } finally {
    loading.value = false
  }
}

function submitSearch() {
  page.value = 1
  fetchSearch()
}

function applyQuickFilter(value) {
  selectedExt.value = selectedExt.value === value ? '' : value
  page.value = 1
  fetchSearch()
}

function clearFilters() {
  selectedExt.value = ''
  page.value = 1
  fetchSearch()
}

function openDetails(file) {
  if (!file) return
  selectedId.value = file.id
  showDetailsModal.value = true
}

function closeDetails() {
  showDetailsModal.value = false
}

async function copyPath(file = selectedFile.value) {
  if (!file?.fullPath) return

  try {
    await navigator.clipboard.writeText(file.fullPath)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch (err) {
    console.error('Erro ao copiar caminho:', err)
  }
}

function openPreview(file = selectedFile.value) {
  if (!file?.path) {
    error.value = 'Pré-visualização indisponível para este arquivo.'
    return
  }

  if (!canPreview(file)) {
    downloadFile(file)
    return
  }

  const encodedPath = file.path
    .split('/')
    .map(part => encodeURIComponent(part))
    .join('/')
    const previewUrl = `http://192.168.0.162:9102/preview?path=${encodedPath}`

    window.open(previewUrl, '_blank')
}

function downloadFile(file = selectedFile.value) {
  if (!file?.downloadLink) return

  if (
    file.downloadLink.startsWith('http://') ||
    file.downloadLink.startsWith('https://')
  ) {
    window.open(file.downloadLink, '_blank')
    return
  }

  window.open(`http://192.168.0.162:9102${file.downloadLink}`, '_blank')
}

function changePage(newPage) {
  const totalPages = meta.value.total_pages || 1
  if (newPage < 1 || newPage > totalPages) return
  page.value = newPage
  fetchSearch()
}

onMounted(() => {
  fetchSearch()
})

watch(order, () => {
  page.value = 1
  fetchSearch()
})

watch(query, () => {
  page.value = 1
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchSearch()
  }, 450)
})
</script>

<template>
  <AppLayout title="Arquivos">
    <div class="min-h-full">
      <section class="min-w-0">
        <div class="mb-6 flex flex-col gap-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div class="mb-2 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
                <span>Noxis</span>
                <ChevronRight class="h-4 w-4" />
                <span class="font-medium text-[var(--app-text-soft)]">Arquivos</span>
              </div>

              <h1 class="text-[34px] font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Arquivos
              </h1>

              <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                Encontre arquivos por nome, extensão ou caminho.
              </p>
            </div>
          </div>

          <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]">
            <div class="flex flex-col gap-4">
              <div class="relative">
                <Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--app-text-subtle)]" />
                <input
                  v-model="query"
                  type="text"
                  placeholder="Buscar arquivos por nome, caminho ou extensão..."
                  class="h-13 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] pl-12 pr-28 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-subtle)] focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-hover)]"
                  @keydown.enter="submitSearch"
                />
                <button
                  class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
                  @click="submitSearch"
                >
                  Buscar
                </button>
              </div>

              <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="item in quickFilters"
                    :key="item.label"
                    class="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition"
                    :class="
                      selectedExt === item.value
                        ? 'border-[color:color-mix(in_srgb,var(--app-primary)_22%,transparent)] bg-[var(--app-accent-bg)] text-[var(--app-accent-text)]'
                        : 'border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]'
                    "
                    @click="applyQuickFilter(item.value)"
                  >
                    <component :is="item.icon" class="h-4 w-4" />
                    {{ item.label }}
                  </button>

                  <button
                    class="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2 text-sm text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    @click="clearFilters"
                  >
                    Limpar filtros
                  </button>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <select
                    v-model="order"
                    class="h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 text-sm text-[var(--app-text-soft)] outline-none transition hover:bg-[var(--app-surface-hover)]"
                  >
                    <option value="recent" class="bg-[var(--app-surface-3)] text-[var(--app-text)]">Mais recentes</option>
                    <option value="relevance" class="bg-[var(--app-surface-3)] text-[var(--app-text)]">Relevância</option>
                    <option value="name_asc" class="bg-[var(--app-surface-3)] text-[var(--app-text)]">Nome A-Z</option>
                    <option value="name_desc" class="bg-[var(--app-surface-3)] text-[var(--app-text)]">Nome Z-A</option>
                    <option value="size_desc" class="bg-[var(--app-surface-3)] text-[var(--app-text)]">Maior tamanho</option>
                    <option value="type" class="bg-[var(--app-surface-3)] text-[var(--app-text)]">Tipo</option>
                  </select>

                  <div class="flex items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface-3)] p-1">
                    <button
                      class="inline-flex h-8 w-8 items-center justify-center rounded-full transition"
                      :class="viewMode === 'list' ? 'bg-[var(--app-primary)] text-[var(--app-text)]' : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'"
                      @click="viewMode = 'list'"
                    >
                      <List class="h-4 w-4" />
                    </button>

                    <button
                      class="inline-flex h-8 w-8 items-center justify-center rounded-full transition"
                      :class="viewMode === 'grid' ? 'bg-[var(--app-primary)] text-[var(--app-text)]' : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'"
                      @click="viewMode = 'grid'"
                    >
                      <Grid2X2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm text-[var(--app-text-subtle)]">
            <span>{{ meta.query_ms ?? '--' }} ms</span>
            <span>•</span>
            <span>Ordenação: {{ meta.order }}</span>
            <span>•</span>
            <span>Extensão: {{ selectedExt || 'todas' }}</span>
            <span>•</span>
            <span>{{ files.length }} itens exibidos</span>
          </div>
        </div>

        <div
          v-if="error"
          class="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {{ error }}
        </div>

<div
  v-if="viewMode === 'list'"
  class="overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]"
>
  <div class="hidden grid-cols-[minmax(420px,1.9fr)_90px_110px_140px_minmax(150px,0.8fr)] gap-5 border-b border-[var(--app-border)] bg-[var(--app-surface-2)] px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--app-text-subtle)] xl:grid">
    <div>Arquivo</div>
    <div>Tipo</div>
    <div>Tamanho</div>
    <div>Modificado</div>
    <div class="text-right">Ações</div>
  </div>

  <div v-if="loading" class="divide-y divide-white/6">
    <div
      v-for="n in 6"
      :key="n"
      class="animate-pulse px-5 py-4"
    >
      <div class="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(420px,1.9fr)_90px_110px_140px_minmax(150px,0.8fr)] xl:items-center xl:gap-5">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 shrink-0 rounded-xl bg-[var(--app-surface-4)]"></div>
            <div class="min-w-0 flex-1">
              <div class="h-4 w-56 rounded bg-[var(--app-surface-hover)]"></div>
              <div class="mt-2 h-3 w-72 rounded bg-[var(--app-surface-4)]"></div>
            </div>
          </div>
        </div>
        <div class="hidden xl:block">
          <div class="h-6 w-14 rounded-md bg-[var(--app-accent-bg)]"></div>
        </div>
        <div class="hidden xl:block">
          <div class="h-3 w-16 rounded bg-[var(--app-surface-4)]"></div>
        </div>
        <div class="hidden xl:block">
          <div class="h-3 w-24 rounded bg-[var(--app-surface-4)]"></div>
        </div>
        <div class="flex gap-2 xl:justify-end">
          <div class="h-9 w-9 rounded-lg bg-[var(--app-surface-hover)]"></div>
          <div class="h-9 w-9 rounded-lg bg-[var(--app-surface-4)]"></div>
          <div class="h-9 w-9 rounded-lg bg-[var(--app-surface-4)]"></div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="files.length === 0" class="px-5 py-12 text-sm text-[var(--app-text-muted)]">
    Nenhum arquivo encontrado.
  </div>

  <template v-else>
    <article
      v-for="file in files"
      :key="file.id"
      class="cursor-pointer border-b border-[var(--app-border)] px-5 py-4 transition last:border-b-0 hover:bg-[var(--app-surface-2)]"
      @click="openDetails(file)"
    >
      <div class="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(420px,1.9fr)_90px_110px_140px_minmax(150px,0.8fr)] xl:items-center xl:gap-5">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface-4)] text-[var(--app-text-muted)]">
              <File class="h-4 w-4" />
            </div>

            <div class="min-w-0 flex-1">
              <h3
                class="truncate text-[15px] font-medium leading-5 text-[var(--app-text)]"
                :title="file.name"
                v-html="highlightText(file.name, query)"
              ></h3>

              <p
                class="mt-1 truncate text-[13px] leading-5 text-[var(--app-text-subtle)]"
                :title="file.path"
                v-html="highlightText(file.path, query)"
              ></p>
            </div>
          </div>
        </div>

        <div class="hidden xl:block">
          <span class="inline-flex rounded-md border border-[color:color-mix(in_srgb,var(--app-primary)_22%,transparent)] bg-[var(--app-accent-bg)] px-2 py-1 text-xs font-medium text-[var(--app-accent-text)]">
            {{ formatTypeLabel(file.type) }}
          </span>
        </div>

        <div class="hidden text-sm text-[var(--app-text-muted)] xl:block">
          {{ file.size }}
        </div>

        <div class="hidden text-sm leading-5 text-[var(--app-text-muted)] xl:block">
          {{ file.updated }}
        </div>

        <div class="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
          <button
            v-if="canPreview(file)"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--app-primary)] text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
            title="Preview"
            @click.stop="openPreview(file)"
          >
            <Eye class="h-4 w-4" />
          </button>

          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
            title="Baixar"
            @click.stop="downloadFile(file)"
          >
            <Download class="h-4 w-4" />
          </button>

          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
            title="Copiar caminho"
            @click.stop="copyPath(file)"
          >
            <Clipboard class="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  </template>
</div>

        <div
          v-else
          class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          <template v-if="loading">
            <div
              v-for="n in 8"
              :key="n"
              class="animate-pulse rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]"
            >
              <div class="mb-4 h-32 rounded-2xl bg-[var(--app-surface-4)]"></div>
              <div class="h-4 w-40 rounded bg-[var(--app-surface-hover)]"></div>
              <div class="mt-2 h-3 w-28 rounded bg-[var(--app-surface-4)]"></div>
              <div class="mt-4 flex items-center justify-between">
                <div class="h-3 w-16 rounded bg-[var(--app-surface-4)]"></div>
                <div class="h-5 w-14 rounded bg-[var(--app-accent-bg)]"></div>
              </div>
              <div class="mt-4 h-10 rounded-xl bg-[var(--app-surface-hover)]"></div>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <div class="h-10 rounded-xl bg-[var(--app-surface-4)]"></div>
                <div class="h-10 rounded-xl bg-[var(--app-surface-4)]"></div>
              </div>
            </div>
          </template>

          <template v-else-if="files.length === 0">
            <div class="col-span-full rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-12 text-sm text-[var(--app-text-muted)] shadow-[var(--app-shadow)]">
              Nenhum arquivo encontrado.
            </div>
          </template>

          <template v-else>
            <article
              v-for="file in files"
              :key="file.id"
              class="cursor-pointer rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)] transition hover:-translate-y-[1px] hover:bg-[var(--app-surface-2)] hover:shadow-[var(--app-shadow-strong)]"
              @click="openDetails(file)"
            >
              <div class="mb-4 flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-[var(--app-surface-3)]">
                <img
                  v-if="isImage(file)"
                  :src="getImageUrl(file)"
                  class="h-full w-full object-contain"
                  loading="lazy"
                />
                <FileText
                  v-else
                  class="h-8 w-8 text-[var(--app-text-subtle)]"
                />
              </div>

              <div class="min-w-0">
                <h3
                  class="truncate text-[15px] font-medium text-[var(--app-text)]"
                  :title="file.name"
                  v-html="highlightText(file.name, query)"
                ></h3>

                <p
                  class="mt-1 truncate text-sm text-[var(--app-text-subtle)]"
                  :title="file.path"
                  v-html="highlightText(shortenPath(file.path, 52), query)"
                ></p>
              </div>

              <div class="mt-4 flex items-center justify-between text-sm text-[var(--app-text-subtle)]">
                <span>{{ file.size }}</span>
                <span class="font-medium text-[var(--app-accent-text)]">{{ formatTypeLabel(file.type) }}</span>
              </div>

              <div class="mt-4 grid gap-2">
                <button
                  v-if="canPreview(file)"
                  class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
                  @click.stop="openPreview(file)"
                >
                  <Eye class="h-4 w-4" />
                  Preview
                </button>

                <button
                  v-else
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-2.5 text-sm font-medium text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                  @click.stop="downloadFile(file)"
                >
                  <Download class="h-4 w-4" />
                  Baixar
                </button>

                <div class="grid grid-cols-2 gap-2">
                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    @click.stop="downloadFile(file)"
                  >
                    <Download class="h-4 w-4" />
                    Baixar
                  </button>

                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    @click.stop="copyPath(file)"
                  >
                    <Clipboard class="h-4 w-4" />
                    Copiar
                  </button>
                </div>
              </div>
            </article>
          </template>
        </div>

        <div
          v-if="(meta.total_pages || 0) > 1"
          class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.18)]"
        >
          <div class="text-sm text-[var(--app-text-muted)]">
            Página {{ meta.page || 1 }} de {{ meta.total_pages || 1 }}
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-2 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="(meta.page || 1) <= 1"
              @click="changePage((meta.page || 1) - 1)"
            >
              Anterior
            </button>

            <button
              v-for="p in meta.pages_to_show"
              :key="p"
              @click="changePage(p)"
              class="rounded-lg px-3 py-2 text-sm transition"
              :class="
                p === meta.page
                  ? 'bg-[var(--app-primary)] text-[var(--app-text)]'
                  : 'border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]'
              "
            >
              {{ p }}
            </button>

            <button
              class="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-2 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="(meta.page || 1) >= (meta.total_pages || 1)"
              @click="changePage((meta.page || 1) + 1)"
            >
              Próxima
            </button>
          </div>
        </div>
      </section>

      <teleport to="body">
        <div
          v-if="showDetailsModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--app-overlay)] p-4 backdrop-blur-sm"
          @click.self="closeDetails"
        >
          <div class="w-full max-w-2xl overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-strong)]">
            <template v-if="selectedFile">
              <div class="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
                <div>
                  <h2 class="text-lg font-semibold text-[var(--app-text)]">Detalhes do arquivo</h2>
                  <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                    Informações completas e ações rápidas.
                  </p>
                </div>

                <button
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                  @click="closeDetails"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>

              <div class="grid gap-6 p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div>
                  <div class="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-[var(--app-surface-3)]">
                    <img
                      v-if="isImage(selectedFile)"
                      :src="getImageUrl(selectedFile)"
                      class="h-full w-full object-contain"
                      loading="lazy"
                    />
                    <FileText
                      v-else
                      class="h-12 w-12 text-[var(--app-text-subtle)]"
                    />
                  </div>
                </div>

                <div class="min-w-0">
                  <h3
                    class="break-words text-2xl font-semibold tracking-[-0.02em] text-[var(--app-text)]"
                    v-html="highlightText(selectedFile.name, query)"
                  ></h3>
                      <div class="mt-4">
                        <p class="text-xs font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]">
                          Localização
                        </p>

                        <div class="mt-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] p-3">
                          <p class="break-words text-sm text-[var(--app-text-muted)]">
                            {{ selectedFile.path }}
                          </p>
                        </div>
                      </div>
                  <div class="mt-6 grid gap-4">
                    <div class="flex items-start gap-3">
                      <FolderTree class="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-subtle)]" />
                      <div class="min-w-0">
                        <div class="text-sm font-medium text-[var(--app-text-strong)]">Caminho</div>
                        <p
                          class="mt-1 break-words text-sm leading-5 text-[var(--app-text-muted)]"
                          v-html="highlightText(selectedFile.fullPath, query)"
                        ></p>
                      </div>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                      <div class="flex items-start gap-3">
                        <Calendar class="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-subtle)]" />
                        <div>
                          <div class="text-sm font-medium text-[var(--app-text-strong)]">Última modificação</div>
                          <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                            {{ selectedFile.updated }}
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-3">
                        <HardDrive class="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-subtle)]" />
                        <div>
                          <div class="text-sm font-medium text-[var(--app-text-strong)]">Tamanho</div>
                          <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                            {{ selectedFile.size }}
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-3">
                        <File class="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-subtle)]" />
                        <div>
                          <div class="text-sm font-medium text-[var(--app-text-strong)]">Tipo</div>
                          <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                            {{ formatTypeLabel(selectedFile.type) }}
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-3">
                        <Info class="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-subtle)]" />
                        <div>
                          <div class="text-sm font-medium text-[var(--app-text-strong)]">Área</div>
                          <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                            {{ selectedFile.area }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                    <div class="mt-6 grid gap-2 sm:grid-cols-3">
                      <button
                        v-if="canPreview(selectedFile)"
                        class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-3 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
                        @click="openPreview(selectedFile)"
                      >
                        <Eye class="h-4 w-4" />
                        Abrir preview
                      </button>

                      <button
                        class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                        @click="downloadFile(selectedFile)"
                      >
                        <Download class="h-4 w-4" />
                        Baixar
                      </button>

                      <button
                        class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-4 py-3 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                        @click="copyPath(selectedFile)"
                      >
                        <component :is="copied ? Check : Clipboard" class="h-4 w-4" />
                        {{ copied ? 'Copiado' : 'Copiar caminho' }}
                      </button>
                    </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </teleport>
    </div>
  </AppLayout>
</template>