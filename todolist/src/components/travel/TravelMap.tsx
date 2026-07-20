import { useMemo, useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { Spin } from 'antd';
import type { VisitedCity } from '@/types/travel';
import { getChinaGeoJSON, getCityList, MAP_APPROVAL_NUMBER } from '@/utils/geoData';
import type { CityEntry } from '@/utils/geoData';

interface Props {
  cities: VisitedCity[];
  onCityClick: (city: VisitedCity) => void;
  filteredCities?: VisitedCity[];
  /** 点击地图上未标记的城市时触发，传入城市基本信息用于预填添加表单 */
  onUnvisitedCityClick?: (info: { name: string; province: string; lat: number; lng: number }) => void;
}

// ── 常量 ────────────────────────────────────────

const MAP_NAME = 'china-cities';
const DEFAULT_CENTER: [number, number] = [104.19, 35.86];

/** 省份默认色（访问过的省份用浅底色区分） */
const PROVINCE_TINT = '#EEF2FF';

// ── 辅助 ────────────────────────────────────────

function buildProvinceStats(cities: VisitedCity[]) {
  const map = new Map<string, { count: number; color: string }>();
  for (const c of cities) {
    const prev = map.get(c.province);
    if (prev) {
      prev.count++;
    } else {
      map.set(c.province, { count: 1, color: c.color });
    }
  }
  return map;
}

// ── 组件 ────────────────────────────────────────

export default function TravelMap({ cities, onCityClick, filteredCities, onUnvisitedCityClick }: Props) {
  const chartRef = useRef<ReactECharts>(null);
  const [mapReady, setMapReady] = useState(false);
  const cityByName = useRef<Map<string, VisitedCity>>(new Map());
  /** 所有 GeoJSON 城市名 → CityEntry（含经纬度） */
  const allCityMap = useRef<Map<string, CityEntry>>(new Map());

  // 注册 GeoJSON（仅一次）
  useEffect(() => {
    echarts.registerMap(MAP_NAME, getChinaGeoJSON() as any);
    const list = getCityList();
    const amap = new Map<string, CityEntry>();
    list.forEach(c => amap.set(c.name, c));
    allCityMap.current = amap;
    setMapReady(true);
  }, []);

  // 同步 cityByName
  useEffect(() => {
    const map = new Map<string, VisitedCity>();
    cities.forEach(c => map.set(c.city_name, c));
    cityByName.current = map;
  }, [cities]);

  // ── ECharts option ────────────────────────────

  const option = useMemo(() => {
    const displayCities = filteredCities ?? cities;
    const provinceStats = buildProvinceStats(cities);
    const nameToCity = new Map(cities.map(c => [c.city_name, c]));

    const visitedProvinceNames = new Set(provinceStats.keys());
    const regions: any[] = [];

    // 已访问省份的其他城市 → 淡色底
    for (const [cityName, entry] of allCityMap.current) {
      if (visitedProvinceNames.has(entry.province) && !nameToCity.has(cityName)) {
        regions.push({
          name: cityName,
          itemStyle: { areaColor: PROVINCE_TINT, borderColor: '#C7D2FE', borderWidth: 0.4 },
          silent: false, // 允许点击未标记城市
        });
      }
    }

    // 已标记城市
    for (const c of displayCities) {
      regions.push({
        name: c.city_name,
        itemStyle: {
          areaColor: c.color,
          borderColor: c.color,
          borderWidth: 1.5,
          shadowBlur: 6,
          shadowColor: c.color + '40',
        },
        label: {
          show: cities.length <= 30,
          color: '#fff',
          fontSize: 10,
          textShadowColor: 'rgba(0,0,0,0.25)',
          textShadowBlur: 2,
        },
        emphasis: {
          itemStyle: {
            areaColor: c.color,
            borderWidth: 3,
            shadowBlur: 14,
            shadowColor: c.color + '60',
          },
        },
      });
    }

    // 为未被 regions 覆盖的城市加 hover 提示（默认样式但可点击）
    const regionNames = new Set(regions.map((r: any) => r.name));

    return {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: 'rgba(15,23,42,0.92)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#F1F5F9', fontSize: 12 },
        formatter: (params: any) => {
          const name = params.name ?? params.region?.name ?? '';
          const c = cityByName.current.get(name);
          if (c) {
            return [
              `<div style="font-size:14px;font-weight:700;margin-bottom:4px">${c.city_name}${c.is_highlighted ? ' ⭐' : ''}</div>`,
              `<div style="font-size:11px;color:#94A3B8">${c.province}</div>`,
              c.visit_date ? `<div style="font-size:11px;color:#94A3B8;margin-top:2px">首次到访：${c.visit_date}</div>` : '',
            ].join('');
          }
          const entry = allCityMap.current.get(name);
          if (entry) {
            const visited = visitedProvinceNames.has(entry.province);
            if (visited) {
              return `<div style="font-size:13px;font-weight:600">${name}</div><div style="font-size:11px;color:#6366F1">${entry.province} · 已解锁</div><div style="font-size:10px;color:#94A3B8;margin-top:4px">点击标记此城市</div>`;
            }
            return `<div style="font-size:13px;font-weight:600">${name}</div><div style="font-size:11px;color:#94A3B8">${entry.province}</div><div style="font-size:10px;color:#6366F1;margin-top:4px">点击标记此城市</div>`;
          }
          return `<div style="font-size:13px">${name ?? ''}</div>`;
        },
      },
      geo: {
        map: MAP_NAME,
        roam: true,
        center: DEFAULT_CENTER,
        zoom: 1.2,
        scaleLimit: { min: 0.6, max: 14 },
        itemStyle: {
          areaColor: '#F8FAFC',
          borderColor: '#CBD5E1',
          borderWidth: 0.5,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#E2E8F0',
            borderColor: '#94A3B8',
            borderWidth: 1,
          },
          label: {
            show: true,
            color: '#64748B',
            fontSize: 10,
          },
        },
        regions,
      },
      series: [],
      graphic: [
        {
          type: 'text' as const,
          right: 10, bottom: 10,
          style: {
            text: `审图号：${MAP_APPROVAL_NUMBER}`,
            font: '10px sans-serif',
            fill: '#9CA3AF',
          },
        },
      ],
    };
  }, [cities, filteredCities]);

  // ── 初始自动 fit ──────────────────────────────

  useEffect(() => {
    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) return;

    const timer = setTimeout(() => {
      if (cities.length > 0) {
        const lngs = cities.map(c => c.lng).filter(Boolean);
        const lats = cities.map(c => c.lat).filter(Boolean);
        if (lngs.length === 0) return;
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const w = maxLng - minLng || 1;
        const h = maxLat - minLat || 1;
        const zoom = Math.min(360 / w * 0.55, 180 / h * 0.55, 10);

        instance.setOption({
          geo: { center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2], zoom },
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [cities.length === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 点击事件 ───────────────────────────────────

  const onEvents = useMemo(() => ({
    click: (params: any) => {
      const name = params.name ?? params.region?.name ?? '';
      if (!name) return;

      // 已访问城市 → 显示详情
      const visited = cityByName.current.get(name);
      if (visited) {
        onCityClick(visited);
        return;
      }

      // 未访问但在地图中的城市 → 弹出添加对话框
      if (onUnvisitedCityClick) {
        const entry = allCityMap.current.get(name);
        if (entry) {
          onUnvisitedCityClick({
            name: entry.name,
            province: entry.province,
            lat: entry.lat,
            lng: entry.lng,
          });
        }
      }
    },
  }), [onCityClick, onUnvisitedCityClick]);

  if (!mapReady) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip="加载地图数据…" />
      </div>
    );
  }

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      onEvents={onEvents}
      style={{ width: '100%', height: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
