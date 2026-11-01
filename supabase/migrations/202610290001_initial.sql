-- Apply once using the Supabase SQL editor or `supabase db push`.

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(display_name) between 1 and 80)
);
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id, display_name) values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1), 'Friend'), 80));
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.challenges (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 name text not null check (length(trim(name)) between 1 and 80), description text not null default '' check(length(description) <= 500),
 start_date date not null, end_date date not null, timezone text not null default 'Asia/Kolkata',
 invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
 created_at timestamptz not null default now(), check(end_date >= start_date and end_date <= start_date + 365)
);
create table public.challenge_members (
 challenge_id uuid not null references public.challenges(id) on delete cascade,
 user_id uuid not null references public.profiles(id), joined_date date not null,
 primary key(challenge_id, user_id)
);
create table public.goals (
 id uuid primary key default gen_random_uuid(), challenge_id uuid not null references public.challenges(id) on delete cascade,
 title text not null check(length(trim(title)) between 1 and 100), description text not null default '' check(length(description) <= 500),
 frequency text not null check(frequency in ('daily','weekly')), target int not null default 1 check(target between 1 and 7),
 penalty int not null default 0 check(penalty between 0 and 100000), icon text not null default 'fitness-outline', position int not null,
 unique(challenge_id, id)
);
create table public.checkins (
 challenge_id uuid not null references public.challenges(id) on delete cascade, goal_id uuid not null, user_id uuid not null, check_date date not null,
 done boolean not null, note text not null default '' check(length(note) <= 500), updated_at timestamptz not null default now(),
 primary key(goal_id, user_id, check_date),
 foreign key(challenge_id, goal_id) references public.goals(challenge_id,id),
 foreign key(challenge_id, user_id) references public.challenge_members(challenge_id,user_id)
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), challenge_id uuid not null references public.challenges(id) on delete cascade, user_id uuid not null,
 amount int not null check(amount between 1 and 10000000), payment_date date not null default current_date,
 note text not null default '' check(length(note) <= 500), created_at timestamptz not null default now(),
 foreign key(challenge_id,user_id) references public.challenge_members(challenge_id,user_id)
);
create index checkins_challenge_idx on public.checkins(challenge_id,check_date);
create index members_user_idx on public.challenge_members(user_id);
create index payments_challenge_idx on public.payments(challenge_id);

create function public.is_member(p_challenge uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.challenge_members where challenge_id = p_challenge and user_id = auth.uid())
$$;
create function public.shares_group(p_user uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select p_user = auth.uid() or exists(select 1 from public.challenge_members a join public.challenge_members b using(challenge_id) where a.user_id=auth.uid() and b.user_id=p_user)
$$;
alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.goals enable row level security;
alter table public.checkins enable row level security;
alter table public.payments enable row level security;
create policy profile_read on public.profiles for select to authenticated using(public.shares_group(id));
create policy challenge_read on public.challenges for select to authenticated using(public.is_member(id));
create policy member_read on public.challenge_members for select to authenticated using(public.is_member(challenge_id));
create policy goal_read on public.goals for select to authenticated using(public.is_member(challenge_id));
create policy checkin_read on public.checkins for select to authenticated using(public.is_member(challenge_id));
create policy payment_read on public.payments for select to authenticated using(public.is_member(challenge_id));
create policy payment_insert on public.payments for insert to authenticated with check(user_id = auth.uid() and public.is_member(challenge_id));
-- Goals and membership cannot be changed through direct client writes.

create function public.create_challenge(p_name text, p_description text, p_start date, p_end date, p_timezone text, p_goals jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid; g jsonb; pos int := 0; local_today date;
begin
 if auth.uid() is null then raise exception 'Sign in to create a challenge'; end if;
 if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'Choose a valid timezone'; end if;
 local_today := (now() at time zone p_timezone)::date;
 if p_start < local_today then raise exception 'Start date cannot be in the past'; end if;
 if jsonb_typeof(p_goals) <> 'array' or jsonb_array_length(p_goals) not between 1 and 20 then raise exception 'Add between 1 and 20 goals'; end if;
 insert into public.challenges(owner_id,name,description,start_date,end_date,timezone) values(auth.uid(),trim(p_name),p_description,p_start,p_end,p_timezone) returning id into cid;
 insert into public.challenge_members values(cid,auth.uid(),greatest(p_start,local_today));
 for g in select * from jsonb_array_elements(p_goals) loop
  insert into public.goals(challenge_id,title,description,frequency,target,penalty,icon,position) values(cid,trim(g->>'title'),coalesce(g->>'description',''),g->>'frequency',(g->>'target')::int,(g->>'penalty')::int,coalesce(g->>'icon','fitness-outline'),pos);
  pos := pos + 1;
 end loop;
 return cid;
end $$;
create function public.join_challenge(p_code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare c public.challenges; local_today date;
begin
 if auth.uid() is null then raise exception 'Sign in to join a challenge'; end if;
 select * into c from public.challenges where invite_code=upper(trim(p_code));
 if not found then raise exception 'Invite code not found. Ask your friend to check it.'; end if;
 local_today := (now() at time zone c.timezone)::date;
 if c.end_date < local_today then raise exception 'This challenge has ended'; end if;
 insert into public.challenge_members values(c.id,auth.uid(),greatest(c.start_date,local_today)) on conflict do nothing;
 return c.id;
end $$;
create function public.save_checkin(p_challenge uuid,p_date date,p_entries jsonb,p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.challenges; local_today date; joined date; e jsonb;
begin
 if not public.is_member(p_challenge) then raise exception 'Join this challenge first'; end if;
 select * into strict c from public.challenges where id=p_challenge;
 select joined_date into joined from public.challenge_members where challenge_id=p_challenge and user_id=auth.uid();
 local_today := (now() at time zone c.timezone)::date;
 if p_date is null or p_date < greatest(c.start_date,joined,local_today-1) or p_date > least(c.end_date,local_today) then raise exception 'Only today and yesterday can be edited'; end if;
 if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) > 20 then raise exception 'Invalid check-in'; end if;
 for e in select * from jsonb_array_elements(p_entries) loop
  if not exists(select 1 from public.goals where id=(e->>'goal_id')::uuid and challenge_id=p_challenge) then raise exception 'Goal does not belong to this challenge'; end if;
  insert into public.checkins(challenge_id,goal_id,user_id,check_date,done,note) values(p_challenge,(e->>'goal_id')::uuid,auth.uid(),p_date,(e->>'done')::boolean,p_note)
  on conflict(goal_id,user_id,check_date) do update set done=excluded.done,note=excluded.note,updated_at=now();
 end loop;
end $$;
-- Private-by-default RPC access. No service role key is used by the client.
revoke all on function public.handle_new_user() from public;
revoke all on function public.is_member(uuid), public.shares_group(uuid), public.create_challenge(text,text,date,date,text,jsonb), public.join_challenge(text), public.save_checkin(uuid,date,jsonb,text) from public;
grant execute on function public.is_member(uuid), public.shares_group(uuid), public.create_challenge(text,text,date,date,text,jsonb), public.join_challenge(text), public.save_checkin(uuid,date,jsonb,text) to authenticated;
grant select on public.profiles,public.challenges,public.challenge_members,public.goals,public.checkins,public.payments to authenticated;
grant insert on public.payments to authenticated;
