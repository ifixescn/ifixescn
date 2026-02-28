/*
# 添加博客浏览次数RPC函数

创建一个RPC函数用于原子性地增加博客浏览次数
*/

CREATE OR REPLACE FUNCTION increment_blog_views(blog_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blogs 
  SET views_count = views_count + 1 
  WHERE id = blog_id;
END;
$$;
