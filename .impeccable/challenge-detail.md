# Challenge detail and configuration
Mode: Operate. Existing shared-training-log world, code-first, no new identity.
User-requested structure: challenge overview KPI cards, followed by expandable daily history. Today and yesterday start open. Each earlier day expands independently, with locked personal history and visible group status.
Metric truth: completed daily-goal percentage excludes pending today; today's check-in count requires every goal to be marked; group dues sum member balances; days remaining include today within the challenge dates.
Signature interaction: marking your own recent goal saves immediately, updating history and overview without moving the scroll position. Preserve the existing bulk-save Today workspace.
Configuration: creator edits metadata and rules point-forward. Daily changes apply tomorrow; weekly changes and transitions involving weekly frequency apply next Sunday. Effective dates, planned values and applied/scheduled history explain the boundary. Earlier check-ins/fines keep their original snapshots. Timezone/dates stay fixed. Members read settings and invites; unsaved settings block navigation. Backend authorization and date applicability enforce the same rules.
Responsive: four KPI columns on desktop, two on mobile; independently expanded history blocks and stacked configuration fields. Use established colors, typography, 44px touch controls and border-only elevation.

## Completion motion
User-authorized focal moment: a small two-sided confetti burst for a newly completed goal, a larger burst after successful check-in. Bound to one overlay at a time, 30/48 particles, 1.25 seconds of motion with 1.9-second total feedback, no sound and no input interception. Respects reduced motion with static confirmation. No animation on initial load, polling, or repeated Done taps. Today draft feedback distinguishes marking from saving; history feedback follows persistence. Emoji plus text explains day state without treating pending goals or weekly rest as failure.

## Extension evidence (2026-10-29)

Source check: `src/ChallengeDetails.tsx`, `src/ChallengeConfiguration.tsx` and `src/challenge-ui.tsx` retain the incumbent forest/terracotta palette, system text, white bordered panels, 12px panel corners, 8px controls and minimum 44px actions. Metric numerals use tabular figures at 28px/600 as a local component choice between the established 26px progress and 32px headline roles. Compact page titles use 26px/34px on mobile. These local choices do not introduce or replace global type tokens.

The detail screen places the four overview metrics before independently expandable history, initially opening today and yesterday. Earlier history starts collapsed and loads in groups of fourteen. Recent personal choices retain Done/Missed labels and save immediately; other members' statuses and saved notes remain visible. Configuration permits creator point-forward edits, explains effective dates and preserved historical rules, and discloses manual self-reported payments.

Finish review evidence supplied by the reviewer: `.impeccable/review/challenge-feature-contact-sheet-20261029-r1.png`; disposition: ship, no material fixes. This documentation pass inspected source and existing system files; it did not repeat browser or runtime verification.

`DESIGN.md` and `.impeccable/design.json` are preserved. Existing documentation drift is not repaired here: the normative badge typography references the 13px/20px label role, while the sidecar badge preview uses 11px/17px. This ordinary extension does not authorize a system refresh.

## Point-forward extension evidence (2026-11-01)

The user's explicit point-forward decision supersedes the initial pre-start-only editing restriction. Current source checks covered `PRODUCT.md`, `src/domain.ts`, `src/ChallengeConfiguration.tsx`, `src/repository.ts` and `supabase/migrations/202610290003_forward_goal_rules.sql`. Daily edits/removals apply tomorrow in the challenge timezone; weekly edits/removals and transitions involving weekly frequency apply next Sunday. Before the start, changes apply from the first challenge day. Dated snapshots retain historical rules and stable goal IDs; retiring an active goal preserves its check-ins. Added goals apply only from their effective date. Metadata-only saves omit goal changes and create no rule revisions.

Configuration now shows planned field values, per-goal effective dates, and Applied/Scheduled rule history in the incumbent labeled panels and pills. Historical display, completion metrics and fines resolve the applicable dated rules. These behaviors extend the existing visual system; neither `DESIGN.md` nor `.impeccable/design.json` was refreshed, and the previously recorded badge discrepancy remains outside scope.

Fresh finish review supplied by the reviewer: `.impeccable/review/forward-rules-review-20261101.png`, covering desktop/mobile point-forward configuration and rule history; disposition: ship, no material fixes. The implementation owner reports 18 domain/database tests, typecheck, build and browser flows passed on 2026-11-01. This documentation pass checked source and recorded that evidence without rerunning verification. No hosted Supabase or native-device verification is claimed.

## Completion feedback evidence (2026-11-01)

Source checks covered `src/Celebration.tsx`, `src/DayMood.tsx`, `src/day-mood.ts`, the completion handlers in `App.tsx`, history mood integration in `src/ChallengeDetails.tsx`, and the matching `PRODUCT.md`/`README.md` descriptions. User-authorized confetti uses React Native geometry: 30 particles for a new Done selection, 48 after a successful check-in, 1.25 seconds of motion and 1.9 seconds of total feedback. Its noninteractive overlay uses static confirmation for reduced motion, a polite message and no sound. Today draft feedback explicitly says to save; history celebrates after persistence. Duplicate Done taps return early, refresh/load does not trigger events, and returning Home clears the previous event. The separate Home feature is outside this review.

Day feedback pairs accessible text with neutral 🌱, progress 😊, complete daily goals 🎉, supportive misses-dominant 😔 and earned weekly rest 😌. Weekly rest alone is not a negative daily outcome. Emoji and temporary particle colors are local feedback choices approved for this extension, not new global icon or palette tokens. Existing forest/terracotta surfaces, labeled states and flat panels remain the incumbent system; `DESIGN.md` and `.impeccable/design.json` are preserved without regenerating tokens or repairing previously recorded drift.

Fresh finish review supplied by the reviewer: `.impeccable/review/celebration-review-20261101.png`, covering a desktop burst and mobile reduced-motion viewports; disposition: ship, no material fixes. The implementation owner reports 23 unit/database tests, typecheck, build, full browser flows and `test:celebrations` passed; the final Home-clear regression build was still running when this documentation pass was requested. This pass inspected source and recorded supplied evidence only. No hosted Supabase or native-device verification is claimed.
