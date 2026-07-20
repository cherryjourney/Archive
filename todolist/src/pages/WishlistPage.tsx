import { useEffect, useState, useMemo } from 'react';
import {
  Typography, Button, Modal, Input, InputNumber, Select, DatePicker,
  Tabs, Empty, Spin, message, Popconfirm, Tag, Tooltip,
} from 'antd';
import {
  PlusOutlined, EnvironmentOutlined, CheckCircleOutlined,
  EditOutlined, DeleteOutlined, HeartOutlined, CalendarOutlined,
  DollarOutlined, TeamOutlined, StarOutlined, GlobalOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTravelStore } from '@/stores/travelStore';
import type { WishlistItem, CreateWishlistParams, UpdateWishlistParams } from '@/types/travel';

const { Text, Title } = Typography;
const { TextArea } = Input;

const SEASONS = [
  { label: '🌸 春季 (3-5月)', value: '春季' },
  { label: '☀️ 夏季 (6-8月)', value: '夏季' },
  { label: '🍂 秋季 (9-11月)', value: '秋季' },
  { label: '❄️ 冬季 (12-2月)', value: '冬季' },
  { label: '📅 全年皆宜', value: '全年' },
];

const COUNTRY_OPTIONS = [
  { label: '🇨🇳 中国', value: '中国' },
  { label: '🇯🇵 日本', value: '日本' },
  { label: '🇰🇷 韩国', value: '韩国' },
  { label: '🇹🇭 泰国', value: '泰国' },
  { label: '🇻🇳 越南', value: '越南' },
  { label: '🇸🇬 新加坡', value: '新加坡' },
  { label: '🇲🇾 马来西亚', value: '马来西亚' },
  { label: '🇮🇩 印度尼西亚', value: '印度尼西亚' },
  { label: '🇫🇷 法国', value: '法国' },
  { label: '🇮🇹 意大利', value: '意大利' },
  { label: '🇨🇭 瑞士', value: '瑞士' },
  { label: '🇬🇧 英国', value: '英国' },
  { label: '🇺🇸 美国', value: '美国' },
  { label: '🇦🇺 澳大利亚', value: '澳大利亚' },
  { label: '🇳🇿 新西兰', value: '新西兰' },
];

// ── Wishlist Card ────────────────────────────────────

function WishlistCard({
  item,
  onEdit,
  onDelete,
  onMarkVisited,
}: {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onMarkVisited: (id: string) => void;
}) {
  const isVisited = item.is_visited;

  return (
    <div
      style={{
        background: isVisited ? 'var(--color-surface, #F8FAFC)' : 'var(--color-surface, #fff)',
        borderRadius: 14,
        border: isVisited
          ? '1px solid var(--color-border-light, #E2E8F0)'
          : '1px solid var(--color-border, #CBD5E1)',
        padding: '18px 20px',
        opacity: isVisited ? 0.72 : 1,
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Visited badge */}
      {isVisited && (
        <div
          style={{
            position: 'absolute', top: -10, right: 16,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#fff', fontSize: 11, fontWeight: 600,
            padding: '3px 12px', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
          }}
        >
          <CheckCircleOutlined /> 已去 {item.visited_date || ''}
        </div>
      )}

      {/* Header: city name + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{item.country === '中国' ? '🏙️' : '🌏'}</span>
          <div>
            <Text strong style={{ fontSize: 16, color: 'var(--color-foreground, #1E293B)' }}>
              {item.city_name}
            </Text>
            {item.province && (
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                {item.province}
              </Text>
            )}
          </div>
        </div>

        {!isVisited && (
          <div style={{ display: 'flex', gap: 4 }}>
            <Tooltip title="标记已去">
              <Popconfirm
                title="标记为已去过？"
                description="将自动记录今天为访问日期"
                onConfirm={() => onMarkVisited(item.id)}
                okText="是的，去过了"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#10B981' }}
                />
              </Popconfirm>
            </Tooltip>
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(item)}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Popconfirm
                title="确定删除？"
                onConfirm={() => onDelete(item.id)}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </div>
        )}

        {isVisited && (
          <div style={{ display: 'flex', gap: 4 }}>
            <Tooltip title="删除">
              <Popconfirm
                title="确定删除？"
                onConfirm={() => onDelete(item.id)}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Detail tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {item.reason && (
          <Tag
            icon={<HeartOutlined />}
            color="magenta"
            style={{ borderRadius: 8, padding: '2px 10px', fontSize: 12, margin: 0 }}
          >
            {item.reason}
          </Tag>
        )}
        {item.best_season && (
          <Tag
            icon={<CalendarOutlined />}
            color="blue"
            style={{ borderRadius: 8, padding: '2px 10px', fontSize: 12, margin: 0 }}
          >
            {item.best_season}
          </Tag>
        )}
        {item.budget > 0 && (
          <Tag
            icon={<DollarOutlined />}
            color="orange"
            style={{ borderRadius: 8, padding: '2px 10px', fontSize: 12, margin: 0 }}
          >
            ¥{item.budget.toLocaleString()}
          </Tag>
        )}
        {item.companions && (
          <Tag
            icon={<TeamOutlined />}
            color="purple"
            style={{ borderRadius: 8, padding: '2px 10px', fontSize: 12, margin: 0 }}
          >
            {item.companions}
          </Tag>
        )}
      </div>
    </div>
  );
}

// ── Add/Edit Modal ───────────────────────────────────

function WishlistFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: WishlistItem | null;
  onClose: () => void;
  onSubmit: (params: CreateWishlistParams | UpdateWishlistParams, id?: string) => Promise<void>;
}) {
  const [cityName, setCityName] = useState('');
  const [country, setCountry] = useState('中国');
  const [province, setProvince] = useState('');
  const [reason, setReason] = useState('');
  const [bestSeason, setBestSeason] = useState('');
  const [budget, setBudget] = useState<number | null>(null);
  const [companions, setCompanions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setCityName(editing.city_name);
      setCountry(editing.country);
      setProvince(editing.province);
      setReason(editing.reason);
      setBestSeason(editing.best_season);
      setBudget(editing.budget || null);
      setCompanions(editing.companions);
    } else {
      setCityName('');
      setCountry('中国');
      setProvince('');
      setReason('');
      setBestSeason('');
      setBudget(null);
      setCompanions('');
    }
  }, [editing, open]);

  const handleSubmit = async () => {
    if (!cityName.trim()) {
      message.warning('请输入城市名称');
      return;
    }
    setSubmitting(true);
    try {
      const params: CreateWishlistParams = {
        city_name: cityName.trim(),
        country,
        province: province.trim(),
        reason: reason.trim(),
        best_season: bestSeason,
        budget: budget ?? 0,
        companions: companions.trim(),
      };
      await onSubmit(params, editing?.id);
      onClose();
    } catch {
      // error handled by store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editing ? '编辑目的地' : '添加想去的地方'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={editing ? '保存' : '添加'}
      cancelText="取消"
      destroyOnClose
      width={480}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>城市名称 *</Text>
            <Input
              value={cityName}
              onChange={e => setCityName(e.target.value)}
              placeholder="如：大理、京都"
              prefix={<EnvironmentOutlined />}
            />
          </div>
          <div style={{ width: 140 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>国家</Text>
            <Select
              value={country}
              onChange={setCountry}
              showSearch
              style={{ width: '100%' }}
              options={COUNTRY_OPTIONS}
            />
          </div>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>省份/地区</Text>
          <Input
            value={province}
            onChange={e => setProvince(e.target.value)}
            placeholder={country === '中国' ? '如：云南、浙江' : '如：关东、加州'}
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            <HeartOutlined style={{ marginRight: 4 }} />想去的原因
          </Text>
          <Input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="如：想看洱海日出、赏樱"
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              <CalendarOutlined style={{ marginRight: 4 }} />最佳季节
            </Text>
            <Select
              value={bestSeason || undefined}
              onChange={setBestSeason}
              placeholder="选择季节"
              allowClear
              style={{ width: '100%' }}
              options={SEASONS}
            />
          </div>
          <div style={{ width: 160 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              <DollarOutlined style={{ marginRight: 4 }} />预算预估 (¥)
            </Text>
            <InputNumber
              value={budget}
              onChange={v => setBudget(v)}
              placeholder="如：5000"
              min={0}
              step={1000}
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value?.replace(/,/g, '') as any}
            />
          </div>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            <TeamOutlined style={{ marginRight: 4 }} />同行人
          </Text>
          <Input
            value={companions}
            onChange={e => setCompanions(e.target.value)}
            placeholder="如：和家人、和朋友、独自"
          />
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────

export default function WishlistPage() {
  const store = useTravelStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [activeTab, setActiveTab] = useState<'domestic' | 'international'>('domestic');

  useEffect(() => {
    store.fetchWishlist();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { domestic, international } = useMemo(() => {
    const d = store.wishlist.filter(w => w.country === '中国');
    const i = store.wishlist.filter(w => w.country !== '中国');
    return { domestic: d, international: i };
  }, [store.wishlist]);

  const currentList = activeTab === 'domestic' ? domestic : international;
  const wantToGo = useMemo(() => currentList.filter(w => !w.is_visited), [currentList]);
  const haveBeen = useMemo(() => currentList.filter(w => w.is_visited), [currentList]);

  const totalWant = store.wishlist.filter(w => !w.is_visited).length;
  const totalVisited = store.wishlist.filter(w => w.is_visited).length;

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: WishlistItem) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = async (params: CreateWishlistParams | UpdateWishlistParams, id?: string) => {
    if (id) {
      await store.updateWishlist(id, params as UpdateWishlistParams);
      message.success('已更新');
    } else {
      await store.createWishlist(params as CreateWishlistParams);
      message.success('已添加');
    }
  };

  const handleDelete = async (id: string) => {
    await store.removeWishlist(id);
    message.success('已删除');
  };

  const handleMarkVisited = async (id: string) => {
    const today = dayjs().format('YYYY-MM-DD');
    await store.markVisited(id, today);
    message.success('已标记为去过！城市已自动添加到旅行地图');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--color-foreground, #1E293B)' }}>
            🗺️ 想去的地方
          </h1>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
            记录想去的远方，去过之后打勾标记，自动同步到旅行地图
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
          添加目的地
        </Button>
      </div>

      {/* Stats chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 20,
          background: 'var(--bg-glass-strong)',
          border: '1px solid var(--border-subtle)',
        }}>
          <HeartOutlined style={{ color: '#EC4899', fontSize: 14 }} />
          <Text strong style={{ fontSize: 14, color: '#EC4899' }}>{totalWant}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>想去</Text>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 20,
          background: 'var(--bg-glass-strong)',
          border: '1px solid var(--border-subtle)',
        }}>
          <CheckCircleOutlined style={{ color: '#10B981', fontSize: 14 }} />
          <Text strong style={{ fontSize: 14, color: '#10B981' }}>{totalVisited}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>已去</Text>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 20,
          background: 'var(--bg-glass-strong)',
          border: '1px solid var(--border-subtle)',
        }}>
          <GlobalOutlined style={{ color: '#3B82F6', fontSize: 14 }} />
          <Text strong style={{ fontSize: 14, color: '#3B82F6' }}>{domestic.length + international.length}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>总计</Text>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={k => setActiveTab(k as 'domestic' | 'international')}
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'domestic',
            label: (
              <span>
                <HomeOutlined style={{ marginRight: 6 }} />
                国内 ({domestic.filter(w => !w.is_visited).length} 想去 / {domestic.filter(w => w.is_visited).length} 已去)
              </span>
            ),
          },
          {
            key: 'international',
            label: (
              <span>
                <GlobalOutlined style={{ marginRight: 6 }} />
                国外 ({international.filter(w => !w.is_visited).length} 想去 / {international.filter(w => w.is_visited).length} 已去)
              </span>
            ),
          },
        ]}
      />

      {/* Content */}
      <Spin spinning={store.wishlistLoading}>
        {currentList.length === 0 ? (
          <Empty
            description={activeTab === 'domestic' ? '还没有添加国内想去的地方' : '还没有添加国外想去的地方'}
            style={{ marginTop: 60 }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加第一个目的地
            </Button>
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 想去 */}
            {wantToGo.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                  paddingBottom: 8, borderBottom: '1px solid var(--color-border-light, #E2E8F0)',
                }}>
                  <HeartOutlined style={{ color: '#EC4899', fontSize: 14 }} />
                  <Text strong style={{ fontSize: 14, color: 'var(--color-foreground, #1E293B)' }}>
                    想去
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>({wantToGo.length})</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {wantToGo.map(item => (
                    <WishlistCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMarkVisited={handleMarkVisited}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 已去 */}
            {haveBeen.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                  paddingBottom: 8, borderBottom: '1px solid var(--color-border-light, #E2E8F0)',
                }}>
                  <CheckCircleOutlined style={{ color: '#10B981', fontSize: 14 }} />
                  <Text strong style={{ fontSize: 14, color: 'var(--color-foreground, #1E293B)' }}>
                    已去
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>({haveBeen.length})</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {haveBeen.map(item => (
                    <WishlistCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMarkVisited={handleMarkVisited}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Spin>

      {/* Add/Edit Modal */}
      <WishlistFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
