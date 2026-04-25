-- =====================================================
-- BallPark: 午前/午後 出欠ステータス追加マイグレーション
-- =====================================================
-- ※ Supabase SQL Editor にコピペして実行してください

-- 1. 選手出欠に午前/午後ステータスを追加
alter table attendances add column if not exists morning_status text;
alter table attendances add column if not exists afternoon_status text;

update attendances
set
  morning_status = coalesce(morning_status, status),
  afternoon_status = coalesce(afternoon_status, status);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'attendances_morning_status_check'
  ) then
    alter table attendances
      add constraint attendances_morning_status_check
      check (morning_status in ('attend', 'absent', 'undecided')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'attendances_afternoon_status_check'
  ) then
    alter table attendances
      add constraint attendances_afternoon_status_check
      check (afternoon_status in ('attend', 'absent', 'undecided')) not valid;
  end if;
end $$;

alter table attendances validate constraint attendances_morning_status_check;
alter table attendances validate constraint attendances_afternoon_status_check;

-- 2. スタッフ出欠に午前/午後ステータスを追加
alter table staff_attendances add column if not exists morning_status text;
alter table staff_attendances add column if not exists afternoon_status text;

update staff_attendances
set
  morning_status = coalesce(morning_status, status),
  afternoon_status = coalesce(afternoon_status, status);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'staff_attendances_morning_status_check'
  ) then
    alter table staff_attendances
      add constraint staff_attendances_morning_status_check
      check (morning_status in ('attend', 'absent', 'undecided')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'staff_attendances_afternoon_status_check'
  ) then
    alter table staff_attendances
      add constraint staff_attendances_afternoon_status_check
      check (afternoon_status in ('attend', 'absent', 'undecided')) not valid;
  end if;
end $$;

alter table staff_attendances validate constraint staff_attendances_morning_status_check;
alter table staff_attendances validate constraint staff_attendances_afternoon_status_check;
