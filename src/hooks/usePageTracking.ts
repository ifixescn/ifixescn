import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { recordPageView, updatePageDuration } from "@/db/api";

// 生成兼容的UUID（支持旧版浏览器和WebView）
function generateUUID(): string {
  // 优先使用原生crypto.randomUUID
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (error) {
      console.warn("crypto.randomUUID failed, using fallback:", error);
    }
  }
  
  // 降级方案：使用Math.random生成UUID v4格式
  // 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 获取或创建访客ID
function getVisitorId(): string {
  let visitorId: string | null = null;
  try {
    visitorId = localStorage.getItem("visitor_id");
    if (!visitorId) {
      visitorId = generateUUID();
      localStorage.setItem("visitor_id", visitorId);
    }
  } catch {
    visitorId = generateUUID();
  }
  return visitorId;
}

// 获取或创建会话ID
function getSessionId(): string {
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟
  const now = Date.now();
  
  let sessionId: string | null = null;
  let lastActivity: string | null = null;
  try {
    sessionId = sessionStorage.getItem("session_id");
    lastActivity = sessionStorage.getItem("last_activity");
  } catch {
    return generateUUID();
  }
  
  // 如果没有会话ID或会话已过期，创建新会话
  if (!sessionId || !lastActivity || now - parseInt(lastActivity) > SESSION_TIMEOUT) {
    sessionId = generateUUID();
    sessionStorage.setItem("session_id", sessionId);
  }
  
  sessionStorage.setItem("last_activity", now.toString());
  return sessionId;
}

// 检测设备类型
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

// 检测浏览器
function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("MSIE") || ua.includes("Trident")) return "IE";
  return "Unknown";
}

// 检测操作系统
function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

/**
 * 页面访问追踪Hook
 * 自动记录页面访问和停留时长
 */
export function usePageTracking() {
  const location = useLocation();
  const viewIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const startTime = Date.now();
    startTimeRef.current = startTime;

    // 记录页面访问
    const trackPageView = async () => {
      try {
        const viewId = await recordPageView({
          visitor_id: visitorId,
          session_id: sessionId,
          page_url: window.location.pathname + window.location.search,
          page_title: document.title,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
        });
        viewIdRef.current = viewId;
      } catch (error) {
        console.error("Failed to track page view:", error);
      }
    };

    trackPageView();

    // 页面卸载时更新停留时长
    return () => {
      if (viewIdRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        // 使用 navigator.sendBeacon 确保在页面卸载时也能发送数据
        if (duration > 0) {
          updatePageDuration(viewIdRef.current, duration).catch((error) => {
            console.error("Failed to update page duration:", error);
          });
        }
      }
    };
  }, [location.pathname, location.search]);

  // 定期更新停留时长（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      if (viewIdRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration > 0) {
          updatePageDuration(viewIdRef.current, duration).catch((error) => {
            console.error("Failed to update page duration:", error);
          });
        }
      }
    }, 30000); // 30秒

    return () => clearInterval(interval);
  }, []);

  // 页面可见性变化时更新停留时长
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && viewIdRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration > 0) {
          updatePageDuration(viewIdRef.current, duration).catch((error) => {
            console.error("Failed to update page duration:", error);
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
}
