-- Update handle_new_user to read from provider_settings
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  trial_enabled BOOLEAN := false;
  trial_plan_slug TEXT := 'FREE';
  trial_days INT := 0;
  trial_settings JSONB;
BEGIN
  -- Try to read auto_trial settings
  SELECT value INTO trial_settings FROM provider_settings WHERE key = 'auto_trial' LIMIT 1;
  
  IF trial_settings IS NOT NULL AND (trial_settings->>'enabled')::boolean = true THEN
    trial_enabled := true;
    trial_plan_slug := UPPER(trial_settings->>'plan');
    trial_days := COALESCE((trial_settings->>'days')::int, 3);
  END IF;

  IF trial_enabled THEN
    -- Insert into subscriptions with selected plan
    INSERT INTO public.subscriptions (user_id, plan_id, current_period_end)
    VALUES (
        NEW.id, 
        (SELECT id FROM plans WHERE name = trial_plan_slug LIMIT 1),
        NOW() + (trial_days || ' days')::interval
    );

    -- Update auth.users raw_user_meta_data
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
          'plan', LOWER(trial_plan_slug),
          'is_trial', true,
          'trial_end', (NOW() + (trial_days || ' days')::interval)
        )
    WHERE id = NEW.id;

    -- Add a notification
    INSERT INTO public.notification_history (user_id, title, content, type)
    VALUES (
      NEW.id,
      '🎉 Chào mừng bạn!',
      'Bạn được tặng ' || trial_days || ' ngày trải nghiệm miễn phí gói ' || trial_plan_slug || '. Chúc bạn học tập hiệu quả!',
      'promotion'
    );
  ELSE
    -- Default FREE plan