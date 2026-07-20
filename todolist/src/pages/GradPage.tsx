import { useEffect, useState } from 'react';
import { Typography, Button, Empty, Spin, Modal, Input, Select, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, RocketOutlined, ExperimentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useGradStore } from '@/stores/gradStore';
import type { GradMilestone, CreateMilestoneParams } from '@/types/grad';
const { Text, Title } = Typography;

const CAT_ICONS: Record<string, string> = { group_meeting: '👥', literature: '📄', experiment: '🔬', submission: '📬', defense: '🎓', other: '📌' };
const CAT_LABELS: Record<string, string> = { group_meeting: '组会', literature: '文献汇报', experiment: '实验', submission: '投稿', defense: '答辩', other: '其他' };

export default function GradPage() {
  const { milestones, reviews, loading, fetchAll, createMilestone, updateMilestone, removeMilestone, generateReview } = useGradStore();
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState(''); const [date, setDate] = useState('');
  const [category, setCategory] = useState('other'); const [description, setDescription] = useState('');
  const [isKey, setIsKey] = useState(false); const [semester, setSemester] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSem, setReviewSem] = useState(''); const [reviewStart, setReviewStart] = useState(''); const [reviewEnd, setReviewEnd] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async () => {
    if (!title || !date) return;
    await createMilestone({ title, date, category, description, is_key: isKey, semester, milestone_type: 'manual' });
    setFormOpen(false); setTitle(''); setDate(''); setDescription('');
  };

  const handleGenerateReview = async () => {
    if (!reviewSem || !reviewStart || !reviewEnd) return;
    await generateReview(reviewSem, reviewStart, reviewEnd);
    setReviewOpen(false); message.success('学期回顾已生成');
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}><RocketOutlined style={{ marginRight: 8, color: '#F59E0B' }} />读研周期全景</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => { setReviewSem(''); setReviewStart(''); setReviewEnd(''); setReviewOpen(true); }}>生成学期回顾</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)} style={{ borderRadius: 10, background: 'linear-gradient(135deg,#F59E0B,#D97706)', border:'none' }}>添加节点</Button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', marginBottom: 40 }}>
        <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--border-default)' }} />
        {milestones.length === 0 ? <Empty description="暂无里程碑" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {milestones.map((m, i) => (
              <div key={m.id} style={{ position: 'relative', paddingLeft: 48, paddingBottom: 24 }}>
                <div style={{
                  position: 'absolute', left: 14, top: 6, width: 14, height: 14, borderRadius: '50%',
                  background: m.is_key ? '#F59E0B' : 'var(--border-default)',
                  border: '3px solid var(--bg-primary)',
                  boxShadow: m.is_key ? '0 0 0 3px rgba(245,158,11,0.2)' : 'none',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Text strong style={{ fontSize: 14 }}>{m.title}</Text>
                  {m.is_key && <Tag color="gold" style={{ fontSize: 10 }}>关键</Tag>}
                  <Tag style={{ fontSize: 10 }}>{CAT_LABELS[m.category] || m.category}</Tag>
                  {m.milestone_type === 'auto' && <Text style={{ fontSize: 10, color: 'var(--text-muted)' }}>自动</Text>}
                </div>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.date} {m.semester ? `· ${m.semester}` : ''}</Text>
                {m.description && <Text style={{ fontSize: 12, display: 'block', marginTop: 4 }}>{m.description}</Text>}
                <Popconfirm title="删除？" onConfirm={() => removeMilestone(m.id)}>
                  <Button size="small" type="link" danger style={{ padding: 0, fontSize: 11 }}>删除</Button>
                </Popconfirm>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Semester Reviews */}
      {reviews.length > 0 && (
        <div>
          <Title level={4}>学期回顾卡片</Title>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <Text strong style={{ fontSize: 15 }}>{r.semester}</Text>
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>课程</Text><div style={{ fontWeight: 600 }}>{r.courses_count}</div></div>
                  <div><Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>实验</Text><div style={{ fontWeight: 600 }}>{r.experiments_count}</div></div>
                  <div><Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>论文</Text><div style={{ fontWeight: 600 }}>{r.papers_read}</div></div>
                  <div><Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>完成率</Text><div style={{ fontWeight: 600 }}>{Math.round(r.task_completion_rate * 100)}%</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      <Modal title="添加里程碑" open={formOpen} onCancel={() => setFormOpen(false)} onOk={handleSubmit} okText="添加">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="日期 YYYY-MM-DD" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select value={category} onChange={setCategory} options={Object.entries(CAT_LABELS).map(([k,v]) => ({ value: k, label: `${CAT_ICONS[k]||''} ${v}` }))} />
          <Input placeholder="描述" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="学期 (如 2024-2025-1)" value={semester} onChange={(e) => setSemester(e.target.value)} />
          <label><input type="checkbox" checked={isKey} onChange={(e) => setIsKey(e.target.checked)} /> 关键节点</label>
        </div>
      </Modal>

      {/* Generate Review Modal */}
      <Modal title="生成学期回顾" open={reviewOpen} onCancel={() => setReviewOpen(false)} onOk={handleGenerateReview} okText="生成">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="学期名称 (如 2024-2025-1)" value={reviewSem} onChange={(e) => setReviewSem(e.target.value)} />
          <Input placeholder="开始日期 YYYY-MM-DD" value={reviewStart} onChange={(e) => setReviewStart(e.target.value)} />
          <Input placeholder="结束日期 YYYY-MM-DD" value={reviewEnd} onChange={(e) => setReviewEnd(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
