/*
# Create Search Keywords Table

## 1. New Tables
- `search_keywords` - Search keyword tracking table
  - `id` (uuid, primary key) - Primary key
  - `keyword` (text, unique, not null) - Search keyword
  - `search_count` (integer, default 1) - Number of searches
  - `last_searched_at` (timestamptz, default now()) - Last search timestamp
  - `created_at` (timestamptz, default now()) - First search timestamp

## 2. Indexes
- Descending index on search_count (for trending searches)
- Descending index on last_searched_at (for recent searches)
- Unique index on keyword

## 3. Features
- Track user search keywords
- Count searches per keyword
- Support trending search rankings
- Support recent search history

## 4. Security
- Public table, readable by all users
- Write access controlled through RPC function
*/

-- Create search keywords table
CREATE TABLE IF NOT EXISTS search_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text UNIQUE NOT NULL,
  search_count integer DEFAULT 1 NOT NULL,
  last_searched_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_search_keywords_count ON search_keywords(search_count DESC);
CREATE INDEX idx_search_keywords_last_searched ON search_keywords(last_searched_at DESC);

-- Enable RLS
ALTER TABLE search_keywords ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read
CREATE POLICY "Anyone can read search keywords" ON search_keywords
  FOR SELECT TO public USING (true);

-- Create RPC function to record search keywords
CREATE OR REPLACE FUNCTION record_search_keyword(p_keyword text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO search_keywords (keyword, search_count, last_searched_at)
  VALUES (p_keyword, 1, now())
  ON CONFLICT (keyword)
  DO UPDATE SET
    search_count = search_keywords.search_count + 1,
    last_searched_at = now();
END;
$$;

-- Add comments
COMMENT ON TABLE search_keywords IS 'Search keyword statistics table';
COMMENT ON COLUMN search_keywords.keyword IS 'Search keyword';
COMMENT ON COLUMN search_keywords.search_count IS 'Number of searches';
COMMENT ON COLUMN search_keywords.last_searched_at IS 'Last search timestamp';
COMMENT ON COLUMN search_keywords.created_at IS 'First search timestamp';
