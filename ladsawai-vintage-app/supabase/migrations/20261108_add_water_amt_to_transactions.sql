-- ==============================================================================
-- Migration: Add water_amt column to transactions table
-- Description: Supports tracking water utility payments (ค่าน้ำ) for room rentals.
-- ==============================================================================

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS water_amt NUMERIC(12, 2) DEFAULT 0.00;
