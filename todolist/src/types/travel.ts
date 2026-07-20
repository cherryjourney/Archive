/** 已访问城市 */
export interface VisitedCity {
  id: string;
  city_name: string;
  country: string;
  province: string;
  lat: number;
  lng: number;
  visit_date: string | null;
  rating: number;
  is_highlighted: boolean;
  color: string;
  notes: string;
  travel_guide: string;
  photos: string;          // JSON array
  created_at: string;
  updated_at: string;
}

/** 创建城市参数 */
export interface CreateVisitedCityParams {
  city_name: string;
  country?: string;
  province?: string;
  lat: number;
  lng: number;
  visit_date?: string | null;
  rating?: number;
  is_highlighted?: boolean;
  color?: string;
  notes?: string;
  travel_guide?: string;
  photos?: string;
}

/** 更新城市参数 */
export interface UpdateVisitedCityParams {
  city_name?: string;
  country?: string;
  province?: string;
  lat?: number;
  lng?: number;
  visit_date?: string | null;
  rating?: number;
  is_highlighted?: boolean;
  color?: string;
  notes?: string;
  travel_guide?: string;
  photos?: string;
}

/** 旅记 */
export interface CityNote {
  id: string;
  city_id: string;
  title: string;
  content: string;
  note_date: string | null;
  created_at: string;
  updated_at: string;
}

/** 创建旅记参数 */
export interface CreateCityNoteParams {
  city_id: string;
  title?: string;
  content?: string;
  note_date?: string | null;
}

/** 更新旅记参数 */
export interface UpdateCityNoteParams {
  title?: string;
  content?: string;
  note_date?: string | null;
}

/** 城市详情 */
export interface CityDetail {
  city: VisitedCity;
  notes: CityNote[];
}

/** 想去的地方 */
export interface WishlistItem {
  id: string;
  city_name: string;
  country: string;
  province: string;
  lat: number | null;
  lng: number | null;
  reason: string;
  best_season: string;
  budget: number;
  companions: string;
  is_visited: boolean;
  visited_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWishlistParams {
  city_name: string;
  country?: string;
  province?: string;
  lat?: number | null;
  lng?: number | null;
  reason?: string;
  best_season?: string;
  budget?: number;
  companions?: string;
}

export interface UpdateWishlistParams {
  city_name?: string;
  country?: string;
  province?: string;
  lat?: number | null;
  lng?: number | null;
  reason?: string;
  best_season?: string;
  budget?: number;
  companions?: string;
}
