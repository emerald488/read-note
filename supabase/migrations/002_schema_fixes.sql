-- Add UNIQUE constraint on achievements to prevent duplicates from race conditions
alter table achievements add constraint achievements_user_type_unique unique(user_id, type);

-- Add missing indexes for common query patterns
create index concurrently if not exists idx_notes_user_created on notes(user_id, created_at desc);
create index concurrently if not exists idx_reading_sessions_user_date on reading_sessions(user_id, date desc);

-- Fix search_path in handle_new_user trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = '';
