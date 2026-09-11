-- Storage used by the server-side ingestion pipeline.
INSERT INTO storage.buckets (id, name, public)
VALUES ('network-uploads', 'network-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "network_uploads_service_role_all"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'network-uploads')
WITH CHECK (bucket_id = 'network-uploads');

CREATE POLICY "network_uploads_owner_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'network-uploads'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.datasets WHERE owner_id = auth.uid()
  )
);