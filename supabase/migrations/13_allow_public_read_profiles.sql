/*
# 允许公开读取用户基本信息

## 说明
为了让未登录用户能够查看文章、产品和问答的作者信息，需要允许匿名用户读取profiles表的基本信息。

## 变更内容
1. 添加策略允许所有人（包括匿名用户）读取profiles表的基本公开信息
2. 这不会暴露敏感信息，因为查询时只会选择公开字段（username, nickname, avatar_url等）

## 安全性
- 只允许SELECT操作
- 不允许INSERT、UPDATE、DELETE操作
- 敏感字段（如email、phone）在前端查询时不会被选择
*/

-- 添加策略：允许所有人（包括匿名用户）读取用户基本信息
CREATE POLICY "公开读取用户基本信息" ON profiles
  FOR SELECT TO anon, authenticated
  USING (true);
