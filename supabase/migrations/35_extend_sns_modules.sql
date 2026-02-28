/*
# Extend SNS System to Support More Modules

## 1. Changes
- Extend member_posts.related_type to support 'download' and 'video'
- This allows downloads and videos to automatically create posts

## 2. Supported Module Types
- article: Article posts
- question: Question posts
- answer: Answer posts
- download: Download posts
- video: Video posts
*/

-- Drop the existing constraint
ALTER TABLE member_posts DROP CONSTRAINT IF EXISTS member_posts_related_type_check;

-- Add new constraint with extended types
ALTER TABLE member_posts ADD CONSTRAINT member_posts_related_type_check 
  CHECK (related_type IN ('article', 'question', 'answer', 'download', 'video'));
