/*
# Translate Video Module Data to English

## Purpose
Translate all Chinese content in the video module to English, including:
- Video categories (name, slug, description)
- Sample video data (title, description, content)
- Policy comments

## Changes
1. Update video category names and descriptions
2. Update sample video data
3. Update policy comments

## Tables Affected
- categories (video type)
- videos (sample data)
*/

-- Update video categories to English
UPDATE categories 
SET 
  name = 'Tutorial Videos',
  slug = 'tutorial-videos',
  description = 'Various tutorials and training videos'
WHERE name = '教程视频' AND type = 'video';

UPDATE categories 
SET 
  name = 'Product Demos',
  slug = 'product-demos',
  description = 'Product feature demonstration videos'
WHERE name = '产品演示' AND type = 'video';

UPDATE categories 
SET 
  name = 'Event Reviews',
  slug = 'event-reviews',
  description = 'Event and conference review videos'
WHERE name = '活动回顾' AND type = 'video';

-- Update sample video data to English
UPDATE videos 
SET 
  title = 'Sample Tutorial Video',
  description = 'This is a sample tutorial video',
  content = '<p>This is a detailed introduction to the sample tutorial video.</p><p>Video content includes:</p><ul><li>Basic knowledge explanation</li><li>Practical demonstration</li><li>Common questions and answers</li></ul>'
WHERE title = '示例教程视频';

-- Update policy comments to English
COMMENT ON POLICY "公开可读已发布的视频" ON videos IS 'Allow everyone (including anonymous users and members) to view published videos';