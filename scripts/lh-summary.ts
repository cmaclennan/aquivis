import * as fs from 'fs'
import * as path from 'path'

function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function ms(n: number | undefined) {
  return n != null ? `${Math.round(n)} ms` : 'n/a'
}

function unitless(n: number | undefined) {
  return n != null ? `${n}` : 'n/a'
}

function summarize(file: string) {
  const data = readJson(file)
  const url = data?.finalUrl || data?.requestedUrl || path.basename(file)
  const perf = data?.categories?.performance?.score
  const audits = data?.audits || {}

  const fcp = audits['first-contentful-paint']?.numericValue as number | undefined
  const lcp = audits['largest-contentful-paint']?.numericValue as number | undefined
  const tbt = audits['total-blocking-time']?.numericValue as number | undefined
  const cls = audits['cumulative-layout-shift']?.numericValue as number | undefined
  const si = audits['speed-index']?.numericValue as number | undefined

  console.log(`\n[lh-summary] ${url}`)
  console.log(`  Performance: ${perf != null ? Math.round(perf * 100) : 'n/a'}`)
  console.log(`  FCP: ${ms(fcp)}  LCP: ${ms(lcp)}  TBT: ${ms(tbt)}  CLS: ${unitless(cls)}  SI: ${ms(si)}`)

  return {
    url,
    perfScore: perf != null ? Math.round(perf * 100) : null,
    lcpMs: lcp != null ? Math.round(lcp) : null,
    tbtMs: tbt != null ? Math.round(tbt) : null,
    cls: cls != null ? cls : null,
  }
}

function main() {
  const reportsDir = path.resolve('reports')
  if (!fs.existsSync(reportsDir)) {
    console.error('[lh-summary] reports/ not found. Run: npm run perf:lh:cli')
    process.exit(1)
  }
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.endsWith('.report.json'))
    .map(f => path.join(reportsDir, f))
    .sort()
  if (files.length === 0) {
    console.warn('[lh-summary] No report JSON files found in reports/.')
    return
  }
  console.log(`[lh-summary] Found ${files.length} report(s).`)

  const minPerf = Number(process.env.LH_MIN_PERF || 85)
  const maxLcp = process.env.LH_MAX_LCP_MS ? Number(process.env.LH_MAX_LCP_MS) : null
  const maxTbt = process.env.LH_MAX_TBT_MS ? Number(process.env.LH_MAX_TBT_MS) : null
  const maxCls = process.env.LH_MAX_CLS ? Number(process.env.LH_MAX_CLS) : null

  let violations = 0
  for (const f of files) {
    const res = summarize(f)
    if (res.perfScore != null && res.perfScore < minPerf) {
      console.error(`[lh-summary] FAIL ${res.url}: perf ${res.perfScore} < ${minPerf}`)
      violations++
    }
    if (maxLcp != null && res.lcpMs != null && res.lcpMs > maxLcp) {
      console.error(`[lh-summary] FAIL ${res.url}: LCP ${res.lcpMs}ms > ${maxLcp}ms`)
      violations++
    }
    if (maxTbt != null && res.tbtMs != null && res.tbtMs > maxTbt) {
      console.error(`[lh-summary] FAIL ${res.url}: TBT ${res.tbtMs}ms > ${maxTbt}ms`)
      violations++
    }
    if (maxCls != null && res.cls != null && res.cls > maxCls) {
      console.error(`[lh-summary] FAIL ${res.url}: CLS ${res.cls} > ${maxCls}`)
      violations++
    }
  }

  if (violations > 0) {
    console.error(`[lh-summary] ${violations} violation(s) found`)
    process.exit(1)
  }
}

main()
