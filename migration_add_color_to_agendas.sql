-- Migration: Add color column to agendas table
-- Run this on existing database to add color feature to agenda

-- Add color column to agendas table
ALTER TABLE public.agendas 
ADD COLUMN color text DEFAULT '#6b7280';

-- Add comment for documentation
COMMENT ON COLUMN public.agendas.color IS 'Hex color code for agenda tag/card styling (e.g., #3b82f6, #ef4444)';

-- Optional: Update existing records with default color
-- UPDATE public.agendas SET color = '#6b7280' WHERE color IS NULL;