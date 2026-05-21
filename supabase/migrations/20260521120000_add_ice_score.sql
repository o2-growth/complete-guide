-- Migration: add ICE Score columns to tasks table
-- ICE Score = Impact × Confidence × Ease (1–10 each, score 1–1000)

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS ice_impact    integer CHECK (ice_impact    BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS ice_confidence integer CHECK (ice_confidence BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS ice_ease      integer CHECK (ice_ease      BETWEEN 1 AND 10);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'tasks'
      AND column_name  = 'ice_score'
  ) THEN
    ALTER TABLE tasks
      ADD COLUMN ice_score integer GENERATED ALWAYS AS (ice_impact * ice_confidence * ice_ease) STORED;
  END IF;
END $$;
