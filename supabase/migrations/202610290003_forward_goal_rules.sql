-- Keep goal IDs and historical check-ins stable. Future rule snapshots live on the goal.
alter table public.goals add column effective_from date;
alter table public.goals add column effective_to date;
alter table public.goals add column revisions jsonb not null default '[]'::jsonb check(jsonb_typeof(revisions)='array');
alter table public.goals add constraint goal_effective_dates check(effective_to is null or effective_to >= coalesce(effective_from, '0001-01-01'::date));

create function public.goal_rule_at(p_goal public.goals, p_date date) returns jsonb
language sql stable set search_path = '' as $$
 select jsonb_build_object('title',p_goal.title,'description',p_goal.description,'frequency',p_goal.frequency,
   'target',p_goal.target,'penalty',p_goal.penalty,'icon',p_goal.icon)
 || coalesce((select value - 'effectiveFrom' from jsonb_array_elements(p_goal.revisions)
   where (value->>'effectiveFrom')::date <= p_date order by (value->>'effectiveFrom')::date desc limit 1),'{}'::jsonb)
$$;

create or replace function public.configure_challenge(p_challenge uuid,p_name text,p_description text,p_goals jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.challenges; old public.goals; g jsonb; desired jsonb; current_rule jsonb; planned jsonb;
 local_today date; starts date; pos int := 0; submitted uuid[] := '{}'; new_id uuid;
begin
 select * into c from public.challenges where id=p_challenge for update;
 if not found or auth.uid() is null or c.owner_id <> auth.uid() then raise exception 'Only the challenge creator can change configuration'; end if;
 local_today := (now() at time zone c.timezone)::date;
 if p_goals is not null then
  if local_today > c.end_date then raise exception 'This challenge has ended. Its rules cannot be changed'; end if;
  if jsonb_typeof(p_goals) <> 'array' or jsonb_array_length(p_goals) not between 1 and 20 then raise exception 'Keep between 1 and 20 goals'; end if;
  for g in select * from jsonb_array_elements(p_goals) loop
   desired := jsonb_build_object('title',trim(g->>'title'),'description',coalesce(g->>'description',''),
    'frequency',g->>'frequency','target',(g->>'target')::int,'penalty',(g->>'penalty')::int,'icon',coalesce(g->>'icon','fitness-outline'));
   if desired->>'title' is null or length(desired->>'title') not between 1 and 100
    or length(desired->>'description') > 500 or desired->>'frequency' is null or desired->>'frequency' not in ('daily','weekly')
    or desired->>'target' is null or (desired->>'target')::int not between 1 and 7
    or desired->>'penalty' is null or (desired->>'penalty')::int not between 0 and 100000 then raise exception 'Invalid goal: check the name, frequency, target and penalty'; end if;
   select * into old from public.goals where challenge_id=c.id and id::text=g->>'id';
   if found then
    if old.id=any(submitted) then raise exception 'A goal cannot appear twice'; end if;
    submitted := array_append(submitted,old.id);
    if old.effective_to < local_today then raise exception 'Retired goals cannot be restored retroactively. Add a new goal instead'; end if;
    planned := public.goal_rule_at(old,c.end_date);
    if planned=desired and old.effective_to is null then pos := pos+1; continue; end if;
    current_rule := case when coalesce(old.effective_from,c.start_date)<=local_today then public.goal_rule_at(old,local_today) else null end;
   else current_rule := null; end if;
   starts := case when local_today<c.start_date then c.start_date
    when desired->>'frequency'='weekly' or current_rule->>'frequency'='weekly' then local_today+(7-extract(dow from local_today)::int)
    else local_today+1 end;
   if starts>c.end_date then raise exception 'This rule would start after the challenge ends'; end if;
   if old.id is null then
    insert into public.goals(challenge_id,title,description,frequency,target,penalty,icon,position,effective_from)
     values(c.id,desired->>'title',desired->>'description',desired->>'frequency',(desired->>'target')::int,(desired->>'penalty')::int,desired->>'icon',pos,starts) returning id into new_id;
    submitted := array_append(submitted,new_id);
   elsif local_today<c.start_date or coalesce(old.effective_from,c.start_date)>local_today then
    update public.goals set title=desired->>'title',description=desired->>'description',frequency=desired->>'frequency',target=(desired->>'target')::int,
     penalty=(desired->>'penalty')::int,icon=desired->>'icon',effective_from=starts,effective_to=null,revisions='[]',position=pos where id=old.id;
   else
    update public.goals set revisions=coalesce((select jsonb_agg(value order by value->>'effectiveFrom') from jsonb_array_elements(old.revisions)
     where (value->>'effectiveFrom')::date<starts),'[]'::jsonb) || jsonb_build_array(desired || jsonb_build_object('effectiveFrom',starts::text)),
     effective_to=null where id=old.id;
   end if;
   pos := pos+1;
  end loop;
  for old in select * from public.goals where challenge_id=c.id and not(id=any(submitted)) and (effective_to is null or effective_to>=local_today) loop
   if local_today<c.start_date or coalesce(old.effective_from,c.start_date)>local_today then delete from public.goals where id=old.id;
   else
    current_rule := public.goal_rule_at(old,local_today);
    starts := case when current_rule->>'frequency'='weekly' then local_today+(7-extract(dow from local_today)::int) else local_today+1 end;
    if starts>c.end_date then raise exception 'This removal would start after the challenge ends'; end if;
    update public.goals set effective_to=starts-1,revisions=coalesce((select jsonb_agg(value order by value->>'effectiveFrom') from jsonb_array_elements(old.revisions)
      where (value->>'effectiveFrom')::date<starts),'[]'::jsonb) where id=old.id;
   end if;
  end loop;
  if exists(select 1 from generate_series(greatest(c.start_date,local_today)::timestamp,c.end_date::timestamp,interval '1 day') d
   where (select count(*) from public.goals where challenge_id=c.id and d::date>=coalesce(effective_from,c.start_date) and d::date<=coalesce(effective_to,c.end_date)) not between 1 and 20)
   then raise exception 'Keep between 1 and 20 active goals on every challenge day, including the transition'; end if;
 end if;
 update public.challenges set name=trim(p_name),description=p_description where id=c.id;
end $$;

-- Enforce rule applicability on the server as well as in the interface.
create or replace function public.save_checkin(p_challenge uuid,p_date date,p_entries jsonb,p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.challenges; local_today date; joined date; e jsonb;
begin
 if not public.is_member(p_challenge) then raise exception 'Join this challenge first'; end if;
 select * into strict c from public.challenges where id=p_challenge for share;
 select joined_date into joined from public.challenge_members where challenge_id=p_challenge and user_id=auth.uid();
 local_today := (now() at time zone c.timezone)::date;
 if p_date is null or p_date<greatest(c.start_date,joined,local_today-1) or p_date>least(c.end_date,local_today) then raise exception 'Only today and yesterday can be edited'; end if;
 if jsonb_typeof(p_entries)<>'array' or jsonb_array_length(p_entries)>20 then raise exception 'Invalid check-in'; end if;
 for e in select * from jsonb_array_elements(p_entries) loop
  if not exists(select 1 from public.goals where id=(e->>'goal_id')::uuid and challenge_id=p_challenge
   and p_date>=coalesce(effective_from,c.start_date) and p_date<=coalesce(effective_to,c.end_date)) then raise exception 'Goal does not apply on this date'; end if;
  insert into public.checkins(challenge_id,goal_id,user_id,check_date,done,note)
   values(p_challenge,(e->>'goal_id')::uuid,auth.uid(),p_date,(e->>'done')::boolean,p_note)
   on conflict(goal_id,user_id,check_date) do update set done=excluded.done,note=excluded.note,updated_at=now();
 end loop;
end $$;
revoke all on function public.goal_rule_at(public.goals,date) from public;
grant execute on function public.goal_rule_at(public.goals,date) to authenticated;
