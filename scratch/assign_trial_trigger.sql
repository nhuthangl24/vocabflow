CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users 
  SET raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'plan', 'trial_plus', 
      'is_trial', true, 
      'trial_end_date', (now() + interval '14 days')::text
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
