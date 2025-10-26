import fs from 'fs'
import path from 'path'

function die(msg: string): never {
  console.error(`[perf-gate] FAIL: ${msg}`)
  process.exit(1)
}

function readJson(p: string): any {
  const full = path.resolve(p)
  if (!fs.existsSync(full)) die(`Report not found: ${full}`)
  try {
    const raw = fs.readFileSync(full, 'utf-8')
    return JSON.parse(raw)
  } catch (e: any) {
    die(`Could not parse JSON report: ${e?.message || 'unknown error'}`)
  }
}

function extractLatency(report: any): { p95?: number; p99?: number } {
  // Try common Artillery JSON shapes
  const agg = report?.aggregate || report?.aggregates || report
  const summaries = agg?.summaries || agg?.latency || agg?.metrics || {}
  let lat: any = summaries['http.response_time'] || summaries['latency']
  if (!lat) {
    // Sometimes summaries is an object of objects; scan for one with p95/p99
    for (const v of Object.values(summaries)) {
      if (v && typeof v === 'object' && ('p95' in v || 'p99' in v)) {
        lat = v
        break
      }
    }
  }
  if (!lat) {
    // Fallback: drill into possible nested shape
    const candidate = agg?.summariesByStatusCode?.['2xx'] || agg?.summariesByScenario || undefined
    if (candidate) {
      const values = Object.values(candidate) as any[]
      for (const v of values) {
        const maybe = v?.['http.response_time'] || v
        if (maybe && (maybe.p95 || maybe.p99)) {
          lat = maybe
          break
        }
      }
    }
  }
  return { p95: lat?.p95, p99: lat?.p99 }
}

function extractExpectFails(report: any): number {
  const agg = report?.aggregate || report
  const counters = agg?.counters || {}
  return Number(counters['plugins.expect.failed'] || 0)
}

function main() {
  const reportPath = process.env.ARTILLERY_REPORT_PATH || 'artillery-report.json'
  const maxP95 = Number(process.env.P95_MAX_MS || 300)
  const maxP99 = Number(process.env.P99_MAX_MS || 600)
  const allowExpectFails = process.env.ALLOW_EXPECT_FAILS === '1'

  const report = readJson(reportPath)
  const { p95, p99 } = extractLatency(report)
  const failed = extractExpectFails(report)

  console.log(`[perf-gate] thresholds: p95<=${maxP95}ms, p99<=${maxP99}ms, allowExpectFails=${allowExpectFails}`)
  if (typeof p95 === 'number') console.log(`[perf-gate] observed p95=${p95}ms`)
  if (typeof p99 === 'number') console.log(`[perf-gate] observed p99=${p99}ms`)
  if (!allowExpectFails) console.log(`[perf-gate] expect.failures=${failed}`)

  let violations = 0
  if (typeof p95 === 'number' && p95 > maxP95) {
    console.error(`[perf-gate] p95 ${p95}ms > ${maxP95}ms`)
    violations++
  }
  if (typeof p99 === 'number' && p99 > maxP99) {
    console.error(`[perf-gate] p99 ${p99}ms > ${maxP99}ms`)
    violations++
  }
  if (!allowExpectFails && failed > 0) {
    console.error(`[perf-gate] ${failed} expect failure(s) reported`)
    violations++
  }

  if (violations > 0) die(`${violations} violation(s) found`)
  console.log('[perf-gate] PASS: thresholds satisfied')
}

main()
