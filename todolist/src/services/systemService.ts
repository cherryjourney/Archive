import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, ShortcutEntry } from '@/types/system';

export const systemService = {
  initApp(dataPath: string): Promise<AppConfig> {
    return invoke('init_app', { dataPath });
  },

  getAppConfig(): Promise<AppConfig> {
    return invoke('get_app_config');
  },

  updateDataPath(newPath: string): Promise<void> {
    return invoke('update_data_path', { newPath });
  },

  setExportPath(path: string): Promise<void> {
    return invoke('set_export_path', { path });
  },

  getShortcutConfig(): Promise<ShortcutEntry[]> {
    return invoke('get_shortcut_config');
  },

  setShortcutConfig(name: string, binding: string): Promise<void> {
    return invoke('set_shortcut_config', { name, binding });
  },

  exportBackup(targetPath: string): Promise<string> {
    return invoke('export_backup', { targetPath });
  },

  importBackup(sourcePath: string): Promise<void> {
    return invoke('import_backup', { sourcePath });
  },

  toggleAutoStart(enable: boolean): Promise<boolean> {
    return invoke('toggle_auto_start', { enable });
  },

  checkAutoStart(): Promise<boolean> {
    return invoke('check_auto_start');
  },
};
