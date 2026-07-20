import { create } from 'zustand';
import { travelService } from '@/services/travelService';
import type {
  VisitedCity, CityNote, CityDetail,
  CreateVisitedCityParams, UpdateVisitedCityParams,
  CreateCityNoteParams, UpdateCityNoteParams,
  WishlistItem, CreateWishlistParams, UpdateWishlistParams,
} from '@/types/travel';

interface TravelState {
  cities: VisitedCity[];
  selectedCityId: string | null;
  cityDetail: CityDetail | null;
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  selectCity: (id: string) => Promise<void>;
  create: (params: CreateVisitedCityParams) => Promise<void>;
  update: (id: string, params: UpdateVisitedCityParams) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addNote: (params: CreateCityNoteParams) => Promise<void>;
  updateNote: (id: string, params: UpdateCityNoteParams) => Promise<void>;
  removeNote: (id: string) => Promise<void>;

  // Wishlist
  wishlist: WishlistItem[];
  wishlistLoading: boolean;
  fetchWishlist: () => Promise<void>;
  createWishlist: (params: CreateWishlistParams) => Promise<void>;
  updateWishlist: (id: string, params: UpdateWishlistParams) => Promise<void>;
  removeWishlist: (id: string) => Promise<void>;
  markVisited: (id: string, visitedDate: string) => Promise<void>;
}

export const useTravelStore = create<TravelState>((set, get) => ({
  cities: [],
  selectedCityId: null,
  cityDetail: null,
  loading: false,
  error: null,
  wishlist: [],
  wishlistLoading: false,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const cities = await travelService.getAllCities();
      set({ cities, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectCity: async (id: string) => {
    set({ selectedCityId: id, cityDetail: null });
    try {
      const detail = await travelService.getCityDetail(id);
      set({ cityDetail: detail });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  create: async (params) => {
    set({ error: null });
    try {
      await travelService.createCity(params);
      await get().fetchAll();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  update: async (id, params) => {
    set({ error: null });
    try {
      await travelService.updateCity(id, params);
      await get().fetchAll();
      // Refresh detail if currently viewing
      if (get().selectedCityId === id) {
        await get().selectCity(id);
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  remove: async (id) => {
    set({ error: null });
    try {
      await travelService.deleteCity(id);
      if (get().selectedCityId === id) {
        set({ selectedCityId: null, cityDetail: null });
      }
      await get().fetchAll();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  addNote: async (params) => {
    try {
      await travelService.addNote(params);
      const sid = get().selectedCityId;
      if (sid === params.city_id) {
        await get().selectCity(sid);
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateNote: async (id, params) => {
    try {
      await travelService.updateNote(id, params);
      const sid = get().selectedCityId;
      if (sid) await get().selectCity(sid);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  removeNote: async (id) => {
    try {
      await travelService.deleteNote(id);
      const sid = get().selectedCityId;
      if (sid) await get().selectCity(sid);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  // ── Wishlist ──

  fetchWishlist: async () => {
    set({ wishlistLoading: true, error: null });
    try {
      const wishlist = await travelService.listWishlist();
      set({ wishlist, wishlistLoading: false });
    } catch (e) {
      set({ error: String(e), wishlistLoading: false });
    }
  },

  createWishlist: async (params) => {
    set({ error: null });
    try {
      await travelService.createWishlist(params);
      await get().fetchWishlist();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateWishlist: async (id, params) => {
    set({ error: null });
    try {
      await travelService.updateWishlist(id, params);
      await get().fetchWishlist();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  removeWishlist: async (id) => {
    set({ error: null });
    try {
      await travelService.deleteWishlist(id);
      await get().fetchWishlist();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  markVisited: async (id, visitedDate) => {
    set({ error: null });
    try {
      await travelService.markWishlistVisited(id, visitedDate);
      await get().fetchWishlist();
      // Also refresh visited cities for map linkage
      await get().fetchAll();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },
}));
