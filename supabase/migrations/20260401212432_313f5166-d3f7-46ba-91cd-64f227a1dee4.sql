
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  matched_product_id TEXT NOT NULL,
  match_percent INTEGER NOT NULL,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quiz sessions" ON public.quiz_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read quiz sessions" ON public.quiz_sessions
  FOR SELECT USING (true);
