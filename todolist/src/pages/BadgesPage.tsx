import { useEffect, useMemo } from 'react';
import { Typography, Progress, Spin, Empty } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { useBadgeStore } from '@/stores/badgeStore';
import BentoCard from '@/components/common/BentoCard';

const { Text, Title } = Typography;

const CATEGORY_LABELS: Record<string, string> = {
  '专注': '🍅 专注', '习惯': '🔄 习惯', '学术': '📚 学术',
  '里程碑': '🌟 里程碑', '成就': '🏆 成就', '探索': '🗺️ 探索',
  '收集': '📦 收集', '社交': '🤝 社交', 'general': '🎯 通用',
};

export default function BadgesPage() {
  const { badges, loading, fetchAll, checkAndUpdate } = useBadgeStore();

  useEffect(() => {
    fetchAll().then(() => checkAndUpdate());
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof badges>();
    badges.forEach((b) => {
      const cat = b.badge.category || 'general';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(b);
    });
    return Array.from(map.entries());
  }, [badges]);

  const unlockedCount = badges.filter((b) => b.user_badge?.unlocked).length;

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <TrophyOutlined style={{ marginRight: 8, color: '#F59E0B' }} />
            成就勋章墙
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            已解锁 {unlockedCount}/{badges.length} 枚勋章
          </Text>
        </div>
        <Progress
          type="circle"
          percent={badges.length > 0 ? Math.round((unlockedCount / badges.length) * 100) : 0}
          size={64}
          strokeColor={{ '0%': '#F59E0B', '100%': '#FCD34D' }}
        />
      </div>

      {badges.length === 0 ? (
        <Empty description="暂无勋章" />
      ) : (
        grouped.map(([category, items]) => (
          <div key={category} style={{ marginBottom: 28 }}>
            <Text strong style={{ fontSize: 15, color: 'var(--text-primary)', display: 'block', marginBottom: 14 }}>
              {CATEGORY_LABELS[category] || category}
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {items.map(({ badge, user_badge }) => {
                const unlocked = user_badge?.unlocked ?? false;
                const progress = user_badge?.progress ?? 0;
                return (
                  <BentoCard key={badge.id} style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{
                      fontSize: 40, marginBottom: 8,
                      filter: unlocked ? 'none' : 'grayscale(100%)',
                      opacity: unlocked ? 1 : 0.4,
                      transition: 'all 0.3s ease',
                    }}>
                      {badge.icon}
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                      marginBottom: 4,
                    }}>
                      {badge.name}
                    </div>
                    <Text style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>
                      {badge.description}
                    </Text>
                    {!unlocked && (
                      <div>
                        <Progress
                          percent={Math.round(progress * 100)}
                          size="small"
                          strokeColor="#F59E0B"
                          trailColor="var(--color-fill)"
                          format={() => `${Math.round(progress * 100)}%`}
                        />
                      </div>
                    )}
                    {unlocked && user_badge?.unlocked_at && (
                      <Text style={{ fontSize: 10, color: '#F59E0B' }}>
                        🎉 {user_badge.unlocked_at.slice(0, 10)} 解锁
                      </Text>
                    )}
                  </BentoCard>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
