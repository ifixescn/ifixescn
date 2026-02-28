/**
 * Security utilities for the application
 * Provides XSS protection, input sanitization, and other security features
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes while preserving safe formatting
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.textContent = html;
  let sanitized = temp.innerHTML;
  
  // Allow safe HTML tags for rich text content
  const allowedTags = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'
  ];
  
  // Parse the HTML string
  temp.innerHTML = html;
  
  // Remove script tags and event handlers
  const scripts = temp.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove event handler attributes
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(element => {
    // Remove all event handler attributes (onclick, onerror, etc.)
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }
    });
    
    // Remove javascript: protocol from href and src
    ['href', 'src'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value && value.toLowerCase().includes('javascript:')) {
        element.removeAttribute(attr);
      }
    });
    
    // Remove dangerous attributes
    ['style', 'class'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value && (value.includes('expression') || value.includes('javascript:'))) {
        element.removeAttribute(attr);
      }
    });
  });
  
  sanitized = temp.innerHTML;
  
  return sanitized;
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate a secure random string
 * 生成安全的随机字符串（兼容旧版浏览器和WebView）
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  
  // 优先使用crypto.getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn("crypto.getRandomValues failed, using fallback:", error);
    }
  }
  
  // 降级方案：使用Math.random
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  /**
   * Check if action is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  /**
   * Reset attempts for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Content Security Policy helper
 */
export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for React
    "style-src 'self' 'unsafe-inline'", // Required for styled components
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}

/**
 * Security headers for the application
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': getCSPHeader()
};

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
} = {}): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options;
  
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
    };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    };
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`
    };
  }
  
  return { valid: true };
}

/**
 * Prevent clickjacking
 */
export function preventClickjacking(): void {
  if (window.top !== window.self) {
    window.top!.location = window.self.location;
  }
}

/**
 * Secure local storage wrapper
 */
export const secureStorage = {
  setItem(key: string, value: string): void {
    try {
      // In production, consider encrypting sensitive data
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  },
  
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
  
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
};
