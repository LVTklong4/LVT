-- ==============================================================================
-- Migration: Enable Row Level Security (RLS) - Permissive Mode for Dev/Testing
-- Description: Enables RLS on all tables to remove UNRESTRICTED warnings,
--              while allowing anon + authenticated access during testing.
-- ==============================================================================

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standby_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'admin_roles', 'bookings', 'monthly_bookings', 'stalls', 
            'storage', 'transactions', 'standby_waitlist', 'daily_closings', 'activity_logs'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_%s" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;
