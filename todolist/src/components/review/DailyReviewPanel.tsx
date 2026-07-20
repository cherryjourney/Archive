import { useEffect } from 'react';
import { Modal, Typography, Progress, Button, Statistic } from 'antd';
import { ThunderboltOutlined, ExperimentOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons';
import { useReviewStore } from '@/stores/reviewStore';
const { Text, Title } = Typography;

interface Props { open: boolean; onClose: () => void; }

export default function DailyReviewPanel({ open, onClose }: Props) {
  const { todayReview, fetchToday } = useReviewStore();

  useEffect(() => { if (open) fetchToday(); }, [open]);

  const r = todayReview;
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={440} centered closable={false}
      maskStyle={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
      styles={{ body: { padding: '24px 28px' }, content: { borderRadius: 20 } }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🌙</div>
        <Title level={4} style={{ margin: 0 }}>今日研究播报</Title>
        <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r?.date}</Text>
      </div>
      {r && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatCard icon={<ThunderboltOutlined />} label="任务完成" value={`${r.tasks_completed}/${r.tasks_total}`} color="#059669" />
            <StatCard icon={<ExperimentOutlined />} label="实验更新" value={r.experiments_updated} color="#7C3AED" />
            <StatCard icon={<FileTextOutlined />} label="论文阅读" value={r.papers_read_today} color="#2563EB" />
            <StatCard icon={<DollarOutlined />} label="今日支出" value={`¥${r.finance_spent.toFixed(0)}`} color="#D97706" />
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--color-fill)' }}>
            <Text style={{ fontSize: 13, fontStyle: 'italic', display: 'block', marginBottom: 6 }}>💬 {r.quote}</Text>
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>💡 {r.tomorrow_hint}</Text>
          </div>
        </div>
      )}
      <Button block size="large" onClick={onClose} style={{ marginTop: 16, borderRadius: 12, height: 44, fontWeight: 600 }}>知道了</Button>
    </Modal>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--color-fill)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 18, color }}>{icon}</span>
      <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div><div style={{ fontSize: 16, fontWeight: 700 }}>{value}</div></div>
    </div>
  );
}
