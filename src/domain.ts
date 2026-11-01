export type GoalRule = { title: string; description: string; frequency: 'daily' | 'weekly'; target: number; penalty: number; icon: string };
export type Goal = GoalRule & { id: string; effectiveFrom?: string; effectiveTo?: string; revisions?: (GoalRule & { effectiveFrom: string })[] };
export type Member = { id: string; name: string; joined: string };
export type Checkin = { goalId: string; userId: string; date: string; done: boolean; note?: string };
export type Payment = { id: string; userId: string; amount: number; date: string; note: string };
export type Challenge = { id: string; name: string; description: string; start: string; end: string; timezone: string; invite: string; ownerId: string; goals: Goal[]; members: Member[]; checkins: Checkin[]; payments: Payment[] };
export type Fine = { id: string; goalId: string; title: string; period: string; amount: number; reason: string };
export const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export function todayIn(timezone = 'Asia/Kolkata', now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function addDays(date: string, days: number): string { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
export function weekStart(date: string): string { return addDays(date, -new Date(date + 'T12:00:00Z').getUTCDay()); }
export function dateRange(start: string, end: string): string[] { const dates: string[] = []; for (let d = start; d <= end; d = addDays(d, 1)) dates.push(d); return dates; }
export function checkinFor(c: Challenge, goalId: string, userId: string, date: string) { return c.checkins.find(x => x.goalId === goalId && x.userId === userId && x.date === date); }
export function goalOn(c: Challenge, g: Goal, date: string): Goal | null {
  if (date < (g.effectiveFrom ?? c.start) || date > (g.effectiveTo ?? c.end)) return null;
  const revision = (g.revisions ?? []).filter(r => r.effectiveFrom <= date).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  return revision ? { ...g, ...revision, effectiveFrom: g.effectiveFrom } : g;
}
export function goalsOn(c: Challenge, date: string): Goal[] { return c.goals.map(g => goalOn(c, g, date)).filter((g): g is Goal => !!g); }
export function plannedGoals(c: Challenge): Goal[] { return goalsOn(c, c.end); }
export function ruleEffectiveDate(c: Challenge, today: string, frequency: 'daily' | 'weekly', previous?: 'daily' | 'weekly') {
  if (today < c.start) return c.start;
  return frequency === 'weekly' || previous === 'weekly' ? addDays(weekStart(today), 7) : addDays(today, 1);
}
function ruleFields(g: GoalRule): GoalRule { return { title: g.title.trim(), description: g.description, frequency: g.frequency, target: g.target, penalty: g.penalty, icon: g.icon }; }
function sameRule(a: GoalRule, b: GoalRule) { return JSON.stringify(ruleFields(a)) === JSON.stringify(ruleFields(b)); }
export function scheduleGoals(c: Challenge, incoming: Goal[], today: string, newId: () => string): Goal[] {
  if (today > c.end) throw new Error('This challenge has ended. Its rules cannot be changed.');
  if (!incoming.length || incoming.length > 20) throw new Error('Keep between 1 and 20 goals.');
  if (new Set(incoming.map(g => g.id)).size !== incoming.length) throw new Error('A goal cannot appear twice.');
  const result = c.goals.map(g => ({ ...g, revisions: [...(g.revisions ?? [])] }));
  for (const next of incoming) {
    const issue = validateGoal(next); if (issue) throw new Error(issue);
    const old = result.find(g => g.id === next.id);
    if (old && old.effectiveTo && old.effectiveTo < today) throw new Error('Retired goals cannot be restored retroactively. Add a new goal instead.');
    const current = old ? goalOn(c, old, today) : null;
    const planned = old ? goalOn(c, old, c.end) ?? current ?? old : null;
    if (old && planned && sameRule(planned, next) && !old.effectiveTo) continue;
    const from = ruleEffectiveDate(c, today, next.frequency, current?.frequency);
    if (from > c.end) throw new Error('This rule would start after the challenge ends.');
    if (!old) result.push({ ...ruleFields(next), id: newId(), effectiveFrom: from, revisions: [] });
    else if (today < c.start || (old.effectiveFrom ?? c.start) > today) Object.assign(old, ruleFields(next), { effectiveFrom: from, effectiveTo: undefined, revisions: [] });
    else { old.effectiveTo = undefined; old.revisions = [...old.revisions.filter(r => r.effectiveFrom < from), { ...ruleFields(next), effectiveFrom: from }]; }
  }
  const retained: Goal[] = [];
  for (const old of result) {
    // Newly created goals have generated IDs, unlike the submitted temporary IDs.
    const original = c.goals.find(g => g.id === old.id);
    if (!original || incoming.some(g => g.id === old.id) || old.effectiveTo && old.effectiveTo < today) { retained.push(old); continue; }
    if ((old.effectiveFrom ?? c.start) > today || today < c.start) continue;
    const current = goalOn(c, old, today) ?? old;
    const from = ruleEffectiveDate(c, today, current.frequency);
    if (from > c.end) throw new Error('This removal would start after the challenge ends.');
    old.effectiveTo = addDays(from, -1); old.revisions = old.revisions.filter(r => r.effectiveFrom < from); retained.push(old);
  }
  const proposed = { ...c, goals: retained };
  for (const day of dateRange([today, c.start].sort().at(-1)!, c.end)) {
    const count = goalsOn(proposed, day).length;
    if (count < 1 || count > 20) throw new Error('Keep between 1 and 20 active goals on every challenge day, including the transition.');
  }
  return retained;
}
export function canEdit(c: Challenge, date: string, today: string, userId: string): boolean { const member = c.members.find(m => m.id === userId); return !!member && date >= member.joined && date >= c.start && date <= c.end && date <= today && date >= addDays(today, -1); }
export function weeklyProgress(c: Challenge, goal: Goal, userId: string, date: string) {
  const member = c.members.find(m => m.id === userId);
  const start = [weekStart(date), c.start, member?.joined ?? c.start, goal.effectiveFrom ?? c.start].sort().at(-1)!;
  const end = [addDays(weekStart(date), 6), c.end, goal.effectiveTo ?? c.end].sort()[0]!;
  const target = Math.min(goal.target, Math.max(0, dateRange(start, end).length));
  const done = c.checkins.filter(x => x.goalId === goal.id && x.userId === userId && x.done && x.date >= start && x.date <= end).length;
  return { done, target, start, end };
}
export function finesFor(c: Challenge, userId: string, today: string): Fine[] {
  const member = c.members.find(m => m.id === userId); if (!member) return [];
  const start = [c.start, member.joined].sort().at(-1)!;
  const end = [c.end, addDays(today, -1)].sort()[0]!;
  const fines: Fine[] = [];
  for (const date of dateRange(start, end)) {
    for (const goal of goalsOn(c, date).filter(g => g.frequency === 'daily' && g.penalty > 0)) {
        const entry = checkinFor(c, goal.id, userId, date);
        if (!entry?.done) fines.push({ id: `${goal.id}:${date}`, goalId: goal.id, title: goal.title, period: date, amount: goal.penalty, reason: entry ? 'Marked missed' : 'No check-in' });
    }
  }
  for (let week = weekStart(start); week <= end; week = addDays(week, 7)) {
    const probe = [week, start].sort().at(-1)!;
    for (const goal of goalsOn(c, probe).filter(g => g.frequency === 'weekly' && g.penalty > 0)) {
        const period = weeklyProgress(c, goal, userId, week);
        if (period.end < today && period.target > 0 && period.done < period.target) fines.push({ id: `${goal.id}:${week}`, goalId: goal.id, title: goal.title, period: period.end, amount: goal.penalty, reason: `${period.done}/${period.target} weekly sessions` });
    }
  }
  return fines.sort((a, b) => b.period.localeCompare(a.period));
}
export function balanceFor(c: Challenge, userId: string, today: string) {
  const total = finesFor(c, userId, today).reduce((sum, f) => sum + f.amount, 0);
  const paid = c.payments.filter(p => p.userId === userId).reduce((sum, p) => sum + p.amount, 0);
  return { total, paid, due: Math.max(0, total - paid), credit: Math.max(0, paid - total) };
}
export function completion(c: Challenge, userId: string, start: string, end: string) {
  const member = c.members.find(m => m.id === userId);
  const from = [start, c.start, member?.joined ?? c.start].sort().at(-1)!;
  const to = [end, c.end].sort()[0]!;
  const days = dateRange(from, to);
  let total = 0, done = 0;
  for (const d of days) for (const g of goalsOn(c, d).filter(g => g.frequency === 'daily')) { total++; if (checkinFor(c, g.id, userId, d)?.done) done++; }
  return { done, total, percent: total ? Math.round(done / total * 100) : 0 };
}
export function validateGoal(g: Goal): string | null {
  if (!g.title.trim()) return 'Give every goal a name.';
  if (!Number.isFinite(g.penalty) || g.penalty < 0 || g.penalty > 100000 || !Number.isInteger(g.penalty)) return 'Penalties must be whole rupees between 0 and 100,000.';
  if (!Number.isInteger(g.target) || g.target < 1 || g.target > 7) return 'Weekly targets must be between 1 and 7 days.';
  return null;
}

export function challengeOverview(c: Challenge, today: string) {
  const closedEnd = [c.end, addDays(today, -1)].sort()[0]!;
  const progress = c.members.map(m => completion(c, m.id, c.start, closedEnd));
  const total = progress.reduce((n, p) => n + p.total, 0);
  const done = progress.reduce((n, p) => n + p.done, 0);
  const eligible = c.members.filter(m => m.joined <= today && today >= c.start && today <= c.end);
  const todayGoals = goalsOn(c, today);
  const checkedIn = todayGoals.length ? eligible.filter(m => todayGoals.every(g => !!checkinFor(c, g.id, m.id, today))).length : 0;
  return { total, done, consistency: total ? Math.round(done / total * 100) : null, checkedIn, eligible: eligible.length,
    groupDue: c.members.reduce((n, m) => n + balanceFor(c, m.id, today).due, 0),
    daysLeft: dateRange([today, c.start].sort().at(-1)!, c.end).length,
    days: dateRange(c.start, [today, c.end].sort()[0]!).reverse() };
}

export function daySummary(c: Challenge, userId: string, date: string, today: string) {
  const eligible = c.members.filter(m => m.joined <= date);
  const applicable = goalsOn(c, date);
  const done = c.checkins.filter(x => x.date === date && x.done && applicable.some(g => g.id === x.goalId) && eligible.some(m => m.id === x.userId)).length;
  const total = eligible.length * applicable.length;
  const fine = c.members.reduce((n, m) => n + finesFor(c, m.id, today).filter(f => f.period === date).reduce((sum, f) => sum + f.amount, 0), 0);
  return { done, total, fine, editable: canEdit(c, date, today, userId) };
}
