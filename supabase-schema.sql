-- Enable extensions
create extension if not exists "uuid-ossp";

-- Book status enum
create type book_status as enum ('reading', 'finished', 'paused', 'want');

-- Note source enum
create type note_source as enum ('voice', 'manual');

-- Profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  xp integer default 0,
  level integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_read_date date,
  telegram_chat_id bigint unique,
  telegram_link_code text unique,
  created_at timestamptz default now()
);

-- Books table
create table books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  author text,
  total_pages integer,
  current_page integer default 0,
  cover_url text,
  status book_status default 'want',
  started_at date,
  finished_at date,
  created_at timestamptz default now()
);

-- Reading sessions
create table reading_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  pages_read integer not null,
  duration_minutes integer,
  date date default current_date,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

-- Notes
create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete set null,
  raw_transcription text,
  formatted_text text,
  manual_text text,
  voice_file_url text,
  source note_source default 'manual',
  page_reference integer,
  created_at timestamptz default now()
);

-- Achievements
create table achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  name text not null,
  description text,
  icon text,
  earned_at timestamptz default now(),
  unique(user_id, type)
);

-- Review cards (spaced repetition)
create table review_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  note_id uuid references notes(id) on delete cascade,
  book_id uuid references books(id) on delete set null,
  question text not null,
  answer text not null,
  ease_factor real default 2.5,
  interval_days integer default 1,
  repetitions integer default 0,
  next_review date default current_date,
  created_at timestamptz default now()
);

-- Indexes
create index idx_books_user_id on books(user_id);
create index idx_books_status on books(user_id, status);
create index idx_reading_sessions_user_id on reading_sessions(user_id);
create index idx_reading_sessions_date on reading_sessions(user_id, date);
create index idx_notes_user_id on notes(user_id);
create index idx_notes_book_id on notes(book_id);
create index idx_review_cards_next_review on review_cards(user_id, next_review);
create index idx_achievements_user_id on achievements(user_id);
create index idx_profiles_telegram on profiles(telegram_chat_id);
create index idx_notes_user_created on notes(user_id, created_at desc);
create index idx_reading_sessions_user_date on reading_sessions(user_id, date desc);

-- RLS Policies
alter table profiles enable row level security;
alter table books enable row level security;
alter table reading_sessions enable row level security;
alter table notes enable row level security;
alter table achievements enable row level security;
alter table review_cards enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Books: users can CRUD their own books
create policy "Users can view own books" on books for select using (auth.uid() = user_id);
create policy "Users can insert own books" on books for insert with check (auth.uid() = user_id);
create policy "Users can update own books" on books for update using (auth.uid() = user_id);
create policy "Users can delete own books" on books for delete using (auth.uid() = user_id);

-- Reading sessions
create policy "Users can view own sessions" on reading_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on reading_sessions for insert with check (auth.uid() = user_id);

-- Notes
create policy "Users can view own notes" on notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes" on notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on notes for delete using (auth.uid() = user_id);

-- Achievements
create policy "Users can view own achievements" on achievements for select using (auth.uid() = user_id);
create policy "Users can insert own achievements" on achievements for insert with check (auth.uid() = user_id);

-- Review cards
create policy "Users can view own cards" on review_cards for select using (auth.uid() = user_id);
create policy "Users can insert own cards" on review_cards for insert with check (auth.uid() = user_id);
create policy "Users can update own cards" on review_cards for update using (auth.uid() = user_id);
create policy "Users can delete own cards" on review_cards for delete using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
