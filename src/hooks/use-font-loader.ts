import { useEffect } from 'react';
import { getSiteSetting } from '@/db/api';

// 字体配置映射
const FONT_CONFIG: Record<string, string> = {
  'Inter': 'Inter:wght@300;400;500;600;700;800',
  'Poppins': 'Poppins:wght@300;400;500;600;700;800',
  'Roboto': 'Roboto:wght@300;400;500;700;900',
  'Montserrat': 'Montserrat:wght@300;400;500;600;700;800',
  'Open Sans': 'Open+Sans:wght@300;400;500;600;700;800',
  'Lato': 'Lato:wght@300;400;700;900',
  'Raleway': 'Raleway:wght@300;400;500;600;700;800',
  'Nunito': 'Nunito:wght@300;400;500;600;700;800',
};

/**
 * 加载并应用网站字体
 */
export function useFontLoader() {
  useEffect(() => {
    const loadFont = async () => {
      try {
        const setting = await getSiteSetting('site_font');
        const fontName = setting?.value || 'Inter';
        const fontConfig = FONT_CONFIG[fontName];

        if (!fontConfig) {
          console.warn(`未找到字体配置: ${fontName}`);
          return;
        }

        // 移除旧的字体链接
        const oldLinks = document.querySelectorAll('link[data-font-link]');
        oldLinks.forEach(link => link.remove());

        // 添加新的字体链接
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontConfig}&display=swap`;
        link.rel = 'stylesheet';
        link.setAttribute('data-font-link', 'true');
        document.head.appendChild(link);

        // 应用字体到根元素
        document.documentElement.style.setProperty('--font-family', `'${fontName}', sans-serif`);
      } catch (error) {
        console.error('加载字体失败:', error);
      }
    };

    loadFont();

    // 监听字体设置更新事件
    const handleFontUpdate = () => {
      loadFont();
    };

    window.addEventListener('fontSettingsUpdated', handleFontUpdate);

    return () => {
      window.removeEventListener('fontSettingsUpdated', handleFontUpdate);
    };
  }, []);
}
