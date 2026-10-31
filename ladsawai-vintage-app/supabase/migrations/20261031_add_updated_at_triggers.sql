-- ==============================================================================
-- Migration: Add updated_at columns and automated timestamp triggers
-- Description: Standardizes audit timestamps for mutable & master tables.
-- ==============================================================================

-- 1. Reusable trigger function for updating timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. bookings (ตารางจองรายวัน)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS trigger_set_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_set_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3. monthly_bookings (ตารางจองรายเดือน)
ALTER TABLE public.monthly_bookings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS trigger_set_monthly_bookings_updated_at ON public.monthly_bookings;
CREATE TRIGGER trigger_set_monthly_bookings_updated_at
BEFORE UPDATE ON public.monthly_bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4. storage (ตารางฝากของ)
ALTER TABLE public.storage 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS trigger_set_storage_updated_at ON public.storage;
CREATE TRIGGER trigger_set_storage_updated_at
BEFORE UPDATE ON public.storage
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 5. daily_closings (ตารางบันทึกปิดยอดประจำวัน)
ALTER TABLE public.daily_closings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS trigger_set_daily_closings_updated_at ON public.daily_closings;
CREATE TRIGGER trigger_set_daily_closings_updated_at
BEFORE UPDATE ON public.daily_closings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 6. stalls (ตารางผังแผงและราคาเริ่มต้น)
ALTER TABLE public.stalls 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS trigger_set_stalls_updated_at ON public.stalls;
CREATE TRIGGER trigger_set_stalls_updated_at
BEFORE UPDATE ON public.stalls
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 7. admin_roles (ตารางสิทธิ์ผู้ดูแลระบบ)
ALTER TABLE public.admin_roles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS trigger_set_admin_roles_updated_at ON public.admin_roles;
CREATE TRIGGER trigger_set_admin_roles_updated_at
BEFORE UPDATE ON public.admin_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
