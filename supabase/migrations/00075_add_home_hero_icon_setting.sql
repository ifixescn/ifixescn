/*
# Add Home Hero Icon Setting

## Purpose
Add a configurable setting for the home page hero section icon/image.
This allows administrators to customize the visual element displayed on the home page.

## Changes
1. Add home_hero_icon setting to site_settings table
2. Default value is empty (will use default Wrench icon if not set)

## Tables Affected
- site_settings (new row)
*/

-- Add home hero icon setting
INSERT INTO site_settings (key, value, description)
VALUES (
  'home_hero_icon',
  '',
  'Home page hero section icon/image URL. Leave empty to use default icon.'
)
ON CONFLICT (key) DO NOTHING;