import { test } from 'node:test';
import assert from 'node:assert/strict';
import { balanceFor, Challenge, completion, daySummary, finesFor, Goal, goalsOn, plannedGoals, ruleEffectiveDate, scheduleGoals } from '../src/domain';
const base = (): Challenge => ({ id: 'c', ownerId: 'a', name: 'Pact', description: '', start: '2026-10-25', end: '2026-11-14', timezone: 'Asia/Kolkata', invite: 'CODE', members: [{ id: 'a', name: 'A', joined: '2026-10-25' }], goals: [{ id: 'daily', title: 'Walk', description: '', frequency: 'daily', target: 1, penalty: 100, icon: 'walk-outline' }, { id: 'weekly', title: 'Gym', description: '', frequency: 'weekly', target: 5, penalty: 50, icon: 'barbell-outline' }], checkins: [], payments: [] });
function change(c: Challenge, today: string, mutate: (goals: Goal[]) => void) { const incoming = plannedGoals(c).map(g => ({ ...g })); mutate(incoming); let n = 0; return { ...c, goals: scheduleGoals(c, incoming, today, () => `new-${++n}`) }; }
test('daily penalty change preserves every historical fine and payment', () => {
  const c = base(); c.payments.push({ id: 'p', userId: 'a', amount: 75, date: '2026-10-28', note: '' });
  const before = balanceFor(c, 'a', '2026-10-29'); const changed = change(c, '2026-10-29', g => { g[0]!.penalty = 250; });
  assert.deepEqual(balanceFor(changed, 'a', '2026-10-29'), before);
  assert.equal(goalsOn(changed, '2026-10-29')[0]!.penalty, 100); assert.equal(goalsOn(changed, '2026-10-30')[0]!.penalty, 250);
  assert.equal(finesFor(changed, 'a', '2026-10-31').find(f => f.period === '2026-10-29')!.amount, 100);
  assert.equal(finesFor(changed, 'a', '2026-10-31').find(f => f.period === '2026-10-30')!.amount, 250);
});
test('weekly edits apply next Sunday and preserve current-week target and fine', () => {
  const c = change(base(), '2026-10-29', g => { g[1]!.target = 3; g[1]!.penalty = 90; });
  assert.equal(goalsOn(c, '2026-10-31')[1]!.target, 5); assert.equal(goalsOn(c, '2026-11-01')[1]!.target, 3);
  assert.equal(finesFor(c, 'a', '2026-11-01').find(f => f.goalId === 'weekly')!.amount, 50);
  assert.equal(finesFor(c, 'a', '2026-11-08').find(f => f.goalId === 'weekly' && f.period === '2026-11-07')!.amount, 90);
  assert.equal(ruleEffectiveDate(c, '2026-11-01', 'weekly'), '2026-11-08');
});
test('frequency changes involving a weekly rule wait for the next week', () => {
  const c = change(base(), '2026-10-29', g => { g[0]!.frequency = 'weekly'; g[0]!.target = 3; });
  assert.equal(goalsOn(c, '2026-10-31')[0]!.frequency, 'daily'); assert.equal(goalsOn(c, '2026-11-01')[0]!.frequency, 'weekly');
  assert.equal(completion(c, 'a', '2026-10-25', '2026-10-31').total, 7);
  assert.equal(completion(c, 'a', '2026-11-01', '2026-11-07').total, 0);
});
test('retiring a goal keeps its old fines, check-ins and historical day totals', () => {
  const c = base(); c.checkins.push({ userId: 'a', goalId: 'daily', date: '2026-10-28', done: true });
  const changed = change(c, '2026-10-29', goals => { goals.splice(0, 1); });
  assert.equal(goalsOn(changed, '2026-10-29').length, 2); assert.equal(goalsOn(changed, '2026-10-30').length, 1);
  assert.equal(daySummary(changed, 'a', '2026-10-28', '2026-10-29').done, 1);
  assert.equal(finesFor(changed, 'a', '2026-11-02').filter(f => f.goalId === 'daily').length, 4);
  assert.equal(changed.checkins[0]!.goalId, 'daily');
});
test('new goals never count as missed before their effective date', () => {
  const c = change(base(), '2026-10-29', g => { g.push({ ...g[0]!, id: 'temp', title: 'Water', penalty: 20 }); });
  assert.equal(goalsOn(c, '2026-10-29').length, 2); assert.equal(goalsOn(c, '2026-10-30').length, 3);
  assert.equal(finesFor(c, 'a', '2026-10-30').filter(f => f.title === 'Water').length, 0);
  assert.equal(finesFor(c, 'a', '2026-10-31').find(f => f.title === 'Water')!.amount, 20);
});
test('revising a scheduled change replaces it without rewriting applied versions', () => {
  let c = change(base(), '2026-10-29', g => { g[0]!.penalty = 250; });
  c = change(c, '2026-10-29', g => { g[0]!.penalty = 300; }); assert.equal(c.goals[0]!.revisions!.length, 1);
  c = change(c, '2026-10-30', g => { g[0]!.penalty = 500; });
  assert.equal(goalsOn(c, '2026-10-29')[0]!.penalty, 100); assert.equal(goalsOn(c, '2026-10-30')[0]!.penalty, 300); assert.equal(goalsOn(c, '2026-10-31')[0]!.penalty, 500);
  const unchanged = change(c, '2026-10-30', () => {}); assert.equal(unchanged.goals[0]!.revisions!.length, 2);
});
test('future and invalid transition edits preserve a coherent challenge', () => {
  const c = base(); c.start = '2026-10-30'; c.members[0]!.joined = c.start;
  const changed = change(c, '2026-10-29', g => { g[0]!.penalty = 60; }); assert.equal(goalsOn(changed, c.start)[0]!.penalty, 60);
  const short = base(); short.end = '2026-10-31'; assert.throws(() => change(short, '2026-10-29', g => { g[1]!.penalty = 99; }), /after the challenge ends/);
  assert.throws(() => change(base(), '2026-10-29', g => { g.splice(0, g.length); }), /between 1 and 20/);
  assert.throws(() => change(base(), '2026-11-15', () => {}), /has ended/);
});
