import { create } from 'zustand';
import { assetService } from '@/services/assetService';
import type { Asset, CreateAssetParams, UpdateAssetParams, AssetStats } from '@/types/asset';

interface AssetState {
  assets: Asset[];
  stats: AssetStats;
  loading: boolean;
  error: string | null;

  fetchAssets: (filters?: {
    category?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: string;
  }) => Promise<void>;
  fetchStats: () => Promise<void>;
  createAsset: (params: CreateAssetParams) => Promise<void>;
  updateAsset: (id: string, params: UpdateAssetParams) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
}

export const useAssetStore = create<AssetState>((set) => ({
  assets: [],
  stats: { total_value: 0, total_count: 0 },
  loading: false,
  error: null,

  fetchAssets: async (filters) => {
    set({ loading: true, error: null });
    try {
      const assets = await assetService.listAssets(filters);
      set({ assets, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await assetService.getStats();
      set({ stats });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  createAsset: async (params) => {
    set({ error: null });
    try {
      await assetService.createAsset(params);
      await useAssetStore.getState().fetchAssets();
      await useAssetStore.getState().fetchStats();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateAsset: async (id, params) => {
    set({ error: null });
    try {
      await assetService.updateAsset(id, params);
      await useAssetStore.getState().fetchAssets();
      await useAssetStore.getState().fetchStats();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  deleteAsset: async (id) => {
    set({ error: null });
    try {
      await assetService.deleteAsset(id);
      await useAssetStore.getState().fetchAssets();
      await useAssetStore.getState().fetchStats();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },
}));
