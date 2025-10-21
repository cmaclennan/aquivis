#!/usr/bin/env node
/*
  Pre-push verification script.
  Fails with non-zero exit code if any automated check fails.
*/

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', ...opts })
}

function fail(msg) {
  console.error(`\n[prepush] FAIL: ${msg}\n`)
  process.exit(1)
}

function ok(msg) {
  console.log(`[prepush] ${msg}`)
}

// 1) Build (unless skipped)
if (!process.env.SKIP_BUILD) {
  try {
    ok('Building project (npm run build) ...')
    run('npm run build --silent')
    ok('Build succeeded')
  } catch (e) {
    fail('Build failed')
  }
} else {
  ok('Skipping build due to SKIP_BUILD=1')
}

// 2) No hardcoded DSNs/keys
const forbiddenPatterns = [
  /ingest\.sentry\.io\/[0-9]+/i,
  /@o\d+\.ingest\./i,
]

function grepWorkspace(regex) {
  const root = process.cwd()
  const queue = ['.']
  const hits = []
  const ignoreDirs = new Set(['.git', 'node_modules', '.next', '.cursor', '.vercel'])
  while (queue.length) {
    const rel = queue.pop()
    const full = path.join(root, rel)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      const base = path.basename(full)
      if (ignoreDirs.has(base)) continue
      for (const entry of fs.readdirSync(full)) queue.push(path.join(rel, entry))
    } else if (stat.isFile()) {
      const ext = path.extname(full)
      if (!['.ts', '.tsx', '.js', '.jsx', '.md', '.json'].includes(ext)) continue
      const content = fs.readFileSync(full, 'utf-8')
      for (const re of forbiddenPatterns) {
        if (re.test(content)) hits.push(full)
      }
    }
  }
  return Array.from(new Set(hits))
}

const hardcoded = grepWorkspace()
  .map(full => path.relative(process.cwd(), full))
  .filter(rel => !rel.startsWith(`docs${path.sep}`))

if (hardcoded.length) {
  fail(`Hardcoded DSN/keys found in files:\n- ${hardcoded.join('\n- ')}`)
} else {
  ok('No hardcoded DSNs/keys in code')
}

// 3) Sentry init only in expected files (scan without external tools)
const expectedInits = new Set([
  path.normalize('instrumentation-client.ts'),
  path.normalize('sentry.server.config.ts'),
  path.normalize('sentry.edge.config.ts'),
])

function walkFiles(startDirs, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const root = process.cwd()
  const queue = [...startDirs]
  const files = []
  const ignoreDirs = new Set(['.git', 'node_modules', '.next', '.cursor', '.vercel'])
  while (queue.length) {
    const rel = queue.pop()
    const full = path.join(root, rel)
    if (!fs.existsSync(full)) continue
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      const base = path.basename(full)
      if (ignoreDirs.has(base) || rel.startsWith('docs')) continue
      for (const entry of fs.readdirSync(full)) queue.push(path.join(rel, entry))
    } else if (stat.isFile()) {
      const ext = path.extname(full)
      if (extensions.includes(ext)) files.push(rel)
    }
  }
  return files
}

const allTsFiles = walkFiles(['.'])
const sentryInitFiles = allTsFiles.filter(rel => {
  if (rel.startsWith(`scripts${path.sep}`)) return false
  const content = fs.readFileSync(rel, 'utf-8')
  return content.includes('Sentry.init(')
}).map(f => path.normalize(f))

for (const file of sentryInitFiles) {
  if (!expectedInits.has(file)) {
    fail(`Unexpected Sentry.init in ${file}`)
  }
}
ok('Sentry init present only in expected files')

// 4) Sentry tunnel configured (either plugin tunnelRoute or runtime route)
const nextConfig = fs.readFileSync('next.config.js', 'utf-8')
const hasPluginTunnel = /tunnelRoute:\s*['"]\/monitoring['"]/.test(nextConfig)
const hasRuntimeTunnel = fs.existsSync(path.join('app', 'monitoring', 'route.ts'))
if (!(hasPluginTunnel || hasRuntimeTunnel)) {
  fail('Sentry tunnel not configured: expected plugin tunnelRoute or app/monitoring/route.ts')
}
ok('Sentry tunnel configured (plugin or runtime route)')

// 5) middleware excludes monitoring
const middleware = fs.readFileSync('middleware.ts', 'utf-8')
if (!/monitoring/.test(middleware)) {
  fail('middleware.ts does not exclude \/monitoring in matcher')
}
ok('middleware excludes /monitoring')

// 6) No console.* in app/, components/, lib/ (except logger.ts)
const scanDirs = ['app', 'components', 'lib']
const consoleMatches = []
const allowedConsoleFiles = new Set([
  path.normalize('lib/logger.ts'),
  path.normalize('lib\\logger.ts'),
])
for (const dir of scanDirs) {
  const files = walkFiles([dir])
  for (const file of files) {
    const normalizedFile = path.normalize(file)
    if (allowedConsoleFiles.has(normalizedFile)) continue
    const content = fs.readFileSync(file, 'utf-8')
    if (content.includes('console.')) {
      consoleMatches.push(file)
    }
  }
}
if (consoleMatches.length) {
  fail(`console.* statements found in:\n- ${Array.from(new Set(consoleMatches)).slice(0, 20).join('\n- ')}${consoleMatches.length > 20 ? '\n…' : ''}`)
}
ok('No console statements in app/, components/, lib/ (except logger.ts)')

ok('All automated pre-push checks passed')

