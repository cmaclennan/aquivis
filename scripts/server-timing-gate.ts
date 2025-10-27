import fs from 'fs'
import path from 'path'

function die(msg: string): never {
  console.error(`[server-timing-gate] FAIL: ${msg}`)
  process.exit(1)
}

function readJson(p: string): any {
  const full = path.resolve(p)
  if (!fs.existsSync(full)) die(`Summary not found: ${full}`)
  try {
    const raw = fs.readFileSync(full, 'utf-8')
    return JSON.parse(raw)
  } catch (e: any) {
    die(`Could not parse JSON: ${e?.message || 'unknown error'}`)
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

// Default budgets (baseline averages)
const defaultBudgets: Record<string, { total?: number; db?: number }> = {
  '/api/templates': { total: 120, db: 10 },
  '/api/reports/lookups': { total: 120, db: 10 },
  '/api/units': { total: 230, db: 140 },
  '/api/reports/services': { total: 230, db: 130 },
  '/api/reports/chemicals/summary': { total: 210, db: 120 },
  '/api/reports/equipment/logs': { total: 210, db: 120 },
}

function main() {
  const summaryPath = process.env.SERVER_TIMING_SUMMARY || 'reports/server-timing-summary.json'
  const allowUnknown = process.env.SERVER_TIMING_ALLOW_UNKNOWN === '1'
  const summary = readJson(summaryPath)
  let violations = 0

  for (const [url, row] of Object.entries<any>(summary || {})) {
    const p = pathOf(url)
    const budgets = defaultBudgets[p]
    if (!budgets) {
      if (!allowUnknown) {
        console.log(`[server-timing-gate] No budget for ${p}; ignoring.`)
      }
      continue
    }
    const avg = row?.avg || {}
    if (typeof budgets.total === 'number' && typeof avg.total === 'number') {
      if (avg.total > budgets.total) {
        console.error(`[server-timing-gate] ${p} total ${avg.total.toFixed(1)}ms > ${budgets.total}ms`)
        violations++
      }
    }
    if (typeof budgets.db === 'number' && typeof avg.db === 'number') {
      if (avg.db > budgets.db) {
        console.error(`[server-timing-gate] ${p} db ${avg.db.toFixed(1)}ms > ${budgets.db}ms`)
        violations++
      }
    }
  }

  if (violations > 0) die(`${violations} budget violation(s) found`)
  console.log('[server-timing-gate] PASS: budgets satisfied')
}

main()
