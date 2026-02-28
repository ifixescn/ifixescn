import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RequireAuthProps {
  children: React.ReactNode;
  whiteList?: string[];
}

export function RequireAuth({ children, whiteList = [] }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 如果是静态文件请求（.txt, .xml等），直接跳过认证检查
    // 这些文件应该由服务器直接返回，不应该进入React Router
    const isStaticFile = /\.(txt|xml|json|pdf|zip)$/i.test(location.pathname);
    if (isStaticFile) {
      console.log('[RequireAuth] Static file detected, skipping auth check:', location.pathname);
      return;
    }

    if (loading) return;

    const isWhitelisted = whiteList.some(path => {
      // 处理通配符路径 (例如: /articles/*)
      if (path.endsWith("/*")) {
        const basePath = path.slice(0, -2);
        return location.pathname.startsWith(basePath);
      }
      // 处理文件扩展名通配符 (例如: /*.txt, /MP_verify_*.txt)
      if (path.includes("*")) {
        const regexPattern = path
          .replace(/\*/g, ".*")  // 将 * 替换为 .*（匹配任意字符）
          .replace(/\//g, "\\/"); // 转义斜杠
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(location.pathname);
      }
      // 精确匹配
      return location.pathname === path;
    });

    if (!user && !isWhitelisted) {
      navigate("/login", { state: { from: location.pathname } });
    }
  }, [user, loading, location, navigate, whiteList]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
