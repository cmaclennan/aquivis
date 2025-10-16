### Pre-push checklist

Run automatically via `npm run prepush:verify` and enforced by the pre-push Git hook. Items marked [auto] are validated by the script; others are manual.

- [auto] Build succeeds: `npm run build`
- [auto] No hardcoded DSNs/keys in code (Sentry DSN must come from env)
- [auto] Sentry init only in `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- [auto] Sentry tunnel enabled in `next.config.js` at `/monitoring`
- [auto] `middleware.ts` excludes `monitoring` path in its matcher
- [auto] No `console.*` statements in `app/`, `components/`, `lib/`
- [manual] Smoke test locally: login → dashboard → properties → customers → services
- [manual] Review browser console: no Sentry 403 spam, no unhandled errors
- [manual] If configuration changed, update docs accordingly

Notes
- You can skip the build during experimentation by running `SKIP_BUILD=1 npm run prepush:verify`.

