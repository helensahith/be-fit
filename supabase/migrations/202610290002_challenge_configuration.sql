-- Metadata is owner-editable; goal changes are permitted only before the first day.
create function public.configure_challenge(p_challenge uuid, p_name text, p_description text, p_goals jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.challenges; g jsonb; pos int := 0;
begin
 select * into c from public.challenges where id=p_challenge for update;
 if not found or auth.uid() is null or c.owner_id <> auth.uid() then raise exception 'Only the challenge creator can change configuration'; end if;
 if p_goals is not null then
  if (now() at time zone c.timezone)::date >= c.start_date then raise exception 'Goals and penalties are locked after the challenge starts'; end if;
  if jsonb_typeof(p_goals) <> 'array' or jsonb_array_length(p_goals) not between 1 and 20 then raise exception 'Add between 1 and 20 goals'; end if;
  delete from public.goals where challenge_id=c.id;
  for g in select * from jsonb_array_elements(p_goals) loop
   insert into public.goals(challenge_id,title,description,frequency,target,penalty,icon,position)
   values(c.id,trim(g->>'title'),coalesce(g->>'description',''),g->>'frequency',(g->>'target')::int,(g->>'penalty')::int,coalesce(g->>'icon','fitness-outline'),pos);
   pos := pos + 1;
  end loop;
 end if;
 update public.challenges set name=trim(p_name),description=p_description where id=c.id;
end $$;
revoke all on function public.configure_challenge(uuid,text,text,jsonb) from public;
grant execute on function public.configure_challenge(uuid,text,text,jsonb) to authenticated;
