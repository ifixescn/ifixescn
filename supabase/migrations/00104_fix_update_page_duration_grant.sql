
-- Ensure update_page_duration can be called by anon/authenticated
GRANT EXECUTE ON FUNCTION update_page_duration(uuid, integer) TO anon, authenticated;

-- Ensure all analytics read functions are accessible
GRANT EXECUTE ON FUNCTION get_realtime_analytics(integer)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_pages(integer, integer)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_location_stats(integer)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_country_stats(integer)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_isp_stats(integer)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_device_stats(integer)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_recent_views_with_ip(integer)    TO anon, authenticated;
