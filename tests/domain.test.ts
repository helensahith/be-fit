import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, balanceFor, canEdit, Challenge, challengeOverview, daySummary, finesFor, todayIn, weeklyProgress } from '../src/domain';
const fixture = (): Challenge => ({ id: 'c', name: 'Test', description: '', start: '2026-10-25', end: '2026-11-07', timezone: 'Asia/Kolkata', invite: 'CODE', ownerId: 'a', members: [{ id: 'a', name: 'A', joined: '2026-10-25' }], goals: [{ id: 'daily', title: 'Walk', description: '', frequency: 'daily', target: 1, penalty: 100, icon: 'walk-outline' }, { id: 'weekly', title: 'Gym', description: '', frequency: 'weekly', target: 5, penalty: 50, icon: 'barbell-outline' }, { id: 'free', title: 'Protein', description: '', frequency: 'daily', target: 1, penalty: 0, icon: 'nutrition-outline' }], checkins: [], payments: [] });
test('pending today is not charged; missing yesterday is charged once', () => { const c = fixture(); assert.equal(finesFor(c, 'a', '2026-10-25').length, 0); assert.equal(finesFor(c, 'a', '2026-10-26').length, 1); assert.equal(balanceFor(c, 'a', '2026-10-26').due, 100); assert.equal(balanceFor(c, 'a', '2026-10-26').due, 100); });
test('editing yesterday removes its fine, with payment credit preserved', () => { const c = fixture(); c.payments.push({ id: 'p', userId: 'a', date: '2026-10-26', amount: 100, note: '' }); c.checkins.push({ goalId: 'daily', userId: 'a', date: '2026-10-25', done: true }); assert.deepEqual(balanceFor(c, 'a', '2026-10-26'), { total: 0, paid: 100, due: 0, credit: 100 }); });
test('weekly goal is a single flat fine only after the week closes', () => { const c = fixture(); assert.equal(finesFor(c, 'a', '2026-10-31').filter(f => f.goalId === 'weekly').length, 0); assert.deepEqual(finesFor(c, 'a', '2026-11-01').filter(f => f.goalId === 'weekly').map(f => f.amount), [50]); });
test('five weekly completions prevent shortfall fine; rest days are free', () => { const c = fixture(); for (let i = 0; i < 5; i++) c.checkins.push({ goalId: 'weekly', userId: 'a', date: addDays(c.start, i), done: true }); assert.equal(finesFor(c, 'a', '2026-11-01').filter(f => f.goalId === 'weekly').length, 0); assert.equal(weeklyProgress(c, c.goals[1]!, 'a', '2026-10-29').done, 5); });
test('late membership has no historical debt and caps partial week target', () => { const c = fixture(); c.members[0]!.joined = '2026-10-30'; assert.equal(finesFor(c, 'a', '2026-10-30').length, 0); assert.equal(weeklyProgress(c, c.goals[1]!, 'a', '2026-10-30').target, 2); });
test('only today and yesterday within challenge and membership are editable', () => { const c = fixture(); assert.equal(canEdit(c, '2026-10-29', '2026-10-29', 'a'), true); assert.equal(canEdit(c, '2026-10-28', '2026-10-29', 'a'), true); assert.equal(canEdit(c, '2026-10-27', '2026-10-29', 'a'), false); assert.equal(canEdit(c, '2026-10-30', '2026-10-29', 'a'), false); assert.equal(canEdit(c, '2026-10-29', '2026-10-29', 'outsider'), false); c.members[0]!.joined = '2026-10-29'; assert.equal(canEdit(c, '2026-10-28', '2026-10-29', 'a'), false); });
test('challenge end caps daily charges and closes partial weekly target', () => { const c = fixture(); c.end = '2026-10-27'; assert.equal(finesFor(c, 'a', '2026-11-05').filter(f => f.goalId === 'daily').length, 3); assert.equal(finesFor(c, 'a', '2026-11-05').filter(f => f.goalId === 'weekly').length, 1); });
test('timezone midnight and calendar boundaries are deterministic', () => { assert.equal(todayIn('Asia/Kolkata', new Date('2026-10-28T18:30:00Z')), '2026-10-29'); assert.equal(todayIn('America/New_York', new Date('2026-10-28T18:30:00Z')), '2026-10-28'); assert.equal(addDays('2026-10-31', 1), '2026-11-01'); });
test('overview excludes pending today from consistency and requires all goals for a check-in', () => {
  const c = fixture(); const today = '2026-10-26';
  c.checkins.push({ userId: 'a', goalId: 'daily', date: '2026-10-25', done: true }, { userId: 'a', goalId: 'free', date: '2026-10-25', done: false });
  assert.equal(challengeOverview(c, today).consistency, 50);
  c.checkins.push({ userId: 'a', goalId: 'daily', date: today, done: false }, { userId: 'a', goalId: 'weekly', date: today, done: false });
  assert.equal(challengeOverview(c, today).checkedIn, 0);
  c.checkins.push({ userId: 'a', goalId: 'free', date: today, done: true });
  assert.equal(challengeOverview(c, today).checkedIn, 1);
  assert.equal(challengeOverview(c, today).consistency, 50);
});
test('overview handles upcoming, finished, late joins, and zero closed days', () => {
  const c = fixture(); assert.equal(challengeOverview(c, '2026-10-24').days.length, 0); assert.equal(challengeOverview(c, '2026-10-25').consistency, null);
  assert.equal(challengeOverview(c, '2026-11-08').daysLeft, 0);
  c.members.push({ id: 'late', name: 'Late', joined: '2026-10-27' }); assert.equal(challengeOverview(c, '2026-10-26').eligible, 1);
  const day = daySummary(c, 'a', '2026-10-25', '2026-10-26'); assert.equal(day.total, 3); assert.equal(day.fine, 100); assert.equal(day.editable, true);
});
