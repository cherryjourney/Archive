import { useEffect, useState, useMemo } from 'react';
import { Typography, Button, Space, Skeleton, Row, Col } from 'antd';
import {
  LeftOutlined, RightOutlined, FireOutlined, CheckCircleOutlined,
  ClockCircleOutlined, TrophyOutlined,
} from '@ant-design/icons';
import { useChartStore } from '@/stores/chartStore';
import ContributionHeatmap from '@/components/charts/ContributionHeatmap';

const { Title, Text } = Typography;

function StatCard({
  icon, label, value, suffix, color, bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div
      className="bento-card"
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px' }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, background: bgColor, color,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
          {label}
        </Text>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {value}{suffix && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const {
    monthlyHeatmap, usageHeatmap, streak,
    fetchMonthlyHeatmap, fetchUsageHeatmap, fetchStreak,
    loading,
  } = useChartStore();

  useEffect(() => {
    fetchMonthlyHeatmap(year);
    fetchUsageHeatmap(year);
    fetchStreak();
  }, [year]);

  // Annual summary stats
  const annualStats = useMemo(() => {
    const totalCompleted = monthlyHeatmap.reduce((sum, c) => sum + c.count, 0);
    const totalMinutes = usageHeatmap.reduce((sum, c) => sum + c.count, 0);
    const totalHours = Math.round(totalMinutes / 60);
    const activeDays = monthlyHeatmap.filter((c) => c.count > 0).length;
    const completionRate = activeDays > 0
      ? Math.round((monthlyHeatmap.filter((c) => c.level >= 2).length / activeDays) * 100)
      : 0;

    return { totalCompleted, totalMinutes, totalHours, activeDays, completionRate };
  }, [monthlyHeatmap, usageHeatmap]);

  if (loading && monthlyHeatmap.length === 0) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28,
      }}>
        <div>
          <Title level={3} style={{ fontSize: 28, margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            使用统计
          </Title>
          <Text style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
            贡献热力图 · {year} 年
          </Text>
        </div>
        <Space>
          <Button
            icon={<LeftOutlined />}
            shape="circle"
            onClick={() => setYear((y) => y - 1)}
            style={{ borderRadius: 10 }}
          />
          <Text strong style={{ fontSize: 16, minWidth: 56, textAlign: 'center' }}>
            {year}
          </Text>
          <Button
            icon={<RightOutlined />}
            shape="circle"
            disabled={year >= currentYear}
            onClick={() => setYear((y) => y + 1)}
            style={{ borderRadius: 10 }}
          />
        </Space>
      </div>

      {/* Annual Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            icon={<CheckCircleOutlined />}
            label="年度完成任务"
            value={annualStats.totalCompleted}
            suffix="个"
            color="#059669"
            bgColor="#ECFDF5"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            icon={<ClockCircleOutlined />}
            label="累计使用时长"
            value={annualStats.totalHours}
            suffix="h"
            color="#2563EB"
            bgColor="#EFF6FF"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            icon={<TrophyOutlined />}
            label="活跃天数"
            value={annualStats.activeDays}
            suffix="天"
            color="#7C3AED"
            bgColor="#F5F3FF"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            icon={<FireOutlined />}
            label="最长连续"
            value={streak?.longest_streak ?? 0}
            suffix="天"
            color="#DC2626"
            bgColor="#FFF1F2"
          />
        </Col>
      </Row>

      {/* Full-Year Heatmap */}
      <div className="bento-card" style={{ padding: '24px 28px', overflowX: 'auto' }}>
        <ContributionHeatmap
          tasks={monthlyHeatmap}
          usage={usageHeatmap}
          year={year}
          compact={false}
        />
      </div>
    </div>
  );
}
