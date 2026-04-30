import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAllModuleSettings } from "@/db/api";
import type { ModuleSetting } from "@/types";

interface ModuleSettingsContextValue {
  /** 以 module_type 为 key 的设置映射（加载完成前为空对象） */
  moduleSettings: Record<string, ModuleSetting>;
  /** 查询指定模块是否启用（加载中或未找到时默认返回 true） */
  isModuleEnabled: (moduleType: string) => boolean;
  /** 手动触发重新加载 */
  reload: () => void;
}

const ModuleSettingsContext = createContext<ModuleSettingsContextValue>({
  moduleSettings: {},
  isModuleEnabled: () => true,
  reload: () => {},
});

export function ModuleSettingsProvider({ children }: { children: ReactNode }) {
  const [moduleSettings, setModuleSettings] = useState<Record<string, ModuleSetting>>({});

  const loadSettings = async () => {
    try {
      const settings = await getAllModuleSettings();
      const map: Record<string, ModuleSetting> = {};
      settings.forEach((s) => {
        map[s.module_type] = s;
      });
      setModuleSettings(map);
    } catch (err) {
      console.error("ModuleSettingsContext: 加载模块设置失败", err);
    }
  };

  useEffect(() => {
    loadSettings();

    // 监听后台设置变更事件，立即刷新
    const handleUpdate = () => loadSettings();
    window.addEventListener("settingsUpdated", handleUpdate);
    return () => window.removeEventListener("settingsUpdated", handleUpdate);
  }, []);

  const isModuleEnabled = (moduleType: string): boolean => {
    const setting = moduleSettings[moduleType];
    // 设置未加载完成时默认显示（避免闪烁）
    if (!setting) return true;
    return setting.is_enabled !== false;
  };

  return (
    <ModuleSettingsContext.Provider value={{ moduleSettings, isModuleEnabled, reload: loadSettings }}>
      {children}
    </ModuleSettingsContext.Provider>
  );
}

export function useModuleSettings() {
  return useContext(ModuleSettingsContext);
}
