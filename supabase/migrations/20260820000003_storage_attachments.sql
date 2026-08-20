-- ============================================================
-- STORAGE: bucket "attachments" + RLS policies
-- Foto bukti SPL & slip gaji disimpan di Supabase Storage
-- dengan path: {user_id}/{folder}/{file}.{ext}
-- Setiap user HANYA bisa akses file di folder miliknya.
-- ============================================================

-- ============ 1. BUAT BUCKET (public agar URL bisa diakses app) ============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  TRUE,
  5242880, -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- ============ 2. RLS POLICIES pada storage.objects ============
-- Path dijamin diawali {user_id}/ sehingga folder pertama = pemilik.

-- SELECT: user hanya bisa melihat file di foldernya sendiri
DROP POLICY IF EXISTS "Users can view own attachment files" ON storage.objects;
CREATE POLICY "Users can view own attachment files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT: user hanya bisa upload ke foldernya sendiri
DROP POLICY IF EXISTS "Users can upload own attachment files" ON storage.objects;
CREATE POLICY "Users can upload own attachment files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: user hanya bisa update file di foldernya sendiri
DROP POLICY IF EXISTS "Users can update own attachment files" ON storage.objects;
CREATE POLICY "Users can update own attachment files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: user hanya bisa hapus file di foldernya sendiri
DROP POLICY IF EXISTS "Users can delete own attachment files" ON storage.objects;
CREATE POLICY "Users can delete own attachment files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============ 3. PASTIKAN RLS STORAGE AKTIF ============
-- (storage.objects sudah RLS aktif secara default di Supabase;
--  ALTER TABLE tidak bisa dijalankan via Management API — skip.)

-- ============ 4. BERSIHKAN POLICY PUBLIK DEFAULT (jika ada) ============
-- Supabase membuat policy "Give anon users access to all files in bucket"
-- untuk bucket public. Untuk bucket attachments, policy ini HARUS dihapus
-- agar hanya pemilik yang bisa mengakses.
DROP POLICY IF EXISTS "Give anon users access to all files in bucket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users access to all files in bucket attachments" ON storage.objects;
