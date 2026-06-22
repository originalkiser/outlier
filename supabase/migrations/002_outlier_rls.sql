-- OutlierOS Row-Level Security Policies

-- ─── Helper functions ─────────────────────────────────────────────────────────

create or replace function outlier_current_user_role()
returns text language sql security definer stable as $$
  select role from outlier_user_profiles where auth_user_id = auth.uid()
$$;

create or replace function outlier_current_user_profile_id()
returns uuid language sql security definer stable as $$
  select id from outlier_user_profiles where auth_user_id = auth.uid()
$$;

create or replace function outlier_current_user_location_ids()
returns setof text language sql security definer stable as $$
  select location_id from outlier_am_locations
  where user_id = (select id from outlier_user_profiles where auth_user_id = auth.uid())
$$;

-- ─── Enable RLS ──────────────────────────────────────────────────────────────

alter table outlier_user_profiles      enable row level security;
alter table outlier_am_locations       enable row level security;
alter table outlier_departments        enable row level security;
alter table outlier_reports            enable row level security;
alter table outlier_weeks              enable row level security;
alter table outlier_report_entries     enable row level security;
alter table outlier_paste_logs         enable row level security;

-- ─── outlier_user_profiles ───────────────────────────────────────────────────

create policy "profiles_admin_all" on outlier_user_profiles
  for all using (outlier_current_user_role() = 'admin');

create policy "profiles_own_select" on outlier_user_profiles
  for select using (auth_user_id = auth.uid());

-- ─── outlier_am_locations ─────────────────────────────────────────────────────

create policy "am_locations_admin_all" on outlier_am_locations
  for all using (outlier_current_user_role() = 'admin');

create policy "am_locations_own_select" on outlier_am_locations
  for select using (user_id = outlier_current_user_profile_id());

-- ─── Shared read tables (departments, reports, weeks) ────────────────────────

create policy "departments_all_read" on outlier_departments
  for select using (auth.uid() is not null);

create policy "departments_admin_write" on outlier_departments
  for all using (outlier_current_user_role() = 'admin');

create policy "reports_all_read" on outlier_reports
  for select using (auth.uid() is not null);

create policy "reports_admin_write" on outlier_reports
  for all using (outlier_current_user_role() = 'admin');

create policy "weeks_all_read" on outlier_weeks
  for select using (auth.uid() is not null);

create policy "weeks_dept_write" on outlier_weeks
  for insert using (outlier_current_user_role() in ('admin', 'department'));

-- ─── outlier_report_entries ───────────────────────────────────────────────────

-- Admin: full access
create policy "entries_admin_all" on outlier_report_entries
  for all using (outlier_current_user_role() = 'admin');

-- Director: read only
create policy "entries_director_read" on outlier_report_entries
  for select using (outlier_current_user_role() = 'director');

-- Department: read + write
create policy "entries_dept_read" on outlier_report_entries
  for select using (outlier_current_user_role() = 'department');

create policy "entries_dept_write" on outlier_report_entries
  for insert using (outlier_current_user_role() = 'department');

create policy "entries_dept_update" on outlier_report_entries
  for update using (outlier_current_user_role() = 'department');

-- Area manager: read all, update own rows
create policy "entries_am_read" on outlier_report_entries
  for select using (outlier_current_user_role() = 'area_manager');

create policy "entries_am_update" on outlier_report_entries
  for update using (
    outlier_current_user_role() = 'area_manager'
    and row_key = any(select outlier_current_user_location_ids())
  );

-- ─── outlier_paste_logs ───────────────────────────────────────────────────────

create policy "paste_logs_admin_all" on outlier_paste_logs
  for all using (outlier_current_user_role() = 'admin');

create policy "paste_logs_dept_write" on outlier_paste_logs
  for insert using (outlier_current_user_role() in ('admin', 'department'));

create policy "paste_logs_read" on outlier_paste_logs
  for select using (outlier_current_user_role() in ('admin', 'department'));
