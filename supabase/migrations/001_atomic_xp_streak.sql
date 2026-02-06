-- Atomic XP increment (prevents race conditions)
create or replace function public.add_xp(p_user_id uuid, p_amount int)
returns json as $$
declare
  v_old_level int;
  v_new_xp int;
  v_new_level int;
begin
  select xp, level into v_new_xp, v_old_level
    from profiles where id = p_user_id for update;

  v_new_xp := v_new_xp + p_amount;
  v_new_level := floor(sqrt(v_new_xp / 100.0)) + 1;

  update profiles
    set xp = v_new_xp, level = v_new_level
    where id = p_user_id;

  return json_build_object(
    'new_xp', v_new_xp,
    'new_level', v_new_level,
    'level_up', v_new_level > v_old_level
  );
end;
$$ language plpgsql security invoker set search_path = '';

-- Atomic streak update (prevents race conditions)
create or replace function public.update_streak(p_user_id uuid)
returns json as $$
declare
  v_current_streak int;
  v_longest_streak int;
  v_last_read date;
  v_today date := current_date;
  v_yesterday date := current_date - 1;
  v_new_streak int;
  v_is_new boolean;
begin
  select current_streak, longest_streak, last_read_date
    into v_current_streak, v_longest_streak, v_last_read
    from profiles where id = p_user_id for update;

  if v_last_read = v_today then
    return json_build_object('new_streak', v_current_streak, 'is_new', false);
  elsif v_last_read = v_yesterday then
    v_new_streak := v_current_streak + 1;
  else
    v_new_streak := 1;
  end if;

  v_longest_streak := greatest(v_new_streak, v_longest_streak);

  update profiles
    set current_streak = v_new_streak,
        longest_streak = v_longest_streak,
        last_read_date = v_today
    where id = p_user_id;

  return json_build_object('new_streak', v_new_streak, 'is_new', true);
end;
$$ language plpgsql security invoker set search_path = '';
