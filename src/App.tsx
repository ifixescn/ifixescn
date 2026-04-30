import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { SEOProvider } from '@/contexts/SEOContext';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { ModuleSettingsProvider, useModuleSettings } from '@/contexts/ModuleSettingsContext';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/db/supabase';
import { useFontLoader } from '@/hooks/use-font-loader';
import { usePageTracking } from '@/hooks/usePageTracking';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import GlobalSEO from '@/components/common/GlobalSEO';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import routes from './routes';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// 文章模块守卫：模块关闭时重定向到首页
function ArticleModuleGuard({ children }: { children: React.ReactNode }) {
  const { isModuleEnabled, moduleSettings } = useModuleSettings();
  // 等待 moduleSettings 加载完成（非空对象）后再判断
  const loaded = Object.keys(moduleSettings).length > 0;
  if (loaded && !isModuleEnabled("articles")) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  // Load fonts
  useFontLoader();
  
  // Track page visits
  usePageTracking();

  const location = useLocation();
  
  // Check if it's a standalone page (no Header and Footer needed)
  const isStandalonePage = location.pathname.startsWith('/yiyuan');

  // 白名单用 useMemo 稳定引用，避免每次渲染产生新数组引起 RequireAuth useEffect 反复触发
  const whiteList = useMemo(() => [
    "/",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/search",
    "/sitemap.xml",
    "/robots.txt",
    "/5ad6780caefa67ded91cac16c02894ff.txt",
    "/0906d620653c7d4cc5c0bbfdd6b190ad.txt",
    "/MP_verify_*.txt",
    "/*.txt",
    "/privacy",
    "/terms",
    "/articles",
    "/articles/*",
    "/products",
    "/products/*",
    "/questions",
    "/questions/*",
    "/downloads",
    "/downloads/*",
    "/videos",
    "/videos/*",
    "/yiyuan/*",
  ], []);

  // Hide loading screen after app is loaded
  useEffect(() => {
    const loadingElement = document.getElementById('initial-loading');
    if (loadingElement) {
      // Delay 300ms to ensure content is fully rendered (optimized for WeChat browser)
      setTimeout(() => {
        loadingElement.style.opacity = '0';
        loadingElement.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
          loadingElement.style.display = 'none';
        }, 300);
      }, 300);
    }

    // Log successful load (for debugging WeChat browser issues)
    console.log('[App] Application loaded successfully at:', new Date().toISOString());
    console.log('[App] User Agent:', navigator.userAgent);
  }, []);

  // 文章路由路径集合（用于守卫判断）
  const articlePaths = new Set(['/articles', '/articles/:slug', '/articles/category/:categoryId']);

  // 渲染路由列表（复用逻辑）
  const renderRoutes = () =>
    routes.map((route, index) => {
      // 文章路由套上模块守卫
      const element = articlePaths.has(route.path)
        ? <ArticleModuleGuard>{route.element}</ArticleModuleGuard>
        : route.element;

      if (route.children) {
        return (
          <Route key={index} path={route.path} element={element}>
            {route.children.map((child, childIndex) => (
              <Route key={childIndex} path={child.path} element={child.element} />
            ))}
          </Route>
        );
      }
      return <Route key={index} path={route.path} element={element} />;
    });

  // yiyuan 为完全公开页面，直接绕过 RequireAuth，避免任何认证时序问题
  if (isStandalonePage) {
    return (
      <>
        <GlobalSEO />
        <ScrollToTop />
        <Toaster />
        <Routes>
          {renderRoutes()}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <GlobalSEO />
      <ScrollToTop />
      <Toaster />
      <RequireAuth whiteList={whiteList}>
        {/* 标准页面布局（包含 Header 和 Footer）*/}
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              {renderRoutes()}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </RequireAuth>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <SEOProvider>
          <AuthProvider client={supabase}>
            <TranslationProvider>
              <Router>
                <ModuleSettingsProvider>
                  <AppContent />
                </ModuleSettingsProvider>
              </Router>
            </TranslationProvider>
          </AuthProvider>
        </SEOProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
