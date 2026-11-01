-- Mirror the migration applied to the hosted project. Supabase default privileges
-- can grant anon access directly, independently of the PUBLIC role.
revoke execute on all functions in schema public from anon;
revoke execute on function public.handle_new_user() from authenticated;
