-- Auto-create public.profiles row for every new auth user (email atau OAuth/Google).
-- Sebelumnya tidak ada trigger: register.tsx "mengasumsikan" backend membuatnya,
-- dan user Google login tidak pernah mendapat baris profil sampai edit manual.
-- Jalankan di Supabase Dashboard > SQL Editor (sekali saja), atau `supabase db push`.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_full_name TEXT;
  v_avatar    TEXT;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    'Pengguna'
  );
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (NEW.id, v_full_name, v_avatar)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: user yang sudah ada tapi belum punya profil.
INSERT INTO public.profiles (user_id, full_name, avatar_url)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    u.email,
    'Pengguna'
  ),
  COALESCE(
    u.raw_user_meta_data->>'picture',
    u.raw_user_meta_data->>'avatar_url'
  )
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;
