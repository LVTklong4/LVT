-- ==============================================================================
-- Migration: Enable Row Level Security (RLS) & Granular Access Policies
-- Description: Secures all tables in LVT system to remove UNRESTRICTED warnings
--              and protect sensitive financial, booking, and administrative data.
-- ==============================================================================

-- 1. Enable RLS on all system tables
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standby_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 2. Clean up old/redundant policies if any
DROP POLICY IF EXISTS "stalls_select_policy" ON public.stalls;
DROP POLICY IF EXISTS "stalls_write_policy" ON public.stalls;
DROP POLICY IF EXISTS "bookings_select_policy" ON public.bookings;
DROP POLICY IF EXISTS "bookings_write_policy" ON public.bookings;
DROP POLICY IF EXISTS "monthly_bookings_select_policy" ON public.monthly_bookings;
DROP POLICY IF EXISTS "monthly_bookings_write_policy" ON public.monthly_bookings;
DROP POLICY IF EXISTS "admin_roles_select_policy" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_write_policy" ON public.admin_roles;
DROP POLICY IF EXISTS "transactions_staff_policy" ON public.transactions;
DROP POLICY IF EXISTS "storage_staff_policy" ON public.storage;
DROP POLICY IF EXISTS "daily_closings_staff_policy" ON public.daily_closings;
DROP POLICY IF EXISTS "activity_logs_staff_policy" ON public.activity_logs;
DROP POLICY IF EXISTS "standby_waitlist_all_policy" ON public.standby_waitlist;
DROP POLICY IF EXISTS "Allow public read/write on daily_closings" ON public.daily_closings;
DROP POLICY IF EXISTS "Allow public read/write on activity_logs" ON public.activity_logs;

-- ------------------------------------------------------------------------------
-- A. Public-Facing Tables (Kiosk & Customer Map: Read-only for public, Staff write)
-- ------------------------------------------------------------------------------

-- stalls: Public can view map layout; Staff can manage stalls
CREATE POLICY "stalls_select_policy" ON public.stalls
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "stalls_write_policy" ON public.stalls
FOR ALL TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- bookings: Public can view vacant/occupied stalls; Staff can manage bookings
CREATE POLICY "bookings_select_policy" ON public.bookings
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "bookings_write_policy" ON public.bookings
FOR ALL TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- monthly_bookings: Public can view monthly occupied stalls; Staff can manage
CREATE POLICY "monthly_bookings_select_policy" ON public.monthly_bookings
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "monthly_bookings_write_policy" ON public.monthly_bookings
FOR ALL TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- B. Authentication & Waitlist Tables
-- ------------------------------------------------------------------------------

-- admin_roles: Anyone can read to verify login credentials; only staff can edit
CREATE POLICY "admin_roles_select_policy" ON public.admin_roles
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "admin_roles_write_policy" ON public.admin_roles
FOR ALL TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- standby_waitlist: Staff & public queue registration
CREATE POLICY "standby_waitlist_all_policy" ON public.standby_waitlist
FOR ALL TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- C. Sensitive Staff & Financial Tables (Restricted strictly to Authenticated staff)
-- ------------------------------------------------------------------------------

-- transactions: Protected financial revenue, cash, and expense records
CREATE POLICY "transactions_staff_policy" ON public.transactions
FOR ALL TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- storage: Overnight merchant equipment custody
CREATE POLICY "storage_staff_policy" ON public.storage
FOR ALL TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- daily_closings: Financial drawer closing & reconciliation
CREATE POLICY "daily_closings_staff_policy" ON public.daily_closings
FOR ALL TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- activity_logs: Staff operational audit trails
CREATE POLICY "activity_logs_staff_policy" ON public.activity_logs
FOR ALL TO authenticated, service_role
USING (true)
WITH CHECK (true);
