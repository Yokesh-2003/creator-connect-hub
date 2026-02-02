
DROP POLICY IF EXISTS "System can insert metrics" ON public.metrics;
CREATE POLICY "Users can insert metrics for their submissions" ON public.metrics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND creator_id = auth.uid())
);