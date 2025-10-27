import * as fs from 'fs'

async function main() {
  const base = 'http://localhost:3000'
  const headersPath = 'lhci-headers.json'
  if (!fs.existsSync(headersPath)) {
    console.error('[perf-probe] Missing lhci-headers.json. Run: npm run perf:prep')
    process.exit(1)
  }
  const hdrs: Record<string, string> = JSON.parse(fs.readFileSync(headersPath, 'utf-8'))

  async function req(method: 'GET'|'POST', url: string, body?: any) {
    const full = `${base}${url}`
    const res = await fetch(full, {
      method,
      headers: {
        ...hdrs,
        'content-type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let json: any = null
    try { json = JSON.parse(text) } catch {}
    console.log(`[perf-probe] ${method} ${url} -> ${res.status}`)
    if (!res.ok) {
      console.log(`[perf-probe] Body: ${text}`)
    }
    return { status: res.status, json, text }
  }

  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  console.log('[perf-probe] Using headers:', Object.keys(hdrs).sort())

  const dbg = await req('GET', '/api/debug-session')
  console.log('[perf-probe] debug-session:', dbg.json)

  const auth = await req('GET', '/api/debug-auth')
  console.log('[perf-probe] debug-auth:', auth.json)

  await req('GET', '/api/dashboard/summary')
  await req('GET', '/api/reports/lookups')
  await req('GET', '/api/templates')
  await req('GET', '/api/units')

  await req('POST', '/api/reports/services', { dateRange: 'custom', startDate: iso(start), endDate: iso(end) })
  await req('POST', '/api/reports/chemicals/summary', { dateRange: 'custom', startDate: iso(start), endDate: iso(end) })
  await req('POST', '/api/reports/equipment/logs', { startDate: iso(start), endDate: iso(end) })

  console.log('[perf-probe] Done')
}

main().catch((e) => { console.error('[perf-probe] Error:', e?.message || e); process.exit(1) })
