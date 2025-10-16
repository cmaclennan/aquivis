import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

function parseDsn(dsn: string) {
  // DSN format (generalized): https://PUBLIC_KEY@HOST/PROJECT_ID
  const url = new URL(dsn)
  const publicKey = url.username
  const host = url.host
  const projectId = url.pathname.replace(/^\//, '')
  return { publicKey, host, projectId }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  if (!dsn) return new Response(null, { status: 204 })

  const { publicKey, host, projectId } = parseDsn(dsn)
  const envelopeUrl = `https://${host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`

  const body = await req.text()

  const upstream = await fetch(envelopeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body,
    // Do not forward credentials
  })

  return new Response(null, { status: upstream.status })
}


