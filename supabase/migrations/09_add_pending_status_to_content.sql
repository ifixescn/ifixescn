/*
# 添加pending状态到content_status枚举

## 1. 修改内容
- 在content_status枚举类型中添加pending状态
- pending状态用于会员投稿文章的审核

## 2. 状态说明
- draft: 草稿
- pending: 待审核（会员投稿）
- published: 已发布
- offline: 已下线

## 3. 注意事项
- 会员投稿的文章默认为pending状态
- 管理员审核后可改为published或offline
*/

-- 添加pending状态到content_status枚举
ALTER TYPE content_status ADD VALUE IF NOT EXISTS 'pending';

-- 添加注释
COMMENT ON TYPE content_status IS '内容状态：draft-草稿，pending-待审核，published-已发布，offline-已下线';
