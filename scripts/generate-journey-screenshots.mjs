/**
 * Renders PNG screenshots for each canister journey stage.
 * Run: node scripts/generate-journey-screenshots.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'docs', 'canister-journey-screenshots')

const C = {
  page: '#f0f2f5',
  surface: '#ffffff',
  border: '#e0e4ea',
  fg: '#212121',
  muted: '#6b7280',
  primary: '#2a48ff',
  primarySoft: '#e9eeff',
  green: '#0d7a52',
  greenSoft: '#e6f5ef',
  amber: '#b45309',
  amberSoft: '#fef3c7',
  violet: '#7c3aed',
  violetSoft: '#f3e8ff',
  red: '#c62828',
  redSoft: '#fdecea',
}

const CANISTER = '341X1302R9S18'
const PALLET = '146700499966112311'
const PRODUCT = 'Торнадо 540, ВР (540 г/л)'

const screens = [
  {
    file: '01-web-supply-zn006-approved-consolidation.png',
    title: 'Снабжение: заявка ЗН-006 и сводная',
    width: 1280,
    height: 720,
    html: webLayout({
      module: 'Снабжение',
      heading: 'Заявки на закуп',
      chip: 'OTP 666 · Администратор',
      body: `
        <div class="card">
          <div class="row between">
            <div><div class="label">Заявка</div><div class="h2">ЗН-006 · ТОО 1</div></div>
            <span class="badge badge--blue">Утверждена</span>
          </div>
          <div class="meta-grid">
            <div><span class="label">Склад назначения</span><strong>Главный склад → Дочерний склад №1</strong></div>
            <div><span class="label">Препарат</span><strong>${PRODUCT}</strong></div>
            <div><span class="label">Объём</span><strong>80 л</strong></div>
          </div>
          <div class="hint">Следующий шаг: включить в сводную СВ-001 и отправить ЗП поставщику</div>
        </div>
        <div class="card card--accent">
          <div class="label">Сводная потребность</div>
          <div class="h2">СВ-001 · Август</div>
          <p class="muted">ЗН-006 + ЗН-007 → единая поставка ОП-001</p>
        </div>`,
    }),
  },
  {
    file: '02-web-upak-import-expected-receipt-op001.png',
    title: 'Упак загружен: ожидаемая приёмка ОП-001',
    width: 1280,
    height: 720,
    html: webLayout({
      module: 'Снабжение',
      heading: 'Заявки поставщику',
      chip: 'ЗП-001 отправлена',
      body: `
        <div class="card">
          <div class="row between">
            <div><div class="label">Ожидаемая приёмка</div><div class="h2">ОП-001</div></div>
            <span class="badge badge--amber">Готово к приёмке на ГС</span>
          </div>
          <div class="meta-grid">
            <div><span class="label">Палет</span><strong>22</strong></div>
            <div><span class="label">Канистр</span><strong>1 320</strong></div>
            <div><span class="label">Демо-канистра</span><strong class="mono">${CANISTER}</strong></div>
          </div>
          <div class="status-pill status-pill--wait">Статус канистры: expected_receipt</div>
        </div>
        <div class="card">
          <div class="label">Автоматически создано</div>
          <p>Складская задача <strong>Приёмка · Главный склад</strong> на ТСД (OTP 111)</p>
        </div>`,
    }),
  },
  {
    file: '03-tsd-op-receipt-scan-pallet-main-warehouse.png',
    title: 'ТСД: приёмка ОП на главный склад',
    width: 390,
    height: 844,
    html: tsdLayout({
      type: 'Приём ОП',
      title: 'ОП-001',
      meta: `${PRODUCT} · Поставщик «Август»`,
      route: 'Размещение: Главный склад',
      progress: '18 / 22',
      progressLabel: 'Отсканировано палет',
      scanLabel: 'Сканировать палету',
      primaryBtn: 'Принять',
      secondaryBtn: 'Сканировать всё (4)',
      scanned: [PALLET],
      status: 'expected_receipt → in_storage_main',
      statusColor: 'green',
    }),
  },
  {
    file: '04-canister-on-main-warehouse-storage.png',
    title: 'Канистра на главном складе после ОП',
    width: 1280,
    height: 720,
    html: webLayout({
      module: 'Склады',
      heading: 'Остатки · Главный склад',
      chip: 'Ячейка A-01-03',
      body: `
        <div class="card card--green">
          <div class="row between">
            <div>
              <div class="label">Демо-канистра</div>
              <div class="h2 mono">${CANISTER}</div>
            </div>
            <span class="badge badge--green">На хранении ГС</span>
          </div>
          <div class="meta-grid">
            <div><span class="label">Статус</span><strong>in_storage_main</strong></div>
            <div><span class="label">Палета</span><strong class="mono">${PALLET}</strong></div>
            <div><span class="label">Заявка</span><strong>ЗН-006 → partially_fulfilled</strong></div>
          </div>
          <div class="hint">ОП принят только на ГС. На ДС №1 канистра ещё не прибыла.</div>
        </div>`,
    }),
  },
  {
    file: '05-web-create-transfer-main-to-child-ds1.png',
    title: 'Веб: создание перемещения ГС → ДС №1',
    width: 1280,
    height: 720,
    html: webLayout({
      module: 'Снабжение',
      heading: 'Заявка ЗН-006',
      chip: 'Частично закрыта',
      body: `
        <div class="card">
          <div class="meta-grid">
            <div><span class="label">Маршрут</span><strong>Главный склад → Дочерний склад №1</strong></div>
            <div><span class="label">Канистра</span><strong class="mono">${CANISTER}</strong></div>
          </div>
          <button class="btn-primary full">Перемещение ГС → Дочерний склад №1</button>
          <p class="muted small">Отдельная операция после приёмки ОП. Создаёт пару задач: отгрузка (ГС) + приёмка (ДС).</p>
        </div>`,
    }),
  },
  {
    file: '06-tsd-transfer-shipment-from-main-warehouse.png',
    title: 'ТСД: отгрузка с главного склада',
    width: 390,
    height: 844,
    html: tsdLayout({
      type: 'Перемещение',
      title: '№12',
      meta: 'Спрос: заявка ЗН-006',
      route: 'Главный склад → Дочерний склад №1',
      progress: '8 / 8',
      progressLabel: 'Отсканировано',
      scanLabel: 'Сканировать',
      primaryBtn: 'Завершить отгрузку',
      scanned: [CANISTER, '… +7 кан.'],
      status: 'in_storage_main → in_transit_child',
      statusColor: 'violet',
    }),
  },
  {
    file: '07-tsd-transfer-receipt-child-warehouse-ds1.png',
    title: 'ТСД: приёмка на дочернем складе №1',
    width: 390,
    height: 844,
    html: tsdLayout({
      type: 'Перемещение',
      title: '№13',
      meta: 'Перемещ. 12 · ДС №1',
      route: 'ГС → Дочерний склад №1',
      progress: '8 / 8',
      progressLabel: 'Отсканировано',
      scanLabel: 'Сканировать',
      primaryBtn: 'Завершить приём',
      scanned: [CANISTER, '… +7 кан.'],
      status: 'in_transit_child → in_storage_child',
      statusColor: 'green',
      actor: 'OTP 222 · Ким В.Р.',
    }),
  },
  {
    file: '08-tsd-issue-canister-to-agronomist.png',
    title: 'ТСД: выдача канистры агроному',
    width: 390,
    height: 844,
    html: tsdLayout({
      type: 'Выдача агроному',
      title: 'Автономная выдача',
      meta: 'Дочерний склад №1',
      route: 'МОЛ: Петров К.Н.',
      progress: '1 / 1',
      progressLabel: 'Отсканировано',
      scanLabel: 'Сканировать канистру',
      primaryBtn: 'Завершить выдачу',
      scanned: [CANISTER],
      status: 'in_storage_child → issued_agronomist',
      statusColor: 'amber',
      actor: 'OTP 333 · Агроном',
    }),
  },
  {
    file: '09-tsd-return-empty-canister-from-field.png',
    title: 'ТСД: возврат пустой тары с поля',
    width: 390,
    height: 844,
    html: tsdLayout({
      type: 'Возврат с поля',
      title: 'По акту выдачи',
      meta: 'Состояние: Пустая',
      route: 'Петров К.Н. → ДС №1',
      progress: '1 / 1',
      progressLabel: 'Отсканировано',
      scanLabel: 'Сканировать',
      primaryBtn: 'Оформить возврат',
      scanned: [CANISTER],
      status: 'issued_agronomist → returned_empty',
      statusColor: 'amber',
      actor: 'OTP 333 · Агроном',
      extra: '<div class="photo-box">Фото тары (если не пустая)</div>',
    }),
  },
  {
    file: '10-tsd-return-approval-by-warehouse-manager.png',
    title: 'ТСД: одобрение возврата завскладом',
    width: 390,
    height: 844,
    html: tsdLayout({
      type: 'Возврат',
      title: 'Одобрение',
      meta: 'АВозвр-000142',
      route: 'Ожидает подтверждения ДС',
      progress: '1 / 1',
      progressLabel: 'К проверке',
      scanLabel: '—',
      primaryBtn: 'Одобрить возврат',
      secondaryBtn: 'Отклонить',
      scanned: [CANISTER],
      status: 'returned_empty · принято на ДС',
      statusColor: 'green',
      actor: 'OTP 222 · Завсклад ДС №1',
    }),
  },
  {
    file: '11-tsd-disposal-handoff-empty-container.png',
    title: 'ТСД: передача пустой тары на утиль',
    width: 390,
    height: 844,
    html: tsdLayout({
      type: 'Утиль',
      title: 'Передача на утиль',
      meta: 'Пустая канистра',
      route: 'ДС №1 → зона утиля',
      progress: '1 / 1',
      progressLabel: 'Отсканировано',
      scanLabel: 'Сканировать',
      primaryBtn: 'Передать на утиль',
      scanned: [CANISTER],
      status: 'returned_empty → for_disposal_child',
      statusColor: 'red',
    }),
  },
  {
    file: '12-canister-disposed-lifecycle-complete.png',
    title: 'Канистра утилизирована — цикл завершён',
    width: 1280,
    height: 720,
    html: webLayout({
      module: 'Отчёты',
      heading: 'История канистры',
      chip: `SN ${CANISTER}`,
      body: `
        <div class="card">
          <div class="pipeline">
            ${['ОП', 'ГС', 'Перем.', 'ДС', 'Выдача', 'Возврат', 'Утиль'].map((s, i, a) => `
              <div class="pipe-step ${i < a.length - 1 ? 'done' : 'done'}"><span>${s}</span></div>
            `).join('')}
          </div>
          <div class="h2" style="margin-top:20px">Жизненный цикл завершён</div>
          <div class="meta-grid">
            <div><span class="label">Финальный статус</span><strong class="red">disposed</strong></div>
            <div><span class="label">Документы</span><strong>ОП-001, АПП-ОП-001, АПП-T-12, АВ, АВозвр, акт утилизации</strong></div>
          </div>
        </div>`,
    }),
  },
]

function baseCss() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: ${C.page}; color: ${C.fg}; -webkit-font-smoothing: antialiased; }
    .mono { font-family: Consolas, 'Courier New', monospace; font-size: 13px; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: ${C.muted}; }
    .muted { color: ${C.muted}; font-size: 14px; }
    .small { font-size: 12px; }
    .h2 { font-size: 22px; font-weight: 700; margin: 4px 0 8px; }
    .row { display: flex; align-items: center; gap: 12px; }
    .between { justify-content: space-between; }
    .badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
    .badge--blue { background: ${C.primarySoft}; color: ${C.primary}; }
    .badge--green { background: ${C.greenSoft}; color: ${C.green}; }
    .badge--amber { background: ${C.amberSoft}; color: ${C.amber}; }
    .card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
    .card--accent { border-color: ${C.primary}; background: linear-gradient(180deg,#fff,#f8faff); }
    .card--green { border-color: ${C.green}; background: ${C.greenSoft}; }
    .meta-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin: 16px 0; font-size: 14px; }
    .hint { font-size: 13px; color: ${C.muted}; margin-top: 12px; padding: 10px 12px; background: #f8fafc; border-radius: 10px; }
    .btn-primary { background: ${C.primary}; color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 600; margin-top: 12px; }
    .full { width: 100%; }
    .status-pill { display: inline-block; margin-top: 12px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .status-pill--wait { background: ${C.amberSoft}; color: ${C.amber}; }
    .pipeline { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .pipe-step { width: 72px; height: 72px; border-radius: 50%; background: ${C.primary}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; text-align: center; position: relative; }
    .pipe-step:not(:last-child)::after { content: ''; position: absolute; right: -10px; top: 50%; width: 10px; height: 2px; background: ${C.primary}; }
    .red { color: ${C.red}; }
  `
}

function webLayout({ module, heading, chip, body }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCss()}
    .shell { display: flex; height: 100vh; }
    .sidebar { width: 248px; background: #fff; border-right: 1px solid ${C.border}; padding: 20px 16px; }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    .logo-mark { width: 36px; height: 36px; border-radius: 10px; background: ${C.primary}; color: #fff; display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px; }
    .logo-text { font-weight: 700; font-size: 15px; line-height: 1.2; }
    .nav-item { padding: 10px 12px; border-radius: 10px; font-size: 14px; margin-bottom: 4px; color: ${C.muted}; }
    .nav-item.active { background: ${C.primarySoft}; color: ${C.primary}; font-weight: 600; }
    .main { flex: 1; padding: 24px 28px; overflow: hidden; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; }
    .chip { font-size: 12px; padding: 6px 12px; background: #fff; border: 1px solid ${C.border}; border-radius: 999px; color: ${C.muted}; }
  </style></head><body><div class="shell">
    <aside class="sidebar">
      <div class="logo"><div class="logo-mark">AA</div><div class="logo-text">Атамекен-<br>Агро</div></div>
      <div class="nav-item">Главная</div>
      <div class="nav-item ${module === 'Снабжение' ? 'active' : ''}">Снабжение</div>
      <div class="nav-item ${module === 'Склады' ? 'active' : ''}">Склады</div>
      <div class="nav-item ${module === 'Отчёты' ? 'active' : ''}">Отчёты</div>
    </aside>
    <main class="main">
      <div class="top"><div><div class="label">Веб-кабинет · ${module}</div><h1 style="font-size:28px;font-weight:700">${heading}</h1></div><span class="chip">${chip}</span></div>
      ${body}
    </main>
  </div></body></html>`
}

function tsdLayout(opts) {
  const statusBg = opts.statusColor === 'green' ? C.greenSoft : opts.statusColor === 'violet' ? C.violetSoft : opts.statusColor === 'red' ? C.redSoft : C.amberSoft
  const statusFg = opts.statusColor === 'green' ? C.green : opts.statusColor === 'violet' ? C.violet : opts.statusColor === 'red' ? C.red : C.amber
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${baseCss()}
    body { background: #eceff1; display:flex; align-items:center; justify-content:center; min-height:100vh; padding: 16px; }
    .phone { width: 100%; max-width: 358px; background: ${C.page}; border-radius: 28px; border: 8px solid #1a1a1a; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,.15); }
    .tsd-top { background: #fff; padding: 14px 16px; border-bottom: 1px solid ${C.border}; font-size: 13px; font-weight: 600; }
    .tsd-body { padding: 16px; }
    .type { font-size: 12px; color: ${C.muted}; text-transform: uppercase; letter-spacing: .05em; }
    .title { font-size: 22px; font-weight: 700; margin: 4px 0; }
    .route { font-size: 13px; color: ${C.primary}; font-weight: 600; margin: 8px 0 16px; }
    .progress-box { background: #fff; border: 1px solid ${C.border}; border-radius: 14px; padding: 14px; margin-bottom: 14px; }
    .progress-val { font-size: 24px; font-weight: 700; }
    .scan { border: 2px dashed ${C.border}; border-radius: 14px; padding: 20px; text-align: center; background: #fafbfc; margin-bottom: 12px; }
    .scan strong { display: block; font-size: 15px; margin-bottom: 4px; }
    .list { list-style: none; margin: 12px 0; }
    .list li { background: ${C.greenSoft}; border: 1px solid ${C.green}; color: ${C.green}; padding: 10px 12px; border-radius: 10px; font-family: monospace; font-size: 13px; margin-bottom: 6px; }
    .actions { display: grid; gap: 8px; padding: 12px 16px 20px; background: #fff; border-top: 1px solid ${C.border}; }
    .btn-sec { background: #fff; border: 1px solid ${C.border}; color: ${C.fg}; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 600; }
    .status { margin-top: 12px; padding: 8px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; background: ${statusBg}; color: ${statusFg}; }
    .photo-box { margin-top: 10px; padding: 24px; border: 1px dashed ${C.border}; border-radius: 12px; text-align: center; color: ${C.muted}; font-size: 13px; }
    .actor { font-size: 12px; color: ${C.muted}; margin-bottom: 8px; }
  </style></head><body><div class="phone">
    <div class="tsd-top">ТСД · ${opts.actor || 'OTP 111 · Иванов А.С.'}</div>
    <div class="tsd-body">
      <div class="type">${opts.type}</div>
      <div class="title">${opts.title}</div>
      <div class="muted">${opts.meta}</div>
      <div class="route">${opts.route}</div>
      <div class="progress-box"><div class="label">${opts.progressLabel}</div><div class="progress-val">${opts.progress}</div></div>
      <div class="scan"><strong>${opts.scanLabel}</strong><span class="muted">Эмуляция сканера</span></div>
      <ul class="list">${opts.scanned.map((s) => `<li>${s}</li>`).join('')}</ul>
      ${opts.extra || ''}
      <div class="status">${opts.status}</div>
    </div>
    <div class="actions">
      <button class="btn-primary full">${opts.primaryBtn}</button>
      ${opts.secondaryBtn ? `<button class="btn-sec">${opts.secondaryBtn}</button>` : ''}
    </div>
  </div></body></html>`
}

async function main() {
  await mkdir(OUT, { recursive: true })
  await mkdir(join(OUT, 'html'), { recursive: true })

  let puppeteer
  try {
    puppeteer = await import('puppeteer')
  } catch {
    console.log('Installing puppeteer...')
    const { execSync } = await import('node:child_process')
    execSync('npm install --no-save puppeteer@24', { cwd: ROOT, stdio: 'inherit' })
    puppeteer = await import('puppeteer')
  }

  const browser = await puppeteer.default.launch({ headless: true })
  const indexLines = [
    '# Скриншоты пути канистры для Notebook LLM',
    '',
    `Демо-канистра: **${CANISTER}** · Палета: **${PALLET}**`,
    '',
    'Загрузите эту папку вместе с `notebook-llm-bundle.zip` при генерации презентации.',
    '',
    '| № | Файл | Этап | Система | Статус канистры |',
    '|---|------|------|---------|-----------------|',
  ]

  for (let i = 0; i < screens.length; i++) {
    const s = screens[i]
    const htmlPath = join(OUT, 'html', s.file.replace('.png', '.html'))
    await writeFile(htmlPath, s.html, 'utf8')

    const page = await browser.newPage()
    await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: 2 })
    await page.setContent(s.html, { waitUntil: 'networkidle0' })
    const outPath = join(OUT, s.file)
    await page.screenshot({ path: outPath, type: 'png' })
    await page.close()

    const statusMatch = s.html.match(/status[^>]*>([^<]+)</i) || s.html.match(/status-pill[^>]*>([^<]+)</i)
    const status = statusMatch ? statusMatch[1].replace('Статус канистры: ', '').trim() : '—'
    const system = s.width > 500 ? 'Веб' : 'ТСД'
    indexLines.push(`| ${i + 1} | \`${s.file}\` | ${s.title} | ${system} | ${status} |`)
    console.log(`✓ ${s.file}`)
  }

  await browser.close()

  indexLines.push('', '## Порядок в презентации', '', 'Используй файлы **строго по номеру** 01 → 12 как визуальный ряд сценария.')
  await writeFile(join(OUT, 'README.md'), indexLines.join('\n'), 'utf8')
  console.log(`\nDone: ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
