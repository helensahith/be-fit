# Be Fit

A web-first Expo / React Native app for fitness challenges between friends. Daily check-ins, shared progress, optional daily and weekly fines, and manual payment records.

## Run locally on D:

```powershell
Set-Location D:\be-fit\be-fit
npm.cmd install
npm.cmd run web
```

The project-local `.npmrc` puts npm's cache on D:. Node modules and build output also remain in this project. On machines that block PowerShell scripts, use `npm.cmd` and `npx.cmd`.

The app opens in a clearly labeled local demo. Sample check-ins are generated relative to today, persist on this device, and can be reset in Account. The two demo identities let you explore each friend's view. Invite codes in demo mode do not connect devices. No private WhatsApp messages or historical check-ins were imported.

## Connect Supabase

1. Create a Supabase project, or use an existing development project.
2. Run the SQL files in `supabase/migrations/` in filename order in its SQL editor. Existing projects need any migrations not already applied, including `202610290003_forward_goal_rules.sql` for point-forward changes. Alternatively link the project with the Supabase CLI and run `supabase db push`.
3. Copy `.env.example` to `.env`. Add the project URL and **publishable / anon key** from Supabase. Never put a service-role or secret key in the client.
4. In Supabase Authentication, enable email/password. Configure your Site URL and redirect allowlist for the local Expo URL and production web URL. Keep confirmation email enabled for real accounts. Configure SMTP for production delivery.
5. Restart Expo, open Account, and create an account. Confirm the email and sign in. Create a challenge and share its invite code with a second signed-in account.

Cloud data and demo data stay separate. Signing in does not upload the demo. A restored session is available in Account → Open shared workspace. Shared data refreshes every 30 seconds while there are no unsaved edits; Refresh group fetches it immediately.

The `be-fit` hosted Supabase project was connected on 2026-11-01. The three application migrations and `restrict_rpc_access` were applied; all six tables have RLS enabled, anonymous RPC execution is revoked, and email/password signup with confirmation is enabled. The ignored `.env` contains only public client configuration. Email delivery, real multi-device access, and production redirects still need verification. Local PostgreSQL tests use PGlite with an auth fixture and authenticated roles.

The connector recorded hosted migration versions `20261101152543`, `20261101152604`, and `20261101152611` for the three original migrations, respectively. Their local filenames retain the original versions. Reconcile migration history before using CLI `db push` against this project; do not reapply the original schema migrations.

## Rules

- Daily check-ins use the challenge's IANA timezone (default Asia/Kolkata), not the browser timezone.
- Unmarked daily goals become misses after midnight. Today remains pending until then. Explicit misses appear in today's preview and enter the ledger after midnight.
- Today and yesterday are editable within challenge and membership dates. Older entries are locked by the database RPC as well as the interface.
- Weeks run Sunday–Saturday. Weekly targets count completed days and incur one flat shortfall penalty after the period closes. Partial first/last weeks and late joins cap the target to the number of membership days in that period.
- A goal with a ₹0 penalty still tracks progress. Weekly rest days do not create daily fines.
- Fines are derived from check-ins; repeated refreshes cannot duplicate them. Editing yesterday recalculates the balance. If a paid fine disappears, the excess becomes credit against future fines.
- Payment entries are self-reported, append-only manual records. The app does not move money or verify a transfer. Each user can record payments only for themselves.
- Rule changes apply point-forward: daily edits/removals from tomorrow, weekly edits/removals and frequency transitions involving a weekly goal from next Sunday. Before the challenge starts, edits apply from its first day. Historical check-ins and fines keep their dated rules. New members and newly added goals create no debt before their respective start dates.
- Open a challenge from the list or tap its summary on Today to see overview metrics and expandable daily history. Today and yesterday open by default. Recent goal changes save immediately here; the separate Today workspace retains its explicit Save check-in action.
- Challenge settings let the creator edit the name, description, goals and penalties. Planned rules display their effective dates, and Rule history records applied and scheduled snapshots. Dates/timezone stay fixed. Other members can view settings and invites. Backend authorization and applicability checks protect earlier periods.

## Commands and verification

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run preview
# With preview running:
npm.cmd run test:ui
npm.cmd run test:celebrations
```

The UI test uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when supplied; otherwise it uses the existing Windows Playwright installation at the path in `scripts/verify-ui.mjs`. It launches a separate headless profile and only visits the local app. Screenshots are written to the ignored `.impeccable/review/` folder. To keep temporary browser data on D:, set `TEMP` and `TMP` to `D:\be-fit\be-fit\.cache\tmp` before running.

New Done selections and successful check-ins get a short, nonblocking confetti burst. Today still requires Save check-in; its celebration explicitly distinguishes marking from saving. History celebrates after the edit saves. Repeated Done taps and reloads do not replay the effect. Reduced-motion preferences show static confirmation instead. Daily mood emoji and text reflect progress without counting weekly rest days as misses; they never alter penalties.

Tests cover penalty boundaries, timezone midnight, partial weeks, membership windows, payment credits, migration execution, cross-group read protection, invite joining, self-only payments, and server-side check-in locks. Native iOS/Android binaries have not been built or device-tested; the shared UI is implemented with React Native primitives.

## Project structure

- `App.tsx`: responsive screens and interaction state.
- `src/domain.ts`: deterministic challenge, progress, and penalty calculations.
- `src/repository.ts`: Supabase reads and mutations.
- `src/supabase.ts`: persistent authenticated client; public configuration only.
- `src/seed.ts`: synthetic local demo.
- `supabase/migrations/`: tables, constraints, row-level security, and atomic RPCs.
- `PRODUCT.md`, `DESIGN.md`, `.impeccable/`: durable product and design rules.
- `.agents/skills/apple-design/`: requested project-local Apple design skill, installed on D:.

Apple design is available to Codex from the next turn. Impeccable used the confirmed shared-training-log direction and direct-code workflow. The interface applies Apple accessibility and layout foundations to web; it does not imitate native Apple desktop chrome.

## Current limits

There is no push notification scheduler, bank integration, proof upload, fine waiver workflow, or retroactive rule editor in this first version. Data is refreshed by polling rather than a Realtime subscription. Fines are calculated when viewed; no background job or duplicate-prone daily penalty insertion is needed.

`npm audit` currently reports eight upstream findings in Expo's CLI/config dependency tree (Zod 3 and deepmerge), including three high-severity affected packages. Compatible upstream patches were unavailable at implementation time; the suggested automatic fix downgrades Expo across major versions. These are recorded rather than forcing an incompatible override. Review upstream patches before production deployment, and keep the development server local.
