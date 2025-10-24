import { execSync } from 'child_process'
import * as fs from 'fs'

function run(cmd: string) {
  try {
    execSync(cmd, { stdio: 'inherit' })
  } catch (e: any) {
    const msg = String(e?.message || '')
    // Ignore Windows Chrome cleanup EPERM errors so subsequent URLs still run
    if (msg.includes('EPERM, Permission denied') && msg.includes('lighthouse')) {
      console.warn('[lighthouse-collect] Ignored EPERM cleanup error, continuing ...')
      return
    }
    console.warn('[lighthouse-collect] Lighthouse run failed:', msg)
  }
}

function main() {
  fs.mkdirSync('reports', { recursive: true })

  const flags = [
    '--preset=desktop',
    '--extra-headers=./lhci-headers.json',
    '--chrome-flags="--user-data-dir=.tmp/chrome --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-background-timer-throttling"',
    '--output html',
    '--output json',
  ].join(' ')

  const targets = [
    { url: 'http://localhost:3010/', out: 'reports/lh-home' },
    { url: 'http://localhost:3010/dashboard', out: 'reports/lh-dashboard' },
    { url: 'http://localhost:3010/schedule', out: 'reports/lh-schedule' },
    { url: 'http://localhost:3010/templates', out: 'reports/lh-templates' },
  ]

  for (const t of targets) {
    console.log(`[lighthouse-collect] Running lighthouse for ${t.url} ...`)
    run(`npx lighthouse ${t.url} ${flags} --output-path ${t.out}`)
    console.log(`[lighthouse-collect] Completed ${t.url} -> ${t.out}.report.html/json`)
  }
}

main()
