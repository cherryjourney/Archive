import chinaCitiesRaw from '@/assets/geo/china-cities.json';

// ── 内部 GeoJSON 类型 ─────────────────────────────

interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: Record<string, unknown> | null;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ── 类型 ──────────────────────────────────────────

/** 市级条目 */
export interface CityEntry {
  name: string;       // 城市名，如 "深圳市"
  fullname: string;   // 完整名，同 name
  pinyin: string;     // 拼音（本数据源不含拼音，置空）
  code: string;       // 6 位行政区划代码，如 "440300"
  province: string;   // 所属省份名，如 "广东"
  lng: number;
  lat: number;
}

/** 行政区划条目（兼容旧接口） */
export interface GeoPlace {
  name: string;
  fullname: string;
  lat: number;
  lng: number;
  level: number;      // 1=省级, 2=市级
}

// ── 省份代码 → 名称映射 ──────────────────────────

const PROVINCE_CODE_MAP: Record<string, string> = {
  '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
  '21': '辽宁', '22': '吉林', '23': '黑龙江',
  '31': '上海', '32': '江苏', '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
  '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西', '46': '海南',
  '50': '重庆', '51': '四川', '52': '贵州', '53': '云南', '54': '西藏',
  '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏', '65': '新疆',
  '71': '台湾', '81': '香港', '82': '澳门',
};

// ── 审图号 ────────────────────────────────────────

/** 地图审图号（由中国_市.geojson 原文件自带） */
export const MAP_APPROVAL_NUMBER = 'GS(2024)0658号';

// ── 缓存 ──────────────────────────────────────────

let _geoJSON: GeoJSONFeatureCollection | null = null;
let _cityList: CityEntry[] | null = null;
let _provinceList: string[] | null = null;

// ── 辅助函数 ──────────────────────────────────────

/** 从 MultiPolygon / Polygon 近似计算中心点（所有坐标求均值） */
function computeCentroid(geometry: GeoJSONGeometry): { lng: number; lat: number } {
  let sumLng = 0, sumLat = 0, count = 0;

  const coords: any = geometry.type === 'MultiPolygon'
    ? geometry.coordinates
    : geometry.coordinates;

  if (!coords || !Array.isArray(coords)) return { lng: 0, lat: 0 };

  // 展平 MultiPolygon 的多层嵌套
  const rings: any[] = geometry.type === 'MultiPolygon'
    ? (coords as any[]).flat()
    : coords;

  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      sumLng += lng;
      sumLat += lat;
      count++;
    }
  }
  if (count === 0) return { lng: 0, lat: 0 };
  return { lng: sumLng / count, lat: sumLat / count };
}

/** 从 9 位编码提取标准 6 位行政区划代码（去掉前 3 位前缀） */
function extractStandardCode(gb: string): string {
  return gb.length >= 6 ? gb.slice(3) : gb;
}

// ── 公开 API ──────────────────────────────────────

/**
 * 获取完整的 GeoJSON FeatureCollection（原封不动，不过滤任何要素）
 * 用于 ECharts registerMap 渲染市级行政区划边界
 */
export function getChinaGeoJSON(): GeoJSONFeatureCollection {
  if (_geoJSON) return _geoJSON;
  // 直接返回原始数据，不做任何过滤、裁切、修改
  _geoJSON = chinaCitiesRaw as unknown as GeoJSONFeatureCollection;
  return _geoJSON;
}

/** 获取所有市级数据（含省份、经纬度）—— 不过滤，含全部要素 */
export function getCityList(): CityEntry[] {
  if (_cityList) return _cityList;

  const raw = chinaCitiesRaw as unknown as GeoJSONFeatureCollection;
  const cities: CityEntry[] = [];

  for (const f of raw.features) {
    const props = f.properties as Record<string, unknown> | null;
    const name = String(props?.['name'] ?? '');
    const gb = String(props?.['gb'] ?? '');
    const stdCode = extractStandardCode(gb);
    const provCode = stdCode.slice(0, 2);
    const province = PROVINCE_CODE_MAP[provCode] || '';
    const centroid = computeCentroid(f.geometry);

    cities.push({
      name,
      fullname: name,
      pinyin: '',
      code: stdCode,
      province,
      lng: centroid.lng,
      lat: centroid.lat,
    });
  }

  _cityList = cities;
  return cities;
}

/** 模糊搜索市级行政区划 */
export function searchCities(query: string): CityEntry[] {
  const list = getCityList();
  const q = query.toLowerCase();
  return list
    .filter(c =>
      c.name.includes(query) ||
      c.fullname.includes(query) ||
      c.pinyin.includes(q) ||
      c.province.includes(query)
    )
    .slice(0, 15);
}

/** 模糊搜索（兼容旧接口，返回 GeoPlace 格式） */
export function searchPlaces(query: string): GeoPlace[] {
  const cities = searchCities(query);
  return cities.map(c => ({
    name: c.name,
    fullname: c.fullname,
    lat: c.lat,
    lng: c.lng,
    level: 2,
  }));
}

/** 获取所有省份名（去重排序） */
export function getProvinces(): string[] {
  if (_provinceList) return _provinceList;
  const list = getCityList();
  _provinceList = [...new Set(list.map(c => c.province).filter(Boolean))].sort();
  return _provinceList;
}
