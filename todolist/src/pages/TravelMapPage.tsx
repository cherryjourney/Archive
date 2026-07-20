import { useEffect, useState, useMemo, useCallback } from 'react';
import { Typography, Button, Select, Modal, Input, DatePicker, Rate, Space, Empty, message, Popover } from 'antd';
import {
  PlusOutlined, EnvironmentOutlined, FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import TravelMap from '@/components/travel/TravelMap';
import CitySlidePanel from '@/components/travel/CitySlidePanel';
import CityListPanel from '@/components/travel/CityListPanel';
import { useTravelStore } from '@/stores/travelStore';
import { searchCities } from '@/utils/geoData';
import type { VisitedCity } from '@/types/travel';
import type { CityEntry } from '@/utils/geoData';

const { Text } = Typography;
const { TextArea } = Input;

const CITY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EC4899',
  '#8B5CF6', '#EF4444', '#06B6D4', '#F97316',
];

const PANEL_WIDTH = 320;

// ── 统计芯片 ────────────────────────────────────

function StatsChip({ cities }: { cities: VisitedCity[] }) {
  const provinceCount = useMemo(() => new Set(cities.map(c => c.province).filter(Boolean)).size, [cities]);
  const highlightedCount = useMemo(() => cities.filter(c => c.is_highlighted).length, [cities]);

  if (cities.length === 0) return null;

  return (
    <div style={{
      display: 'flex', gap: 6, alignItems: 'center',
      padding: '6px 14px',
      borderRadius: 20,
      background: 'var(--bg-glass-strong)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <Text strong style={{ fontSize: 14, color: 'var(--color-primary)' }}>{cities.length}</Text>
      <Text type="secondary" style={{ fontSize: 11 }}>城市</Text>
      <span style={{ width: 1, height: 12, background: 'var(--border-default)', borderRadius: 1 }} />
      <Text strong style={{ fontSize: 14, color: 'var(--color-accent)' }}>{provinceCount}</Text>
      <Text type="secondary" style={{ fontSize: 11 }}>省份</Text>
      {highlightedCount > 0 && (
        <>
          <span style={{ width: 1, height: 12, background: 'var(--border-default)', borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: '#F59E0B' }}>&#9733;</span>
          <Text strong style={{ fontSize: 14, color: '#F59E0B' }}>{highlightedCount}</Text>
        </>
      )}
    </div>
  );
}

// ── 统一城市表单 Modal ──────────────────────────

interface CityFormModalProps {
  open: boolean;
  editingCity: VisitedCity | null;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  // form state & setters
  citySearch: string;
  onCitySearch: (value: string) => void;
  searchResults: CityEntry[];
  onSelectPlace: (place: CityEntry) => void;
  formName: string; setFormName: (v: string) => void;
  formProvince: string; setFormProvince: (v: string) => void;
  formLat: number; setFormLat: (v: number) => void;
  formLng: number; setFormLng: (v: number) => void;
  formDate: string | null; setFormDate: (v: string | null) => void;
  formRating: number; setFormRating: (v: number) => void;
  formColor: string; setFormColor: (v: string) => void;
  formNotes: string; setFormNotes: (v: string) => void;
}

function CityFormModal({
  open,
  editingCity,
  onCancel,
  onSave,
  saving,
  citySearch,
  onCitySearch,
  searchResults,
  onSelectPlace,
  formName, setFormName,
  formProvince, setFormProvince,
  formLat, setFormLat,
  formLng, setFormLng,
  formDate, setFormDate,
  formRating, setFormRating,
  formColor, setFormColor,
  formNotes, setFormNotes,
}: CityFormModalProps) {
  const isCreate = !editingCity;
  return (
    <Modal
      title={isCreate ? '标记去过的城市' : '编辑城市信息'}
      open={open}
      onCancel={onCancel}
      onOk={onSave}
      confirmLoading={saving}
      okText={isCreate ? '标记' : '保存'}
      cancelText="取消"
      width={460}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
        {/* 提示：仅创建模式显示 */}
        {isCreate && (
          <div style={{
            fontSize: 12, color: 'var(--color-primary)',
            background: 'var(--color-primary-bg)',
            padding: '8px 12px', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <EnvironmentOutlined />
            点击地图上任意城市可快速填入信息
          </div>
        )}

        {/* 搜索：仅创建模式显示 */}
        {isCreate && (
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>搜索城市/省份</Text>
            <Input
              placeholder="输入城市名搜索..."
              value={citySearch}
              onChange={e => onCitySearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div style={{
                border: '1px solid var(--border-default)',
                borderRadius: 10, marginTop: 4,
                maxHeight: 160, overflowY: 'auto',
              }}>
                {searchResults.map(p => (
                  <div
                    key={p.code}
                    onClick={() => onSelectPlace(p)}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <Text strong>{p.name}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>{p.province}</Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Space size={12}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>城市名</Text>
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="如：大理" style={{ width: 140 }} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>省份</Text>
            <Input value={formProvince} onChange={e => setFormProvince(e.target.value)} placeholder="如：云南" style={{ width: 140 }} />
          </div>
        </Space>
        <Space size={12}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>纬度</Text>
            <Input type="number" value={formLat || ''} onChange={e => setFormLat(parseFloat(e.target.value) || 0)} style={{ width: 140 }} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>经度</Text>
            <Input type="number" value={formLng || ''} onChange={e => setFormLng(parseFloat(e.target.value) || 0)} style={{ width: 140 }} />
          </div>
        </Space>
        <Space size={12} align="start">
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>首次到访</Text>
            <DatePicker
              value={formDate ? dayjs(formDate) : null}
              onChange={d => setFormDate(d ? d.format('YYYY-MM-DD') : null)}
              style={{ width: 140 }} placeholder="选填"
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>评分</Text>
            <Rate value={formRating} onChange={setFormRating} style={{ fontSize: 16 }} />
          </div>
        </Space>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>标记颜色</Text>
          <Space size={6}>
            {CITY_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setFormColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: c,
                  border: formColor === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                  cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </Space>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>备注</Text>
          <TextArea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="印象、记忆..." rows={3} />
        </div>
      </div>
    </Modal>
  );
}

// ── 页面主体 ────────────────────────────────────

export default function TravelMapPage() {
  const navigate = useNavigate();
  const { cities, loading, fetchAll, create, update } = useTravelStore();

  const [sortBy, setSortBy] = useState<string>('time');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<VisitedCity | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  // Modal — unified create/edit
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<VisitedCity | null>(null);

  // 表单
  const [citySearch, setCitySearch] = useState('');
  const [searchResults, setSearchResults] = useState<CityEntry[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<CityEntry | null>(null);
  const [formName, setFormName] = useState('');
  const [formProvince, setFormProvince] = useState('');
  const [formLat, setFormLat] = useState(0);
  const [formLng, setFormLng] = useState(0);
  const [formDate, setFormDate] = useState<string | null>(null);
  const [formRating, setFormRating] = useState(0);
  const [formColor, setFormColor] = useState(CITY_COLORS[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 筛选排序
  const sortedCities = useMemo(() => {
    let list = [...cities];
    if (filterProvince !== 'all') {
      list = list.filter(c => c.province === filterProvince);
    }
    if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else {
      list.sort((a, b) => (b.visit_date || '').localeCompare(a.visit_date || ''));
    }
    return list;
  }, [cities, filterProvince, sortBy]);

  const provinces = useMemo(() => {
    const set = new Set(cities.map(c => c.province).filter(Boolean));
    return [...set].sort();
  }, [cities]);

  // ── 搜索 ─────────────────────────────────────

  const handleCitySearch = useCallback((value: string) => {
    setCitySearch(value);
    setSearchResults(value.trim().length >= 1 ? searchCities(value.trim()) : []);
  }, []);

  const handleSelectPlace = useCallback((place: CityEntry) => {
    setSelectedPlace(place);
    setFormName(place.name);
    setFormProvince(place.province);
    setFormLat(place.lat);
    setFormLng(place.lng);
    setCitySearch(`${place.name} · ${place.province}`);
    setSearchResults([]);
  }, []);

  const resetAddForm = useCallback(() => {
    setCitySearch(''); setSearchResults([]); setSelectedPlace(null);
    setFormName(''); setFormProvince(''); setFormLat(0); setFormLng(0);
    setFormDate(null); setFormRating(0); setFormColor(CITY_COLORS[0]); setFormNotes('');
  }, []);

  // ── 打开创建 Modal ────────────────────────────

  const openCreateModal = useCallback(() => {
    setEditingCity(null);
    resetAddForm();
    setFormModalOpen(true);
  }, [resetAddForm]);

  // ── 点击地图未标记城市 → 预填表单并打开 Modal ──

  const handleUnvisitedCityClick = useCallback((info: { name: string; province: string; lat: number; lng: number }) => {
    resetAddForm();
    setFormName(info.name);
    setFormProvince(info.province);
    setFormLat(info.lat);
    setFormLng(info.lng);
    setCitySearch(`${info.name} · ${info.province}`);
    setEditingCity(null);
    setFormModalOpen(true);
  }, [resetAddForm]);

  // ── 编辑 ─────────────────────────────────────

  const handleEditCity = useCallback((city: VisitedCity) => {
    setEditingCity(city);
    setFormName(city.city_name); setFormProvince(city.province);
    setFormLat(city.lat); setFormLng(city.lng);
    setFormDate(city.visit_date); setFormRating(city.rating);
    setFormColor(city.color); setFormNotes(city.notes);
    setCitySearch(`${city.city_name} · ${city.province}`);
    setSearchResults([]);
    setFormModalOpen(true);
  }, []);

  // ── 保存 ─────────────────────────────────────

  const handleFormSave = useCallback(async () => {
    if (!formName.trim()) { message.warning('请输入城市名称'); return; }
    setFormSaving(true);
    try {
      if (editingCity) {
        await update(editingCity.id, {
          city_name: formName.trim(), province: formProvince,
          lat: formLat, lng: formLng,
          visit_date: formDate, rating: formRating,
          color: formColor, notes: formNotes,
        });
        message.success('已更新');
        setSelectedCity(null);
      } else {
        await create({
          city_name: formName.trim(), province: formProvince,
          lat: formLat, lng: formLng,
          visit_date: formDate, rating: formRating,
          color: formColor, notes: formNotes,
        });
        message.success(`已标记 ${formName.trim()}`);
      }
      setFormModalOpen(false);
      setEditingCity(null);
      resetAddForm();
    } catch (e) {
      message.error((editingCity ? '更新' : '标记') + '失败: ' + String(e));
    } finally { setFormSaving(false); }
  }, [formName, formProvince, formLat, formLng, formDate, formRating, formColor, formNotes, editingCity, create, update, resetAddForm]);

  const handleFormCancel = useCallback(() => {
    setFormModalOpen(false);
    setEditingCity(null);
  }, []);

  // ── 地图交互 ─────────────────────────────────

  const handleMapClick = useCallback((city: VisitedCity) => {
    setSelectedCity(prev => prev?.id === city.id ? null : city);
  }, []);

  const handleCityListSelect = useCallback((city: VisitedCity) => {
    setSelectedCity(prev => prev?.id === city.id ? null : city);
  }, []);

  const handleCityListDoubleClick = useCallback((city: VisitedCity) => {
    navigate(`/travel/${city.id}`);
  }, [navigate]);

  // ── 渲染 ─────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* ═══ 悬浮玻璃顶栏 ═══ */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        right: panelOpen ? PANEL_WIDTH + 12 : 12,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderRadius: 16,
        background: 'var(--bg-glass-strong)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
        transition: 'right 0.25s var(--ease-out)',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EnvironmentOutlined style={{ fontSize: 20, color: 'var(--color-primary)' }} />
          <Text strong style={{ fontSize: 16, letterSpacing: -0.2 }}>
            旅行地图
          </Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatsChip cities={cities} />

          {cities.length > 0 && (
            <Popover
              trigger="click"
              placement="bottomRight"
              content={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>排序</Text>
                    <Select
                      size="small"
                      value={sortBy}
                      onChange={setSortBy}
                      style={{ width: '100%' }}
                      options={[
                        { value: 'time', label: '按时间' },
                        { value: 'rating', label: '按评分' },
                      ]}
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>省份</Text>
                    <Select
                      size="small"
                      value={filterProvince}
                      onChange={setFilterProvince}
                      style={{ width: '100%' }}
                      options={[
                        { value: 'all', label: '全部省份' },
                        ...provinces.map(p => ({ value: p, label: p })),
                      ]}
                    />
                  </div>
                </div>
              }
            >
              <button style={{
                width: 32, height: 32, borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-glass)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)',
                transition: 'all 0.15s var(--ease-out)',
              }}>
                <FilterOutlined style={{ fontSize: 14 }} />
              </button>
            </Popover>
          )}

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            style={{ borderRadius: 10, fontWeight: 500 }}
          >
            标记城市
          </Button>
        </div>
      </div>

      {/* ═══ 地图主体 ═══ */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <TravelMap
          cities={cities}
          filteredCities={sortedCities}
          onCityClick={handleMapClick}
          onUnvisitedCityClick={handleUnvisitedCityClick}
        />

        {/* 城市详情滑出面板 */}
        {selectedCity && (
          <CitySlidePanel
            city={selectedCity}
            onClose={() => setSelectedCity(null)}
          />
        )}

        {/* 右侧城市列表面板 */}
        <CityListPanel
          cities={sortedCities}
          selectedId={selectedCity?.id ?? null}
          onSelect={handleCityListSelect}
          onDoubleClick={handleCityListDoubleClick}
          isOpen={panelOpen}
          onToggle={() => setPanelOpen(o => !o)}
        />

        {/* 空状态 */}
        {!loading && cities.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000, pointerEvents: 'none',
          }}>
            <Empty
              description="还没有标记城市"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={openCreateModal} style={{ pointerEvents: 'auto' }}>
                开始标记
              </Button>
            </Empty>
          </div>
        )}
      </div>

      {/* ═══ 统一城市表单 Modal ═══ */}
      <CityFormModal
        open={formModalOpen}
        editingCity={editingCity}
        onCancel={handleFormCancel}
        onSave={handleFormSave}
        saving={formSaving}
        citySearch={citySearch}
        onCitySearch={handleCitySearch}
        searchResults={searchResults}
        onSelectPlace={handleSelectPlace}
        formName={formName} setFormName={setFormName}
        formProvince={formProvince} setFormProvince={setFormProvince}
        formLat={formLat} setFormLat={setFormLat}
        formLng={formLng} setFormLng={setFormLng}
        formDate={formDate} setFormDate={setFormDate}
        formRating={formRating} setFormRating={setFormRating}
        formColor={formColor} setFormColor={setFormColor}
        formNotes={formNotes} setFormNotes={setFormNotes}
      />
    </div>
  );
}
