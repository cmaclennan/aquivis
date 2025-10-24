// Artillery processor to record and summarize Server-Timing per endpoint
// Usage: referenced by artillery.config.json as processor: './scripts/artillery-processor.js'

const agg = {
  byUrl: Object.create(null),
}

function parseServerTiming(header) {
  // Example: "db;dur=123.4, app;desc=foo;dur=89"
  const res = {}
  if (!header) return res
  const parts = String(header).split(',')
  for (const p of parts) {
    const segs = p.trim().split(';')
    const name = segs[0].trim()
    for (const s of segs.slice(1)) {
      const [k, v] = s.split('=')
      if (k && k.trim() === 'dur') {
        const n = Number(v)
        if (!Number.isNaN(n)) res[name] = n
      }
    }
  }
  return res
}

function record(url, metrics) {
  const key = url
  const row = (agg.byUrl[key] ||= { count: 0, sums: Object.create(null) })
  row.count += 1
  for (const [k, v] of Object.entries(metrics)) {
    row.sums[k] = (row.sums[k] || 0) + v
  }
}

function recordServerTiming(requestParams, response, context, ee, next) {
  try {
    const url = requestParams?.url || requestParams?.path || 'unknown'
    const header = response?.headers?.['server-timing'] || response?.headers?.['Server-Timing']
    const metrics = parseServerTiming(header)
    if (Object.keys(metrics).length) {
      record(url, metrics)
    }
  } catch (e) {
    // ignore
  }
  return next()
}

process.on('exit', () => {
  try {
    const entries = Object.entries(agg.byUrl)
    if (!entries.length) return
    console.log('\n[artillery-processor] Server-Timing summary:')
    for (const [url, row] of entries) {
      const parts = []
      for (const [k, sum] of Object.entries(row.sums)) {
        const avg = sum / row.count
        parts.push(`${k}: avg=${avg.toFixed(1)}ms over ${row.count}`)
      }
      console.log(`  ${url} -> ${parts.join(', ')}`)
    }
  } catch {}
})

module.exports = {
  recordServerTiming,
}
