-- ==============================================================================
-- Migration: Create standby_waitlist table
-- Description: Supports merchant standby waitlist queue management.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.standby_waitlist (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    booker_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    product TEXT DEFAULT '',
    preferred_zone TEXT DEFAULT 'อาหาร',
    preferred_stall_name TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'รอคิว',
    officer TEXT DEFAULT 'เจ้าหน้าที่',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for standby waitlist date lookup and status
CREATE INDEX IF NOT EXISTS idx_standby_waitlist_date ON public.standby_waitlist(date);
CREATE INDEX IF NOT EXISTS idx_standby_waitlist_status ON public.standby_waitlist(status);

-- Grants permissions for anon, authenticated, and service_role
GRANT ALL ON TABLE public.standby_waitlist TO anon, authenticated, service_role;
