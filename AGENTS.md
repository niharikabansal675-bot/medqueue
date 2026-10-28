
- All demo data lives in browser localStorage via `src/lib/store.ts` (validated, seeded, synced across tabs); no backend by design.
- Student pages under `/student/*`, staff under `/staff/*`; each layout wraps the shared `AppShell` from `src/components/med`.
