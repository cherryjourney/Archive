import { useEffect, useState } from 'react';
import { Typography, Button, Spin, Row, Col, Card, Statistic, Tag, Empty, Progress, message } from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, ArrowRightOutlined,
  FileTextOutlined, ExportOutlined, ReloadOutlined,
  BarChartOutlined, RiseOutlined, FireOutlined, TagsOutlined,
} from '@ant-design/icons';
import { useReportStore } from '@/stores/reportStore';
import { startOfWeek, endOfWeek, formatDate } from '@/utils/date';
import type { WeeklyReport } from '@/services/reportService';

const { Text, Title } = Typography;

function TrendIcon({ current, previous }: { current: number; previous: number }) {
  if (current > previous) return <ArrowUpOutlined style={{ color: '#059669' }} />;
  if (current < previous) return <ArrowDownOutlined style={{ color: '#DC2626' }} />;
  return <ArrowRightOutlined style={{ color: 'var(--text-muted)' }} />;
}

function FocusFormat(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m}m`;
  return `${m}min`;
}

export default function ReportPage() {
  const { report, loading, fetchWeek, exportMarkdown } = useReportStore();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchWeek();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const md = await exportMarkdown();
      // Copy to clipboard
      await navigator.clipboard.writeText(md);
      message.success('周报 Markdown 已复制到剪贴板！可粘贴到知识库或发送给导师');
    } catch {
      message.error('导出失败');
    }
    setExporting(false);
  };

  if (loading || !report) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>;
  }

  const focusMinutes = Math.floor(report.focus_total_seconds / 60);
  const prevFocusMinutes = Math.floor(report.prev_focus_total_seconds / 60);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}><BarChartOutlined style={{ marginRight: 8 }} />本周报告</div>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {formatDate(report.start_date, 'M/D')} ~ {formatDate(report.end_date, 'M/D')}
          </Text>
        </div>
        <div>
          <Button icon={<ReloadOutlined />} onClick={() => fetchWeek()} style={{ marginRight: 8, borderRadius: 10 }}>
            刷新
          </Button>
          <Button
            type="primary" icon={<ExportOutlined />}
            onClick={handleExport} loading={exporting}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            导出 Markdown
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 14, textAlign: 'center' }}>
            <Statistic title="完成任务" value={report.completed_tasks}
              suffix={`/ ${report.total_tasks}`}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#059669' }} />
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <TrendIcon current={report.completion_rate} previous={report.prev_completion_rate} />
              {' '}完成率 {(report.completion_rate * 100).toFixed(0)}%
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 14, textAlign: 'center' }}>
            <Statistic title="专注次数" value={report.focus_sessions} suffix="次"
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#DC2626' }} />
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <TrendIcon current={focusMinutes} previous={prevFocusMinutes} />
              {' '}共 {FocusFormat(report.focus_total_seconds)}
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 14, textAlign: 'center' }}>
            <Statistic title="连续打卡" value={report.streak_days} suffix="天"
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }} />
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <FireOutlined /> 保持势头
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Category Distribution */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          <TagsOutlined style={{ marginRight: 6 }} />分类分布
        </div>
        {report.category_distribution.length === 0 ? (
          <Empty description="本周暂无分类数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Row gutter={[8, 8]}>
            {report.category_distribution.map(cat => {
              const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
              return (
                <Col key={cat.name} span={8}>
                  <div style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: `${cat.color}10`, border: `1px solid ${cat.color}20`,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: cat.color, marginBottom: 4 }}>{cat.name}</div>
                    <Progress
                      percent={pct}
                      size="small"
                      strokeColor={cat.color}
                      format={() => `${cat.completed}/${cat.total}`}
                    />
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Comparison */}
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          <RiseOutlined style={{ marginRight: 6 }} />与上周对比
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: '完成任务', cur: report.completed_tasks, prev: report.prev_completed_tasks },
            { label: '完成率', cur: Math.round(report.completion_rate * 100), prev: Math.round(report.prev_completion_rate * 100), suffix: '%' },
            { label: '专注次数', cur: report.focus_sessions, prev: report.prev_focus_sessions, suffix: '次' },
            { label: '专注时长', cur: focusMinutes, prev: prevFocusMinutes, suffix: 'min' },
          ].map(item => {
            const diff = (item.cur as number) - (item.prev as number);
            const isUp = diff > 0;
            return (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.cur}{item.suffix || ''}
                </div>
                <Tag color={isUp ? 'green' : diff === 0 ? 'default' : 'red'} style={{ borderRadius: 6, marginTop: 4 }}>
                  {isUp ? '+' : ''}{diff}{item.suffix || ''}
                </Tag>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
