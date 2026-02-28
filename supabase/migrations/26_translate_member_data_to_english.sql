/*
# Translate Member System Data to English

## 1. Update member level benefits to English
## 2. Update points rules descriptions to English

This migration ensures all user-facing text in the member system is in English.
*/

-- ============================================
-- 1. Update Member Level Benefits to English
-- ============================================

UPDATE member_levels SET benefits = '{"description": "New member, welcome aboard", "features": ["Basic browsing access", "Ask questions", "Comment on posts"]}'::jsonb
WHERE id = 1;

UPDATE member_levels SET benefits = '{"description": "Silver member, active participant", "features": ["Publish articles", "Priority answers", "Exclusive badge", "Daily points bonus"]}'::jsonb
WHERE id = 2;

UPDATE member_levels SET benefits = '{"description": "Gold member, active user", "features": ["Featured articles", "Exclusive badge", "Priority review", "Advanced editor"]}'::jsonb
WHERE id = 3;

UPDATE member_levels SET benefits = '{"description": "Platinum member, senior user", "features": ["Pin content", "Dedicated support", "Advanced permissions", "Custom homepage"]}'::jsonb
WHERE id = 4;

UPDATE member_levels SET benefits = '{"description": "Diamond member, prestigious status", "features": ["Full site privileges", "Personal advisor", "Priority support", "Custom services", "Unlimited storage"]}'::jsonb
WHERE id = 5;

-- ============================================
-- 2. Update Points Rules Descriptions to English
-- ============================================

UPDATE points_rules SET description = 'Daily login reward' WHERE action = 'daily_login';
UPDATE points_rules SET description = 'Publish an article' WHERE action = 'publish_article';
UPDATE points_rules SET description = 'Ask a question' WHERE action = 'publish_question';
UPDATE points_rules SET description = 'Post an answer' WHERE action = 'publish_answer';
UPDATE points_rules SET description = 'Answer accepted' WHERE action = 'answer_accepted';
UPDATE points_rules SET description = 'Article liked' WHERE action = 'article_liked';
UPDATE points_rules SET description = 'Comment received' WHERE action = 'comment_received';
