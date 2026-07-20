import { Typography, Button } from 'antd';
import { CloseOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { VisitedCity } from '@/types/travel';

const { Text } = Typography;

interface CitySlidePanelProps {
  city: VisitedCity;
  onClose: () => void;
}

export default function CitySlidePanel({ city, onClose }: CitySlidePanelProps) {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1100,
      width: 'calc(100% - 24px)',
      maxWidth: 420,
      background: 'var(--bg-glass-strong)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border-default)',
      borderRadius: 20,
      padding: '18px 22px',
      boxShadow: 'var(--shadow-lg), 0 0 40px rgba(0,0,0,0.06)',
      animation: 'fadeSlideIn 0.22s var(--ease-out)',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 10, right: 14,
          background: 'var(--bg-muted)', border: 'none',
          borderRadius: '50%', width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14,
          transition: 'all 0.15s var(--ease-out)',
        }}
      >
        <CloseOutlined />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          backgroundColor: city.color, flexShrink: 0,
          boxShadow: `0 0 8px ${city.color}60`,
        }} />
        <Text strong style={{ fontSize: 16 }}>
          {city.city_name}
          {city.is_highlighted && ' ⭐'}
        </Text>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          📍 {city.province}
        </Text>
        {city.visit_date && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            🗓 {city.visit_date}
          </Text>
        )}
        {city.rating > 0 && (
          <span style={{ fontSize: 12, color: '#F59E0B' }}>
            {'★'.repeat(city.rating)}
          </span>
        )}
      </div>

      {city.notes && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12, lineHeight: 1.5 }}>
          {city.notes.length > 80 ? city.notes.slice(0, 80) + '...' : city.notes}
        </Text>
      )}

      <Button
        type="primary"
        size="small"
        icon={<RightOutlined />}
        onClick={() => navigate(`/travel/${city.id}`)}
        style={{ borderRadius: 8 }}
      >
        查看详情
      </Button>
    </div>
  );
}
