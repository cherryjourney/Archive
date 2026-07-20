import { memo } from 'react';
import { Typography, Rate, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { VisitedCity } from '@/types/travel';

const { Text } = Typography;

interface Props {
  city: VisitedCity;
  onClose: () => void;
}

const CityInfoCard = memo(function CityInfoCard({ city, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        padding: '16px 20px',
        minWidth: 240,
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeSlideIn 0.2s var(--ease-out)',
      }}
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'absolute', top: 8, right: 12,
          background: 'none', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer',
          fontSize: 16, lineHeight: 1,
        }}
      >
        ✕
      </button>

      <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 2 }}>
        {city.city_name}
      </Text>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        {city.province} · {city.country}
      </Text>

      {city.rating > 0 && (
        <div style={{ marginBottom: 10 }}>
          <Rate disabled value={city.rating} style={{ fontSize: 14 }} />
        </div>
      )}
      {city.visit_date && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
          首次到访：{city.visit_date}
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
});

export default CityInfoCard;
