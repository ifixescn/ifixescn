/*
# 添加浏览次数增加函数

## RPC函数
- increment_article_views: 增加文章浏览次数
- increment_product_views: 增加产品浏览次数
- increment_question_views: 增加问题浏览次数
*/

-- 增加文章浏览次数
CREATE OR REPLACE FUNCTION increment_article_views(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE articles SET view_count = view_count + 1 WHERE id = article_id;
END;
$$;

-- 增加产品浏览次数
CREATE OR REPLACE FUNCTION increment_product_views(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products SET view_count = view_count + 1 WHERE id = product_id;
END;
$$;

-- 增加问题浏览次数
CREATE OR REPLACE FUNCTION increment_question_views(question_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE questions SET view_count = view_count + 1 WHERE id = question_id;
END;
$$;
