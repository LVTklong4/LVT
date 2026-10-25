-- ==============================================================================
-- Migration: Add price_fri to stalls table
-- Description: Supports Friday market day expansion (Default stall rent = 0).
-- ==============================================================================

ALTER TABLE public.stalls 
ADD COLUMN IF NOT EXISTS price_fri numeric DEFAULT 0;

-- Ensure all existing stalls have price_fri initialized to 0
UPDATE public.stalls 
SET price_fri = 0 
WHERE price_fri IS NULL;
