-- Storage buckets for passport scans and trip documents

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('user-documents', 'user-documents', false, 52428800),
  ('trip-documents', 'trip-documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can read their own files
CREATE POLICY "Users read own storage objects"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('user-documents', 'trip-documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can upload to their own folder
CREATE POLICY "Users upload own storage objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('user-documents', 'trip-documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update their own files (required for upsert)
CREATE POLICY "Users update own storage objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('user-documents', 'trip-documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id IN ('user-documents', 'trip-documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own files
CREATE POLICY "Users delete own storage objects"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('user-documents', 'trip-documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
