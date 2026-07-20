export interface VaultNote {
  path: string;
  title: string;
  tags: string[];
  last_updated: string;
}

export interface VaultConfig {
  vault_path: string;
  is_configured: boolean;
}

export interface SyncResult {
  synced_count: number;
  total_tags: number;
  tags: string[];
}
