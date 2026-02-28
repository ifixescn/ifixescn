/*
# Fix messages table column name issue

## Problem Description
Registration fails with error:
"ERROR: column "title" of relation "messages" does not exist (SQLSTATE 42703)"

## Root Cause
1. The actual messages table in database uses "subject" column
2. But migration 42 trigger functions use "title" column
3. This mismatch causes registration to fail when sending welcome messages

## Solution
Update all trigger functions that incorrectly use "title" to use the correct column name "subject"

## Changes
1. Fix send_welcome_message_on_register() function to use "subject"
2. Fix auto_upgrade_to_silver_on_email_verified() function to use "subject"
3. Ensure all message-related functions use consistent column names
*/

-- 1. Fix the welcome message trigger function
CREATE OR REPLACE FUNCTION send_welcome_message_on_register()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  welcome_settings jsonb;
  message_title text;
  message_content text;
BEGIN
  -- Get welcome message settings
  SELECT setting_value INTO welcome_settings
  FROM system_settings
  WHERE setting_key = 'welcome_message_template';

  -- Check if welcome message is enabled
  IF welcome_settings IS NOT NULL AND (welcome_settings->>'enabled')::boolean = true THEN
    -- Get message title and content
    message_title := welcome_settings->>'title';
    message_content := welcome_settings->>'content';
    
    -- Replace placeholders
    message_content := replace(message_content, '{username}', COALESCE(NEW.username, NEW.nickname, 'User'));
    
    -- Insert message (using correct column name "subject")
    INSERT INTO messages (
      sender_id,
      receiver_id,
      subject,
      content,
      message_type
    ) VALUES (
      NULL,  -- System message, sender_id is NULL
      NEW.id,
      message_title,
      message_content,
      'system'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Fix the auto upgrade trigger function
CREATE OR REPLACE FUNCTION auto_upgrade_to_silver_on_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if email was just verified (changed from false to true)
  IF NEW.email_verified = true AND (OLD.email_verified IS NULL OR OLD.email_verified = false) THEN
    -- If currently Bronze member, auto upgrade to Silver
    IF NEW.member_level = 'bronze' THEN
      NEW.member_level := 'silver';
      
      -- Send upgrade notification message (using correct column name "subject")
      INSERT INTO messages (
        sender_id,
        receiver_id,
        subject,
        content,
        message_type
      ) VALUES (
        NULL,
        NEW.id,
        'Congratulations! You have been upgraded to Silver Member',
        'Dear ' || COALESCE(NEW.username, NEW.nickname, 'User') || ',

Congratulations on successfully verifying your email!

Your membership level has been automatically upgraded to Silver Member. Now you can:
- Set up your personal homepage
- Enjoy more member privileges
- Get priority technical support

Thank you for your support!

The Team',
        'system'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Add comment for clarity
COMMENT ON COLUMN messages.subject IS 'Message title/subject';
COMMENT ON COLUMN messages.message_type IS 'Message type: system=System message, user=User message';
