-- Add nome and cognome columns to quiz_sessions for CRM personalization
ALTER TABLE quiz_sessions
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS cognome TEXT;
