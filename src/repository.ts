import { Challenge, Checkin, Goal, Payment } from './domain';
import { supabase } from './supabase';
function client() { if (!supabase) throw new Error('Supabase is not configured. Add your project URL and publishable key to .env, then restart Expo.'); return supabase; }
function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }
export async function loadChallenges(): Promise<Challenge[]> {
  const { data, error } = await client().from('challenges').select('*, goals(*), members:challenge_members(*, profiles(display_name)), checkins(*), payments(*)').order('created_at'); fail(error);
  return (data ?? []).map((c: any) => ({ id: c.id, name: c.name, description: c.description, start: c.start_date, end: c.end_date, timezone: c.timezone, invite: c.invite_code, ownerId: c.owner_id,
    goals: c.goals.sort((a: any, b: any) => a.position - b.position).map((g: any) => ({ id: g.id, title: g.title, description: g.description, frequency: g.frequency, target: g.target, penalty: g.penalty, icon: g.icon, effectiveFrom: g.effective_from ?? undefined, effectiveTo: g.effective_to ?? undefined, revisions: g.revisions ?? [] })),
    members: c.members.map((m: any) => ({ id: m.user_id, name: m.profiles?.display_name ?? 'Friend', joined: m.joined_date })),
    checkins: c.checkins.map((x: any) => ({ goalId: x.goal_id, userId: x.user_id, date: x.check_date, done: x.done, note: x.note })),
    payments: c.payments.map((p: any) => ({ id: p.id, userId: p.user_id, amount: p.amount, date: p.payment_date, note: p.note })) }));
}
export async function createChallenge(input: { name: string; description: string; start: string; end: string; timezone: string; goals: Goal[] }) {
  const { data, error } = await client().rpc('create_challenge', { p_name: input.name, p_description: input.description, p_start: input.start, p_end: input.end, p_timezone: input.timezone, p_goals: input.goals }); fail(error); return data as string;
}
export async function joinChallenge(code: string) { const { data, error } = await client().rpc('join_challenge', { p_code: code.trim().toUpperCase() }); fail(error); return data as string; }
export async function saveCheckins(challengeId: string, entries: Checkin[], note: string) {
  const { error } = await client().rpc('save_checkin', { p_challenge: challengeId, p_date: entries[0]?.date, p_entries: entries.map(e => ({ goal_id: e.goalId, done: e.done })), p_note: note }); fail(error);
}
export async function recordPayment(challengeId: string, payment: Payment) { const { error } = await client().from('payments').insert({ challenge_id: challengeId, user_id: payment.userId, amount: payment.amount, payment_date: payment.date, note: payment.note }); fail(error); }
export async function configureChallenge(challengeId: string, input: { name: string; description: string; goals?: Goal[] }) {
  const { error } = await client().rpc('configure_challenge', { p_challenge: challengeId, p_name: input.name, p_description: input.description, p_goals: input.goals ?? null }); fail(error);
}
