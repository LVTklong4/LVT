-- ==============================================================================
-- Migration: Create line_users table
-- Description: Maps LINE User IDs to merchant phone numbers for LINE Official Account notifications & self-service queries.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.line_users (
    line_user_id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    picture_url TEXT DEFAULT '',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for phone lookups when matching monthly contracts
CREATE INDEX IF NOT EXISTS idx_line_users_phone ON public.line_users(phone);

-- Grants permissions for anon, authenticated, and service_role
GRANT ALL ON TABLE public.line_users TO anon, authenticated, service_role;
