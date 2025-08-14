-- This migration drops the complex and fragile RPC function and replaces it with nothing.
-- The data processing logic is now moved entirely into the application code in `src/lib/data.ts`
-- for better stability, reliability, and easier debugging.

DROP FUNCTION IF EXISTS public.get_report_data(uuid, uuid, integer);
