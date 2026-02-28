-- Create or replace function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles.email when auth.users.email changes
  UPDATE profiles
  SET email = NEW.email,
      updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON auth.users;

-- Create trigger on auth.users to sync email to profiles
CREATE TRIGGER sync_profile_email_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_profile_email();

-- Add comment
COMMENT ON FUNCTION sync_profile_email() IS 'Automatically sync email from auth.users to profiles table when email is updated';