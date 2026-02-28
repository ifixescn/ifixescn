/*
# Fix Welcome Notification Column Names

## Problem Description
Migration 58 created a unified welcome notification function, but it has two critical errors:
1. Uses "title" column for messages table (should be "subject")
2. Uses "user_id" column for notifications table (should be "member_id")

## Root Cause
Migration 58 unified the welcome notification system but used incorrect column names:
- messages table: uses "title" instead of "subject"
- notifications table: uses "user_id" instead of "member_id"

## Solution
Update the send_welcome_notification() function to use correct column names

## Changes
1. Fix messages table INSERT to use "subject" instead of "title"
2. Fix notifications table INSERT to use "member_id" instead of "user_id"
*/

-- Update send_welcome_notification to use correct column names
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
  
  -- If no admin exists, use NULL for system messages
  IF system_user_id IS NULL THEN
    system_user_id := NULL;
  END IF;

  -- Get welcome message template from message_templates
  SELECT subject, content INTO welcome_subject, welcome_content
  FROM message_templates 
  WHERE template_key = 'welcome_message';
  
  -- Insert notification (always send) - using correct column "member_id"
  IF welcome_subject IS NOT NULL AND welcome_content IS NOT NULL THEN
    INSERT INTO notifications (member_id, type, title, content, is_read)
    VALUES (NEW.id, 'system', welcome_subject, welcome_content, false);
  ELSE
    -- Use default welcome notification
    INSERT INTO notifications (member_id, type, title, content, is_read)
    VALUES (
      NEW.id, 
      'system', 
      'Welcome to Our Community!', 
      'Dear ' || COALESCE(NEW.username, NEW.nickname, 'Member') || ',

Welcome to our community!

We are delighted to have you join us. Here you can:
- Connect with experts online
- Get the latest information
- Enjoy exclusive member services

Tip: After verifying your email, you will automatically be upgraded to Silver membership with more privileges!

If you have any questions, please feel free to contact our support team.

Enjoy your experience!

The Team',
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
    
    -- Insert welcome message - using correct column "subject"
    IF message_title IS NOT NULL AND message_content IS NOT NULL THEN
      INSERT INTO messages (
        sender_id,
        receiver_id,
        subject,
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

COMMENT ON FUNCTION send_welcome_notification() IS 'Unified function to send welcome notification and message to new members (fixed column names)';
