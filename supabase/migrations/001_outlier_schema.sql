-- OutlierOS Schema Migration
-- Run in Supabase SQL Editor

-- ─── User Profiles ───────────────────────────────────────────────────────────

create table if not exists outlier_user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) unique,
  work_email text unique not null,
  full_name text,
  role text check (role in ('admin', 'department', 'area_manager', 'director')),
  region text,
  area text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  last_login_at timestamptz
);

-- ─── AM Locations ────────────────────────────────────────────────────────────

create table if not exists outlier_am_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references outlier_user_profiles(id) on delete cascade,
  location_id text not null,
  location_name text
);

-- ─── Departments ─────────────────────────────────────────────────────────────

create table if not exists outlier_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  sort_order int default 0
);

-- ─── Reports ─────────────────────────────────────────────────────────────────

create table if not exists outlier_reports (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references outlier_departments(id),
  name text not null,
  slug text unique not null,
  description text,
  columns jsonb not null default '[]',
  is_employee_report boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ─── Weeks ───────────────────────────────────────────────────────────────────

create table if not exists outlier_weeks (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  label text,
  created_at timestamptz default now(),
  unique(week_start)
);

-- ─── Report Entries ───────────────────────────────────────────────────────────

create table if not exists outlier_report_entries (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references outlier_reports(id),
  week_id uuid references outlier_weeks(id),
  row_key text not null,
  row_label text not null,
  row_type text default 'data',
  data jsonb not null default '{}',
  am_comment text,
  am_comment_updated_at timestamptz,
  am_comment_updated_by uuid references outlier_user_profiles(id),
  due_date date,
  is_complete boolean default false,
  submitted_by uuid references outlier_user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(report_id, week_id, row_key)
);

-- ─── Paste Logs ──────────────────────────────────────────────────────────────

create table if not exists outlier_paste_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references outlier_reports(id),
  week_id uuid references outlier_weeks(id),
  raw_text text,
  parsed_row_count int,
  submitted_by uuid references outlier_user_profiles(id),
  created_at timestamptz default now()
);

-- ─── Enable Realtime ─────────────────────────────────────────────────────────

alter publication supabase_realtime add table outlier_report_entries;

-- ─── Auto-link trigger ───────────────────────────────────────────────────────

create or replace function outlier_link_auth_user()
returns trigger language plpgsql security definer as $$
begin
  update outlier_user_profiles
  set
    auth_user_id = new.id,
    last_login_at = now(),
    full_name = coalesce(full_name, new.raw_user_meta_data->>'full_name')
  where
    work_email = new.email
    and auth_user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_login on auth.users;
create trigger on_auth_user_login
  after insert or update on auth.users
  for each row execute procedure outlier_link_auth_user();
