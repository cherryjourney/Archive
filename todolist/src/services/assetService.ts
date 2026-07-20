import { invoke } from '@tauri-apps/api/core';
import type { Asset, CreateAssetParams, UpdateAssetParams, AssetStats } from '@/types/asset';

export const assetService = {
  /** ── Asset CRUD ── */

  async createAsset(params: CreateAssetParams): Promise<void> {
    const id = crypto.randomUUID();
    await invoke('create_asset', { id, params });
  },

  async updateAsset(id: string, params: UpdateAssetParams): Promise<void> {
    await invoke('update_asset', { id, params });
  },

  async deleteAsset(id: string): Promise<void> {
    await invoke('delete_asset', { id });
  },

  async getAsset(id: string): Promise<Asset> {
    return invoke('get_asset', { id });
  },

  async listAssets(filters?: {
    category?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: string;
  }): Promise<Asset[]> {
    return invoke('list_assets', {
      category: filters?.category ?? null,
      status: filters?.status ?? null,
      search: filters?.search ?? null,
      sort_by: filters?.sort_by ?? null,
      sort_dir: filters?.sort_dir ?? null,
    });
  },

  async getStats(): Promise<AssetStats> {
    return invoke('get_asset_stats');
  },

  async getExpiringWarranties(days: number = 30): Promise<Asset[]> {
    return invoke('get_expiring_warranties', { days });
  },
};
