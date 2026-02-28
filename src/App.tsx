import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { SEOProvider } from '@/contexts/SEOContext';
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

function AppContent() {
  // Load fonts
  useFontLoader();
  
  // Track page visits
  usePageTracking();

  const location = useLocation();
  
  // Check if it's a standalone page (no Header and Footer needed)
  const isStandalonePage = location.pathname === '/yiyuan';

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

  return (
    <>
      <GlobalSEO />
      <ScrollToTop />
      <Toaster />
      <RequireAuth whiteList={[
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
        "/yiyuan"
      ]}>
        {isStandalonePage ? (
          // 独立页面布局（无 Header 和 Footer）
          <Routes>
            {routes.map((route, index) => {
              if (route.children) {
                return (
                  <Route key={index} path={route.path} element={route.element}>
                    {route.children.map((child, childIndex) => (
                      <Route
                        key={childIndex}
                        path={child.path}
                        element={child.element}
                      />
                    ))}
                  </Route>
                );
              }
              return (
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                />
              );
            })}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          // 标准页面布局（包含 Header 和 Footer）
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Routes>
                {routes.map((route, index) => {
                  if (route.children) {
                    return (
                      <Route key={index} path={route.path} element={route.element}>
                        {route.children.map((child, childIndex) => (
                          <Route
                            key={childIndex}
                            path={child.path}
                            element={child.element}
                          />
                        ))}
                      </Route>
                    );
                  }
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={route.element}
                    />
                  );
                })}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        )}
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
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </SEOProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
