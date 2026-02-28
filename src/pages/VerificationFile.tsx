import { useEffect, useState } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

// 搜索引擎验证文件组件
// 从数据库动态读取验证文件内容，支持所有搜索引擎（Google、Bing、Baidu、360、Sogou等）
export default function VerificationFile() {
  const { filename } = useParams<{ filename: string }>();
  const location = useLocation();
  const [content, setContent] = useState<string>('');
  const [fileType, setFileType] = useState<'txt' | 'html'>('txt');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 从路径中提取文件名
  const getFilename = () => {
    if (filename) return filename;
    // 从完整路径中提取文件名
    const path = location.pathname;
    return path.startsWith('/') ? path.substring(1) : path;
  };

  useEffect(() => {
    const loadVerificationFile = async () => {
      const targetFilename = getFilename();
      
      if (!targetFilename) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // 检查是否为验证文件（.txt 或 .html 结尾）
      const isVerificationFile = 
        targetFilename.endsWith('.txt') || 
        targetFilename.endsWith('.html');

      if (!isVerificationFile) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // 确定文件类型
      const type = targetFilename.endsWith('.html') ? 'html' : 'txt';
      setFileType(type);

      try {
        // 从数据库查询验证文件
        const { data, error } = await supabase
          .from('verification_files')
          .select('content, file_type')
          .eq('filename', targetFilename)
          .maybeSingle();

        if (error) {
          console.error('查询验证文件失败:', error);
          setNotFound(true);
        } else if (data) {
          setContent(data.content);
          if (data.file_type) {
            setFileType(data.file_type);
          }
        } else {
          // 如果是旧的验证文件，返回硬编码内容
          if (targetFilename === '5ad6780caefa67ded91cac16c02894ff.txt') {
            setContent('21334f9819348e96c52bb6a58f9342b6fa5bf606');
          } else {
            setNotFound(true);
          }
        }
      } catch (error) {
        console.error('加载验证文件失败:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadVerificationFile();
  }, [filename, location.pathname]);

  // 如果不是验证文件，重定向到404
  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  if (loading) {
    return null;
  }

  // 根据文件类型返回不同的内容
  if (fileType === 'html') {
    // HTML文件：直接渲染HTML内容
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  // TXT文件：返回纯文本
  return (
    <pre style={{ 
      margin: 0, 
      padding: 0, 
      fontFamily: 'monospace',
      whiteSpace: 'pre',
      wordWrap: 'normal',
      border: 'none',
      background: 'transparent'
    }}>{content}</pre>
  );
}
