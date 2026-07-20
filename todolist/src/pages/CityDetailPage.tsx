import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Rate, Space, Modal, Popconfirm, Empty, Spin } from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  PlusOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTravelStore } from '@/stores/travelStore';
import CityNoteEditor from '@/components/travel/CityNoteEditor';
import type { CityNote, CreateCityNoteParams, UpdateCityNoteParams } from '@/types/travel';

const { Title, Text, Paragraph } = Typography;

export default function CityDetailPage() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const { cityDetail, selectedCityId, selectCity, remove, addNote, updateNote, removeNote } = useTravelStore();

  const [loading, setLoading] = useState(true);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CityNote | null>(null);

  useEffect(() => {
    if (cityId) {
      setLoading(true);
      selectCity(cityId).finally(() => setLoading(false));
    }
  }, [cityId, selectCity]);

  // 新增笔记
  const handleAddNote = useCallback(async (params: CreateCityNoteParams | { id: string; params: UpdateCityNoteParams }) => {
    if ('id' in params) {
      await updateNote(params.id, params.params);
    } else {
      await addNote(params as CreateCityNoteParams);
    }
  }, [addNote, updateNote]);

  // 编辑笔记
  const handleEditNote = useCallback((note: CityNote) => {
    setEditingNote(note);
    setNoteEditorOpen(true);
  }, []);

  // 删除城市
  const handleDelete = useCallback(async () => {
    if (!cityId) return;
    try {
      await remove(cityId);
      navigate('/travel', { replace: true });
    } catch (e) {
      // error handled by store
    }
  }, [cityId, remove, navigate]);

  if (loading) {
    return (
      <div className="page-bg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!cityDetail) {
    return (
      <div className="page-bg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description="城市未找到">
          <Button onClick={() => navigate('/travel')}>返回地图</Button>
        </Empty>
      </div>
    );
  }

  const { city, notes } = cityDetail;

  return (
    <div className="page-bg" style={{ height: '100%', overflowY: 'auto', padding: '0 28px 28px' }}>
      {/* 顶栏 */}
      <div className="page-header" style={{ padding: '28px 0' }}>
        <Space size={16} align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/travel')}
            style={{ borderRadius: 10 }}
          >
            返回地图
          </Button>
          <EnvironmentOutlined style={{ fontSize: 22, color: city.color }} />
          <Title level={4} style={{ margin: 0 }}>
            {city.city_name}
            {city.is_highlighted && ' ⭐'}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {city.province} · {city.country}
          </Text>
        </Space>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => { /* handled by inline editor for now */ }} style={{ borderRadius: 10 }}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个城市吗？"
            description="关联的旅记也会一并删除"
            onConfirm={handleDelete}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 10 }}>删除</Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 主体双栏 */}
      <div style={{ display: 'flex', gap: 24 }}>
        {/* 左栏：城市信息 */}
        <div style={{ width: 360, flexShrink: 0 }}>
          {/* 基本信息卡片 */}
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              城市信息
            </Text>

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {city.visit_date && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>首次到访</Text>
                  <br />
                  <Text style={{ fontSize: 15, fontWeight: 500 }}>
                    {dayjs(city.visit_date).format('YYYY-MM-DD')}
                  </Text>
                </div>
              )}

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>评分</Text>
                <br />
                {city.rating > 0 ? (
                  <Rate disabled value={city.rating} style={{ fontSize: 16 }} />
                ) : (
                  <Text type="secondary" style={{ fontSize: 13 }}>未评分</Text>
                )}
              </div>

              {city.notes && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>印象</Text>
                  <Paragraph style={{ marginTop: 4, marginBottom: 0, fontSize: 14, color: 'var(--text-primary)' }}>
                    {city.notes}
                  </Paragraph>
                </div>
              )}
            </div>
          </div>

          {/* 旅记列表 */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                旅记 ({notes.length})
              </Text>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => { setEditingNote(null); setNoteEditorOpen(true); }}
                style={{ borderRadius: 8 }}
              >
                新增
              </Button>
            </div>

            {notes.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 13 }}>暂无旅记，点击上方按钮添加</Text>
            ) : (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => handleEditNote(note)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s var(--ease-out)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <Text strong style={{ fontSize: 13 }}>{note.title || '(无标题)'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {note.note_date ? dayjs(note.note_date).format('YYYY-MM-DD') : ''}
                      {note.content && ` · ${note.content.slice(0, 50)}${note.content.length > 50 ? '...' : ''}`}
                    </Text>
                  </div>
                ))}
              </Space>
            )}
          </div>
        </div>

        {/* 右栏：旅游攻略 */}
        <div className="glass-card" style={{ flex: 1, padding: 20 }}>
          <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 12 }}>
            旅游攻略
          </Text>
          {city.travel_guide ? (
            <Paragraph style={{ fontSize: 14, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {city.travel_guide}
            </Paragraph>
          ) : (
            <Text type="secondary" style={{ fontSize: 13 }}>
              暂无攻略。点击"编辑"按钮添加旅游攻略~
            </Text>
          )}
        </div>
      </div>

      {/* 旅记编辑器 Modal */}
      {cityId && (
        <CityNoteEditor
          open={noteEditorOpen}
          note={editingNote}
          cityId={cityId}
          onSave={handleAddNote}
          onClose={() => { setNoteEditorOpen(false); setEditingNote(null); }}
        />
      )}
    </div>
  );
}
