import fs from 'fs'
import path from 'path'

function readJson(p: string): any | null {
  const full = path.resolve(p)
  if (!fs.existsSync(full)) return null
  try {
    return JSON.parse(fs.readFileSync(full, 'utf-8'))
  } catch {
    return null
  }
}

function pathOf(urlOrPath: string): string {
  try {
    const u = new URL(urlOrPath)
    return u.pathname
  } catch {
    return urlOrPath
  }
}

function main() {
  const basePath = process.env.BASE_SUMMARY || 'baseline-artifacts/reports/server-timing-summary.json'
  const cmpPath = process.env.COMPARE_SUMMARY || 'reports/server-timing-summary.json'
  const base = readJson(basePath)
  const cmp = readJson(cmpPath)
  if (!base || !cmp) {
    console.log(`[server-timing-diff] Missing inputs (base=${!!base}, cmp=${!!cmp})`)
    return
  }

  type Row = { total?: number; db?: number }
  const baseMap = new Map<string, Row>()
  const cmpMap = new Map<string, Row>()

  for (const [url, row] of Object.entries<any>(base)) {
    baseMap.set(pathOf(url), row.avg || {})
  }
  for (const [url, row] of Object.entries<any>(cmp)) {
    cmpMap.set(pathOf(url), row.avg || {})
  }

  type Diff = { path: string; totalDelta: number; dbDelta: number; base?: Row; cmp?: Row }
  const diffs: Diff[] = []
  const allKeys = new Set<string>([...baseMap.keys(), ...cmpMap.keys()])
  for (const k of allKeys) {
    const b = baseMap.get(k) || {}
    const c = cmpMap.get(k) || {}
    const totalDelta = (c.total ?? 0) - (b.total ?? 0)
    const dbDelta = (c.db ?? 0) - (b.db ?? 0)
    diffs.push({ path: k, totalDelta, dbDelta, base: b, cmp: c })
  }

  const topRegressions = [...diffs]
    .filter((d) => isFinite(d.totalDelta))
    .sort((a, b) => b.totalDelta - a.totalDelta)
    .slice(0, 10)
  const topImprovements = [...diffs]
    .filter((d) => isFinite(d.totalDelta))
    .sort((a, b) => a.totalDelta - b.totalDelta)
    .slice(0, 10)

  const fmt = (n?: number) => (typeof n === 'number' ? `${n.toFixed(1)}ms` : '-')

  console.log('[server-timing-diff] Top regressions (total):')
  for (const d of topRegressions) {
    console.log(`  ${d.path}: +${fmt(d.totalDelta)} (base ${fmt(d.base?.total)} -> curr ${fmt(d.cmp?.total)}) | db +${fmt(d.dbDelta)}`)
  }
  console.log('[server-timing-diff] Top improvements (total):')
  for (const d of topImprovements) {
    console.log(`  ${d.path}: ${fmt(d.totalDelta)} (base ${fmt(d.base?.total)} -> curr ${fmt(d.cmp?.total)}) | db ${fmt(d.dbDelta)}`)
  }
}

main()
