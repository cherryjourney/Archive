import { Typography } from 'antd';
import { EnvironmentOutlined, RightOutlined, LeftOutlined } from '@ant-design/icons';
import type { VisitedCity } from '@/types/travel';

const { Text } = Typography;

const PANEL_WIDTH = 320;

interface CityListPanelProps {
  cities: VisitedCity[];
  selectedId: string | null;
  onSelect: (city: VisitedCity) => void;
  onDoubleClick: (city: VisitedCity) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function CityListPanel({
  cities,
  selectedId,
  onSelect,
  onDoubleClick,
  isOpen,
  onToggle,
}: CityListPanelProps) {
  return (
    <>
      {/* Toggle tab */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          right: isOpen ? PANEL_WIDTH : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          width: 28,
          height: 64,
          borderRadius: '10px 0 0 10px',
          border: '1px solid var(--border-default)',
          borderRight: 'none',
          background: 'var(--bg-glass-strong)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          transition: 'all 0.25s var(--ease-out)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {isOpen ? <RightOutlined style={{ fontSize: 12 }} /> : <LeftOutlined style={{ fontSize: 12 }} />}
      </button>

      {/* Panel */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: PANEL_WIDTH,
        zIndex: 999,
        background: 'var(--bg-glass-strong)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.25s var(--ease-out)',
        transform: isOpen ? 'translateX(0)' : `translateX(${PANEL_WIDTH}px)`,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ fontSize: 16, color: 'var(--color-primary)' }} />
            <Text strong style={{ fontSize: 15 }}>已标记</Text>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: 'var(--color-primary)',
              background: 'var(--color-primary-bg)',
              padding: '2px 8px', borderRadius: 10,
            }}>
              {cities.length}
            </span>
          </div>
          <button
            onClick={onToggle}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: 'none', background: 'var(--bg-muted)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: 14,
            }}
          >
            <RightOutlined />
          </button>
        </div>

        {/* City list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {cities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>暂无标记</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>点击地图上的城市来标记</Text>
            </div>
          ) : (
            cities.map(city => {
              const isActive = selectedId === city.id;
              return (
                <div
                  key={city.id}
                  onClick={() => onSelect(city)}
                  onDoubleClick={() => onDoubleClick(city)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: isActive ? `${city.color}14` : 'var(--bg-card)',
                    border: isActive
                      ? `1.5px solid ${city.color}`
                      : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s var(--ease-out)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: city.color, flexShrink: 0,
                      boxShadow: `0 0 6px ${city.color}50`,
                    }} />
                    <Text strong style={{ fontSize: 14, flex: 1 }}>
                      {city.city_name}
                      {city.is_highlighted && ' ⭐'}
                    </Text>
                    {city.rating > 0 && (
                      <span style={{ fontSize: 10, color: '#F59E0B', whiteSpace: 'nowrap' }}>
                        {'★'.repeat(city.rating)}
                      </span>
                    )}
                  </div>
                  <div style={{ marginLeft: 16 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {city.province}
                      {city.visit_date && ` · ${city.visit_date}`}
                    </Text>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
