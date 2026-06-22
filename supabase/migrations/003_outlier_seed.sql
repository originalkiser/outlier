-- OutlierOS Seed Data
-- Reports sourced from: Systems Outlier Workbook 06.15.2026.xlsx
-- Departments left unassigned — assign via Admin panel after deployment
-- Skipped sheets: Overview, Return Uniforms, OSL, Reset

-- Clear existing seed data (safe on fresh install; skip if data exists)
delete from outlier_report_entries;
delete from outlier_paste_logs;
delete from outlier_reports;
delete from outlier_departments;

-- ─── Reports ─────────────────────────────────────────────────────────────────

insert into outlier_reports (department_id, name, slug, columns, is_employee_report, sort_order) values

-- 1. Over 13 Hour Punches
(null, 'Over 13 Hour Punches', 'over-13-punches', '[
  {"key":"employee","label":"STAFF MEMBER","type":"employee","required":true},
  {"key":"alt_id","label":"ALT ID","type":"text"},
  {"key":"date","label":"DATE","type":"date"},
  {"key":"shift_start","label":"SHIFT START","type":"text"},
  {"key":"shift_end","label":"SHIFT END","type":"text"},
  {"key":"hours_per_shift","label":"HOURS PER SHIFT","type":"number"},
  {"key":"total_daily_hours","label":"TOTAL DAILY SHIFT HOURS","type":"number"},
  {"key":"location","label":"STORE","type":"location"},
  {"key":"job_title","label":"JOB TITLE","type":"text"},
  {"key":"state","label":"STATE","type":"text"},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, true, 1),

-- 2. Extreme Overtime
(null, 'Extreme Overtime', 'extreme-overtime', '[
  {"key":"location","label":"HOME SHOP","type":"location","required":true},
  {"key":"employee","label":"NAME","type":"employee"},
  {"key":"title","label":"TITLE","type":"text"},
  {"key":"hours","label":"HOURS","type":"number"},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, true, 2),

-- 3. SMs Under 40
(null, 'SMs Under 40', 'sms-under-40', '[
  {"key":"location","label":"SHOP","type":"location","required":true},
  {"key":"employee","label":"NAME","type":"employee"},
  {"key":"title","label":"TITLE","type":"text"},
  {"key":"worked_hours","label":"WORKED HOURS","type":"number"},
  {"key":"pto_hours","label":"PTO HOURS","type":"number"},
  {"key":"total_hours","label":"TOTAL HOURS","type":"number"},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, true, 3),

-- 4. Cash >$10 Over/Short
(null, 'Cash >$10 Over/Short', 'cash-over-short', '[
  {"key":"location","label":"STORE #","type":"location","required":true},
  {"key":"total_mtd_variance","label":"TOTAL MTD VARIANCE","type":"number"},
  {"key":"director","label":"DIRECTOR","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, false, 4),

-- 5. Cash Metrics (Executive Summary)
(null, 'Cash Metrics', 'cash-metrics', '[
  {"key":"location","label":"METRIC","type":"location","required":true},
  {"key":"pct_sales_deposited","label":"% SALES DEPOSITED","type":"percent"},
  {"key":"shop_count","label":"SHOP COUNT","type":"number"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, false, 5),

-- 6. Cash - All Shops
(null, 'Cash - All Shops', 'cash-all-shops', '[
  {"key":"location","label":"STORE #","type":"location","required":true},
  {"key":"sales_date","label":"DAILY SALES DATE","type":"date"},
  {"key":"bank_account","label":"BANK ACCOUNT","type":"text"},
  {"key":"daily_sales","label":"DAILY SALES","type":"number"},
  {"key":"deposit_amount","label":"DEPOSIT AMOUNT","type":"number"},
  {"key":"deposit_date","label":"DEPOSIT DATE","type":"date"},
  {"key":"variance","label":"VARIANCE","type":"number"},
  {"key":"days_to_deposit","label":"DAYS TO DEPOSIT","type":"number"},
  {"key":"gl_account","label":"GL ACCOUNT","type":"text"},
  {"key":"skipped_deposit","label":"SKIPPED DEPOSIT","type":"text"},
  {"key":"days_since_skipped","label":"DAYS SINCE SKIPPED","type":"number"},
  {"key":"director","label":"DIRECTOR","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, false, 6),

-- 7. Cash >5 Days / Skipped
(null, 'Cash >5 Days / Skipped', 'cash-5-days-skipped', '[
  {"key":"location","label":"SHOP","type":"location","required":true},
  {"key":"missing_cash","label":"MISSING CASH","type":"number"},
  {"key":"skipped_delayed","label":"SKIPPED / DELAYED DEPOSIT","type":"text"},
  {"key":"days_since_skipped","label":"DAYS SINCE SKIPPED","type":"number"},
  {"key":"total_missing_cash","label":"TOTAL MISSING CASH","type":"number"},
  {"key":"last_deposit","label":"LAST DEPOSIT","type":"date"},
  {"key":"delayed_5_plus","label":"DELAYED >5 DAYS","type":"text"},
  {"key":"director","label":"DIRECTOR","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, false, 7),

-- 8. Daily Deposit Sheet Log >5 Days
(null, 'Daily Deposit Sheet Log >5 Days', 'daily-deposit-log', '[
  {"key":"location","label":"SHOP","type":"location","required":true},
  {"key":"last_form_used","label":"LAST FORM USED","type":"date"},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, false, 8),

-- 9. RAMP Expenses - Field Leaders
(null, 'RAMP Expenses - Field Leaders', 'ramp-field-leaders', '[
  {"key":"employee","label":"FIELD LEADER","type":"employee","required":true},
  {"key":"four_to_six_days","label":"4-6 DAYS","type":"number"},
  {"key":"seven_plus_days","label":"7+ DAYS","type":"number"},
  {"key":"grand_total","label":"GRAND TOTAL","type":"number"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, true, 9),

-- 10. RAMP Expenses - Shops (keyed by shop manager)
(null, 'RAMP Expenses - Shops', 'ramp-shops', '[
  {"key":"employee","label":"SHOP MANAGER","type":"employee","required":true},
  {"key":"four_to_six_days","label":"4-6 DAYS","type":"number"},
  {"key":"seven_plus_days","label":"7+ DAYS","type":"number"},
  {"key":"grand_total","label":"GRAND TOTAL","type":"number"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, true, 10),

-- 11. Active Not Paid
(null, 'Active Not Paid', 'active-not-paid', '[
  {"key":"employee","label":"NAME","type":"employee","required":true},
  {"key":"home_dept","label":"HOME DEPARTMENT","type":"text"},
  {"key":"hire_date","label":"HIRE DATE","type":"date"},
  {"key":"last_pay_date","label":"LAST PAY DATE","type":"date"},
  {"key":"days_since_check","label":"DAYS SINCE LAST CHECK","type":"number"},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, true, 11),

-- 12. Non-Inspectors Running Inspections
(null, 'Non-Inspectors Running Inspections', 'non-inspectors', '[
  {"key":"location","label":"SHOP # - CITY","type":"location","required":true},
  {"key":"employee","label":"EMP NAME","type":"employee"},
  {"key":"position_id","label":"POSITION ID","type":"text"},
  {"key":"tk_number","label":"TK NUMBER","type":"text"},
  {"key":"emissions_count","label":"EMISSIONS #","type":"number"},
  {"key":"safety_count","label":"SAFETY #","type":"number"},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, true, 12),

-- 13. No Inventory Completed
(null, 'No Inventory Completed', 'no-inventory-completed', '[
  {"key":"location","label":"SHOP","type":"location","required":true},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, false, 13),

-- 14. Super High Discounting
(null, 'Super High Discounting', 'discounting', '[
  {"key":"location","label":"SHOP","type":"location","required":true},
  {"key":"discount_pct","label":"DISCOUNT %","type":"percent"},
  {"key":"pct_marketing","label":"% MARKETING","type":"percent"},
  {"key":"pct_manager","label":"% MANAGER","type":"percent"},
  {"key":"pct_evergreen","label":"% EVERGREEN","type":"percent"},
  {"key":"pct_fleet","label":"% FLEET","type":"percent"},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, false, 14),

-- 15. Missed Plan >25%
(null, 'Missed Plan >25%', 'miss-plan', '[
  {"key":"location","label":"SHOP","type":"location","required":true},
  {"key":"net_sales","label":"NET SALES","type":"number"},
  {"key":"net_sales_plan","label":"NET SALES PLAN","type":"number"},
  {"key":"net_sales_plan_var","label":"NET SALES PLAN VAR %","type":"percent"},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, false, 15),

-- 16. Zero M5
(null, 'Zero M5', 'm5-issues', '[
  {"key":"location","label":"SHOP","type":"location","required":true},
  {"key":"sunday","label":"SUNDAY","type":"percent"},
  {"key":"monday","label":"MONDAY","type":"percent"},
  {"key":"tuesday","label":"TUESDAY","type":"percent"},
  {"key":"wednesday","label":"WEDNESDAY","type":"percent"},
  {"key":"thursday","label":"THURSDAY","type":"percent"},
  {"key":"friday","label":"FRIDAY","type":"percent"},
  {"key":"saturday","label":"SATURDAY","type":"percent"},
  {"key":"total_m5_pct","label":"TOTAL M5%","type":"percent"},
  {"key":"need_to","label":"NEED TO","type":"text"},
  {"key":"rdo","label":"RDO","type":"text"},
  {"key":"am_comment","label":"AM COMMENT","type":"text","editable_by":"area_manager"},
  {"key":"due_date","label":"DUE DATE","type":"date"}
]'::jsonb, false, 16);
