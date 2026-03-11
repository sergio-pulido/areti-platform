# PWA Release Checklist

Use this checklist for any release that changes PWA metadata, caching, install behavior, or offline UX.

## Pre-Release
- [ ] Update `SW_VERSION` in `apps/web/public/sw.js` when cache behavior or cache keys change.
- [ ] Verify `apps/web/src/app/manifest.ts` fields are accurate (name, icons, screenshots, shortcuts, theme colors).
- [ ] Confirm screenshot assets in `apps/web/public/` represent the current real product UX.
- [ ] Ensure `apps/web/next.config.ts` still serves `/sw.js` with `Cache-Control: no-cache, no-store, must-revalidate`.

## Validation
- [ ] Run `npm run lint --workspace @areti/web`.
- [ ] Run `npm run build --workspace @areti/web`.
- [ ] Run `npm run test:e2e -- --grep "pwa assets and offline route are available"`.
- [ ] In a production run (`npm run start --workspace @areti/web`), confirm in browser devtools:
  - Manifest is valid and install prompt is available.
  - Service worker is active and controlling the page.
  - Offline navigation falls back to `/offline`.

## Post-Release
- [ ] Smoke-check installability on desktop Chrome/Edge and iOS Safari "Add to Home Screen".
- [ ] Confirm no authentication/session regressions caused by stale cache behavior.
