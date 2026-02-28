import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSEOSettings } from '@/db/api';

interface SEOSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  siteLogo: string;
}

interface SEOContextType {
  settings: SEOSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SEOSettings = {
  siteName: 'iFixes',
  siteDescription: 'Global leading mobile phone repair resource integration service provider',
  siteKeywords: 'mobile phone repair, smartphone repair, repair guides, repair parts, repair tools, repair community',
  siteLogo: ''
};

const SEOContext = createContext<SEOContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {}
});

export const useSEO = () => {
  const context = useContext(SEOContext);
  if (!context) {
    throw new Error('useSEO must be used within SEOProvider');
  }
  return context;
};

interface SEOProviderProps {
  children: ReactNode;
}

export const SEOProvider = ({ children }: SEOProviderProps) => {
  const [settings, setSettings] = useState<SEOSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const data = await getSEOSettings();
      
      if (data) {
        setSettings({
          siteName: data.site_title || defaultSettings.siteName,
          siteDescription: data.site_description || defaultSettings.siteDescription,
          siteKeywords: data.site_keywords || defaultSettings.siteKeywords,
          siteLogo: data.og_image || defaultSettings.siteLogo
        });
      } else {
        // 如果没有数据，使用默认设置
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load SEO settings:', error);
      // 使用默认设置
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();

    // 监听设置更新事件
    const handleSettingsUpdate = () => {
      loadSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  return (
    <SEOContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SEOContext.Provider>
  );
};
