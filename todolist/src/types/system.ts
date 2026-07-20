export interface AppConfig {
  data_path: string;
  theme: string;
  app_version: string;
  vault_path: string;
  export_path: string;
}

export interface ShortcutEntry {
  name: string;
  binding: string;
  description: string;
}
