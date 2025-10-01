-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP (Better Approach)
-- ============================================
-- Instead of creating profile in app code (which has RLS issues),
-- use a database trigger to auto-create profile when auth.user is created

-- Create function that auto-creates profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'owner' -- First user is always owner
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION
-- ============================================

-- Test: The trigger should automatically create a profile when a user signs up
-- No need to manually insert into profiles table anymore

