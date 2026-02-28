/*
# Unify Welcome Notifications System

## Problem
Currently there are two separate welcome systems:
1. `send_welcome_notification()` - sends to notifications table
2. `send_welcome_message_on_register()` - sends to messages table

This causes duplicate welcome messages for new users.

## Solution
1. Drop the duplicate trigger `trigger_send_welcome_message`
2. Keep only `trigger_send_welcome_notification` for unified notification
3. Update `send_welcome_notification()` to send both notification and message
4. Ensure no duplicate welcome messages for new registrations

## Changes
- Drop trigger_send_welcome_message
- Update send_welcome_notification() to handle both notifications and messages
- Consolidate welcome message logic into one function
*/

-- Drop the duplicate welcome message trigger
DROP TRIGGER IF EXISTS trigger_send_welcome_message ON profiles;

-- Drop the old function
DROP FUNCTION IF EXISTS send_welcome_message_on_register();

-- Update send_welcome_notification to handle both notifications and messages
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  welcome_subject text;
  welcome_content text;
  welcome_settings jsonb;
  message_title text;
  message_content text;
  system_user_id uuid;
BEGIN
  -- Get system admin user ID (first admin user)
  SELECT id INTO system_user_id
  FROM profiles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- If no admin exists, use the new user's ID as fallback
  IF system_user_id IS NULL THEN
    system_user_id := NEW.id;
  END IF;

  -- Get welcome message template from message_templates
  SELECT subject, content INTO welcome_subject, welcome_content
  FROM message_templates 
  WHERE template_key = 'welcome_message';
  
  -- Insert notification (always send)
  IF welcome_subject IS NOT NULL AND welcome_content IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, content, is_read)
    VALUES (NEW.id, 'system', welcome_subject, welcome_content, false);
  ELSE
    -- Use default welcome notification
    INSERT INTO notifications (user_id, type, title, content, is_read)
    VALUES (
      NEW.id, 
      'system', 
      'Welcome to iFixes Service Platform!', 
      'Dear ' || COALESCE(NEW.username, NEW.nickname, 'Member') || ',

Welcome to iFixes Service Platform!

We are delighted to have you join us. Here you can:
- Connect with technical experts online
- Get the latest technical information
- Enjoy exclusive member services

Tip: After verifying your email, you will automatically be upgraded to Silver membership with more privileges!

If you have any questions, please feel free to contact our customer service team.

Enjoy your experience!

iFixes Team',
      false
    );
  END IF;

  -- Get welcome message settings from system_settings
  SELECT setting_value INTO welcome_settings
  FROM system_settings
  WHERE setting_key = 'welcome_message_template';

  -- Send welcome message if enabled
  IF welcome_settings IS NOT NULL AND (welcome_settings->>'enabled')::boolean = true THEN
    message_title := welcome_settings->>'title';
    message_content := welcome_settings->>'content';
    
    -- Replace placeholders
    message_content := replace(message_content, '{username}', COALESCE(NEW.username, NEW.nickname, 'Member'));
    
    -- Insert welcome message
    IF message_title IS NOT NULL AND message_content IS NOT NULL THEN
      INSERT INTO messages (
        sender_id,
        receiver_id,
        title,
        content,
        message_type,
        is_read
      ) VALUES (
        system_user_id,
        NEW.id,
        message_title,
        message_content,
        'system',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION send_welcome_notification() IS 'Unified function to send welcome notification and message to new members';

-- Ensure the trigger exists (recreate if needed)
DROP TRIGGER IF EXISTS trigger_send_welcome_notification ON profiles;

CREATE TRIGGER trigger_send_welcome_notification
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_notification();

COMMENT ON TRIGGER trigger_send_welcome_notification ON profiles IS 'Automatically send welcome notification and message when a new user registers';
