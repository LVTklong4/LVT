-- ==============================================================================
-- Migration: Create daily_closings and activity_logs tables
-- Description: Supports daily closing reconciliation, cash drawer audit, and staff activity logs.
-- ==============================================================================

-- 1. Create table: daily_closings
CREATE TABLE IF NOT EXISTS public.daily_closings (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'CLOSED',
    float_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    counted_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cash_shortage_surplus NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discrepancy_note TEXT DEFAULT '',
    system_daily_income NUMERIC(12, 2) DEFAULT 0.00,
    system_monthly_income NUMERIC(12, 2) DEFAULT 0.00,
    system_klongthom_income NUMERIC(12, 2) DEFAULT 0.00,
    system_storage_income NUMERIC(12, 2) DEFAULT 0.00,
    system_other_income NUMERIC(12, 2) DEFAULT 0.00,
    system_total_expenses NUMERIC(12, 2) DEFAULT 0.00,
    system_cash_in NUMERIC(12, 2) DEFAULT 0.00,
    system_transfer_in NUMERIC(12, 2) DEFAULT 0.00,
    system_cash_out NUMERIC(12, 2) DEFAULT 0.00,
    system_transfer_out NUMERIC(12, 2) DEFAULT 0.00,
    closed_by TEXT NOT NULL DEFAULT 'Admin',
    closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for daily closings date lookup
CREATE INDEX IF NOT EXISTS idx_daily_closings_date ON public.daily_closings(date);

-- 2. Create table: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    officer_name TEXT NOT NULL DEFAULT 'เจ้าหน้าที่',
    officer_role TEXT NOT NULL DEFAULT 'Staff',
    action_type TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for activity logs ordering and querying by timestamp
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action_type);

-- 3. Grants permissions for anon and authenticated roles
GRANT ALL ON TABLE public.daily_closings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.activity_logs TO anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS) with open policy for now (matching existing tables)
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on daily_closings" 
ON public.daily_closings FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public read/write on activity_logs" 
ON public.activity_logs FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
