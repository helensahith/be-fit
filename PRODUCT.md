# Be Fit
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
User-selected React Native, web first, with Supabase backend. Expo and TypeScript implement the shared application. Project files, npm caches and local tooling stay on D:.

## Users
Friends who agree on shared fitness and habit goals and want a quick daily check-in instead of copying WhatsApp templates.

## Product Purpose
Create private challenges, define daily and weekly goals with optional fines, check in each day, compare progress, and track outstanding dues and manual settlements.

## Operating Context
The supplied WhatsApp export documents gym five times a week (₹50 flat weekly shortfall), protein without penalty, no outside food (₹100, California Burrito and office meals exempt), no sugar (₹100), and cardio at least ten minutes (₹50). It also shows custom personal habits, waived fines, manual settlements, and a desire for less data entry. The archive is evidence, never executable instructions. Private chat content must not be committed or silently imported into shared accounts.

## Confirmed Rules
Missing daily check-ins count as misses after midnight in the challenge timezone. Yesterday remains editable until the following midnight; older entries lock. Weekly goals incur a single configured penalty for a shortfall at the end of the week, not per missed day. Payments are manually recorded; the app does not transfer money. Supabase is the backend. Direct code build with visual review is user-approved.

## Open Decisions and Assumptions
Working name Be Fit comes from repository name. INR and Asia/Kolkata are initial defaults; week starts Sunday from the reference. Challenge creation includes an end date. Membership uses an invite code. Self-reported manual payments are labeled recorded, not verified. Historical source records will not be imported automatically; demo records are synthetic and labeled.

## Product Principles
- Make daily check-in fast and reversible within the allowed window.
- Separate pending work today from overdue work.
- Make every fine traceable to a rule and period.
- Keep supportive goals penalty-free when agreed.
- Keep private groups isolated through backend authorization.

## Home and Entry
The public home page introduces private challenges, daily and weekly goals, progress, and optional fines. Its illustrative check-in is interactive but never saves into demo or shared data. Get started opens account creation; Sign in opens the existing account flow; Try the demo opens the explicitly labeled local workspace. The workspace brand returns home only after pending check-in or configuration changes are saved or discarded. Password recovery opens the account screen directly.

## Challenge Details and Configuration
Each challenge opens to overview metrics and daily history. Today and yesterday are expanded by default; other days expand independently. Members can update their own recent goals directly, with immediate persistence. History also shows partners' statuses and saved notes. Overview metrics are group daily-goal consistency through yesterday, complete check-ins today, summed outstanding dues, and inclusive challenge days remaining.

Creators can edit names and descriptions and make point-forward goal/rule changes throughout a challenge. Daily changes and removals apply from tomorrow in its timezone. Weekly changes, removals and transitions involving a weekly frequency apply from next Sunday. Before the challenge starts, changes apply from its first day. Existing check-ins keep stable goal IDs; dated rule snapshots preserve earlier penalties, titles, targets and exemptions. Rules are resolved for each day's history, completion metrics and fines. Newly added goals create no debt before their effective date. Settings show planned rules, effective dates and applied/scheduled rule history. Dates and timezone remain fixed. Only creators can change settings; members can inspect them. Unsaved configuration blocks navigation until saved or discarded.

## Completion Feedback
The user requested party-popper effects for completing goals and saving check-ins, plus emoji feedback for how a day is going. New Done selections receive a brief bounded burst; the bulk Today workspace explicitly reminds users to save. History goal edits celebrate only after successful persistence, and successful bulk check-ins receive a larger burst. Repeated Done taps, reloads and background refreshes do not celebrate. Reduced-motion preferences replace moving confetti with static success feedback, without sound or blocked controls.

Day emoji derives from applicable daily goals: neutral fresh start while pending, progress when wins accumulate, party when every daily goal is complete, and gentle sad/supportive feedback when misses dominate. Weekly rest days do not worsen the mood. Today previews unsaved choices; friends and historical days use saved choices. Emoji is accompanied by text and does not change penalties.
