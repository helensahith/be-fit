import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('migration, authentication boundaries, invite membership, and check-in write rules', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create role anon; create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to authenticated; grant execute on function auth.uid() to authenticated;`);
    await db.exec(readFileSync(new URL('../supabase/migrations/202610290001_initial.sql', import.meta.url), 'utf8'));
    await db.exec(readFileSync(new URL('../supabase/migrations/202610290002_challenge_configuration.sql', import.meta.url), 'utf8'));
    await db.exec(readFileSync(new URL('../supabase/migrations/202610290003_forward_goal_rules.sql', import.meta.url), 'utf8'));
    // Hosted Supabase can grant these roles EXECUTE directly, beyond PUBLIC.
    await db.exec('grant execute on all functions in schema public to anon, authenticated');
    await db.exec(readFileSync(new URL('../supabase/migrations/20261101152713_restrict_rpc_access.sql', import.meta.url), 'utf8'));
    const privileges = (await db.query<{ anonymous: boolean; member: boolean; trigger: boolean }>(`select
      has_function_privilege('anon','public.join_challenge(text)','execute') as anonymous,
      has_function_privilege('authenticated','public.join_challenge(text)','execute') as member,
      has_function_privilege('authenticated','public.handle_new_user()','execute') as trigger`)).rows[0];
    assert.deepEqual(privileges, { anonymous: false, member: true, trigger: false });
    const a = '10000000-0000-4000-8000-000000000001', b = '10000000-0000-4000-8000-000000000002', outsider = '10000000-0000-4000-8000-000000000003';
    await db.query(`insert into auth.users values($1,'a@example.com','{"display_name":"A"}'),($2,'b@example.com','{"display_name":"B"}'),($3,'c@example.com','{}')`, [a, b, outsider]);
    async function asUser(id: string) { await db.exec('reset role'); await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [id]); await db.exec('set role authenticated'); }
    const scalar = async (sql: string, params: any[] = []) => (await db.query<any>(sql, params)).rows[0]!;
    const { today } = await scalar(`select (now() at time zone 'Asia/Kolkata')::date::text as today`);
    await asUser(a);
    const { id } = await scalar(`select public.create_challenge('A pact','Testing',$1::date,$1::date+14,'Asia/Kolkata',$2::jsonb) as id`, [today, JSON.stringify([{ title: 'Walk', description: '', frequency: 'daily', target: 1, penalty: 100, icon: 'walk-outline' }])]);
    const { invite_code } = await scalar('select invite_code from public.challenges where id=$1', [id]);
    const { id: goalId } = await scalar('select id from public.goals where challenge_id=$1', [id]);
    await asUser(outsider);
    assert.equal((await db.query('select * from public.challenges')).rows.length, 0);
    assert.equal((await db.query('select * from public.goals')).rows.length, 0);
    assert.equal((await db.query('select * from public.profiles where id=$1', [a])).rows.length, 0);
    await assert.rejects(() => db.query(`select public.save_checkin($1,$2::date,$3::jsonb,'')`, [id, today, JSON.stringify([{ goal_id: goalId, done: true }])]), /Join this challenge first/);
    await assert.rejects(() => db.query('select public.join_challenge($1)', ['BADCODE']), /Invite code not found/);
    await asUser(b);
    await db.query('select public.join_challenge($1)', [invite_code]);
    await db.query('select public.join_challenge($1)', [invite_code]);
    await assert.rejects(() => db.query(`select public.configure_challenge($1,'Changed','',null)`, [id]), /Only the challenge creator/);
    assert.equal((await db.query('select * from public.challenge_members where challenge_id=$1', [id])).rows.length, 2);
    assert.equal((await db.query('select * from public.profiles where id=$1', [a])).rows.length, 1);
    await db.query(`select public.save_checkin($1,$2::date,$3::jsonb,'A win')`, [id, today, JSON.stringify([{ goal_id: goalId, done: true }])]);
    await db.query(`select public.save_checkin($1,$2::date,$3::jsonb,'A correction')`, [id, today, JSON.stringify([{ goal_id: goalId, done: false }])]);
    const entries = (await db.query<any>('select * from public.checkins where challenge_id=$1', [id])).rows;
    assert.equal(entries.length, 1); assert.equal(entries[0]!.done, false); assert.equal(entries[0]!.user_id, b);
    await assert.rejects(() => db.query(`select public.save_checkin($1,$2::date-2,$3::jsonb,'')`, [id, today, JSON.stringify([{ goal_id: goalId, done: true }])]), /Only today and yesterday/);
    await assert.rejects(() => db.query(`insert into public.payments(challenge_id,user_id,amount) values($1,$2,25)`, [id, a]), /row-level security/);
    await db.query(`insert into public.payments(challenge_id,user_id,amount) values($1,$2,25)`, [id, b]);
    assert.equal((await db.query('select * from public.payments')).rows.length, 1);
    await assert.rejects(() => db.query(`insert into public.checkins(challenge_id,goal_id,user_id,check_date,done) values($1,$2,$3,$4,true)`, [id, goalId, a, today]), /permission denied|row-level security/);
    await assert.rejects(() => db.query('delete from public.goals where id=$1', [goalId]), /permission denied|row-level security/);
    await asUser(a);
    await db.query(`select public.configure_challenge($1,'Renamed pact','Updated description',null)`, [id]);
    assert.equal((await scalar('select name from public.challenges where id=$1', [id])).name, 'Renamed pact');
    await db.query(`select public.configure_challenge($1,'Renamed pact','',$2::jsonb)`, [id, JSON.stringify([{ id: goalId, title: 'Changed penalty', frequency: 'daily', target: 1, penalty: 999 }])]);
    const original = await scalar('select title,penalty,revisions from public.goals where id=$1', [goalId]);
    assert.equal(original.penalty, 100); assert.equal(original.title, 'Walk');
    assert.equal(original.revisions[0].penalty, 999);
    const todayRule = await scalar('select public.goal_rule_at(g,$2::date) as rule from public.goals g where id=$1', [goalId, today]);
    const tomorrowRule = await scalar('select public.goal_rule_at(g,$2::date+1) as rule from public.goals g where id=$1', [goalId, today]);
    assert.equal(todayRule.rule.penalty, 100); assert.equal(tomorrowRule.rule.penalty, 999);
    assert.equal((await db.query('select * from public.checkins where goal_id=$1', [goalId])).rows.length, 1, 'Historical check-ins survive a rule edit');
    const nextWeekly = { id: goalId, title: 'Walk weekly', frequency: 'weekly', target: 3, penalty: 90 };
    const newDaily = { id: 'temporary-new', title: 'Water', frequency: 'daily', target: 1, penalty: 20 };
    await db.query(`select public.configure_challenge($1,'Renamed pact','',$2::jsonb)`, [id, JSON.stringify([nextWeekly, newDaily])]);
    const { next_sunday } = await scalar(`select ($1::date+(7-extract(dow from $1::date)::int))::text as next_sunday`, [today]);
    const scheduled = await scalar('select revisions from public.goals where id=$1', [goalId]);
    assert.ok(scheduled.revisions.some((r: any) => r.effectiveFrom === next_sunday && r.target === 3 && r.penalty === 90));
    assert.equal((await scalar('select public.goal_rule_at(g,$2::date) as rule from public.goals g where id=$1', [goalId, today])).rule.frequency, 'daily');
    const { id: waterId } = await scalar(`select id from public.goals where challenge_id=$1 and title='Water'`, [id]);
    await assert.rejects(() => db.query(`select public.save_checkin($1,$2::date,$3::jsonb,'')`, [id, today, JSON.stringify([{ goal_id: waterId, done: true }])]), /Goal does not apply on this date/);
    await db.query(`select public.configure_challenge($1,'Renamed pact','',$2::jsonb)`, [id, JSON.stringify([{ ...newDaily, id: waterId }])]);
    const retired = await scalar('select effective_to::text as ends,revisions from public.goals where id=$1', [goalId]);
    assert.equal(retired.ends, today); assert.equal(retired.revisions.length, 0, 'Retirement removes unapplied revisions, not historical check-ins');
    assert.equal((await db.query('select * from public.checkins where goal_id=$1', [goalId])).rows.length, 1);
    const { id: futureId } = await scalar(`select public.create_challenge('Future pact','',$1::date+1,$1::date+14,'Asia/Kolkata',$2::jsonb) as id`, [today, JSON.stringify([{ title: 'Walk', frequency: 'daily', target: 1, penalty: 100 }])]);
    await db.query(`select public.configure_challenge($1,'Future pact','',$2::jsonb)`, [futureId, JSON.stringify([{ title: 'Cycle', frequency: 'weekly', target: 3, penalty: 25 }])]);
    const updatedGoal = await scalar('select title,penalty,target from public.goals where challenge_id=$1', [futureId]);
    assert.deepEqual(updatedGoal, { title: 'Cycle', penalty: 25, target: 3 });
    await assert.rejects(() => db.query(`select public.configure_challenge($1,'Future pact','',$2::jsonb)`, [futureId, JSON.stringify([{ title: 'Invalid', frequency: 'weekly', target: 8, penalty: -5 }])]), /Invalid goal/);
    assert.equal((await scalar('select title from public.goals where challenge_id=$1', [futureId])).title, 'Cycle', 'Invalid configuration is atomic and preserves existing rules');
  } finally { await db.close(); }
});
