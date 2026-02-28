import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 从URL中提取文件名
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // 提取文件名（去除路径前缀）
    // 支持两种访问方式：
    // 1. /functions/v1/verification-file/filename.txt
    // 2. 直接访问 /filename.txt（通过Nginx重写）
    const pathParts = pathname.split('/');
    const filename = pathParts[pathParts.length - 1];

    if (!filename) {
      return new Response('Not Found', { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // 验证文件类型（只允许 .txt 和 .html 文件）
    if (!filename.endsWith('.txt') && !filename.endsWith('.html')) {
      return new Response('Not Found', { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // 连接数据库
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 查询文件内容
    const { data, error } = await supabase
      .from('verification_files')
      .select('content')
      .eq('filename', filename)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    if (!data) {
      return new Response('Not Found', { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // 根据文件类型设置Content-Type
    const contentType = filename.endsWith('.html') 
      ? 'text/html; charset=utf-8' 
      : 'text/plain; charset=utf-8';

    // 返回文件内容
    return new Response(data.content, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
});
