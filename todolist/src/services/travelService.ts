import { invoke } from '@tauri-apps/api/core';
import type {
  VisitedCity, CreateVisitedCityParams, UpdateVisitedCityParams,
  CityNote, CreateCityNoteParams, UpdateCityNoteParams, CityDetail,
  WishlistItem, CreateWishlistParams, UpdateWishlistParams,
} from '@/types/travel';

export const travelService = {
  async createCity(params: CreateVisitedCityParams): Promise<void> {
    const id = crypto.randomUUID();
    await invoke('create_visited_city', { id, params });
  },

  async updateCity(id: string, params: UpdateVisitedCityParams): Promise<void> {
    await invoke('update_visited_city', { id, params });
  },

  async deleteCity(id: string): Promise<void> {
    await invoke('delete_visited_city', { id });
  },

  async getAllCities(): Promise<VisitedCity[]> {
    return invoke('get_all_visited_cities');
  },

  async getCityDetail(id: string): Promise<CityDetail> {
    return invoke('get_city_detail', { id });
  },

  async addNote(params: CreateCityNoteParams): Promise<void> {
    const id = crypto.randomUUID();
    await invoke('add_city_note', { id, params });
  },

  async updateNote(id: string, params: UpdateCityNoteParams): Promise<void> {
    await invoke('update_city_note', { id, params });
  },

  async deleteNote(id: string): Promise<void> {
    await invoke('delete_city_note', { id });
  },

  async getNotes(cityId: string): Promise<CityNote[]> {
    return invoke('get_city_notes', { cityId });
  },

  // ── Wishlist ──

  async listWishlist(): Promise<WishlistItem[]> {
    return invoke('list_wishlist');
  },

  async createWishlist(params: CreateWishlistParams): Promise<void> {
    const id = crypto.randomUUID();
    await invoke('create_wishlist', { id, params });
  },

  async updateWishlist(id: string, params: UpdateWishlistParams): Promise<void> {
    await invoke('update_wishlist', { id, params });
  },

  async deleteWishlist(id: string): Promise<void> {
    await invoke('delete_wishlist', { id });
  },

  async markWishlistVisited(id: string, visitedDate: string): Promise<void> {
    await invoke('mark_wishlist_visited', { id, visitedDate });
  },
};
