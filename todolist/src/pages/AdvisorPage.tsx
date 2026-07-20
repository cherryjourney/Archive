import { useEffect, useState } from 'react';
import { Typography, Button, Empty, Spin, Tag, Modal, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, CalendarOutlined, TeamOutlined, ArrowRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAdvisorStore } from '@/stores/advisorStore';
import type { CreateMeetingParams, AdvisorMeeting } from '@/types/advisor';
const { Text, Title } = Typography;
const { TextArea } = Input;

export default function AdvisorPage() {
  const { meetings, config, nextMeeting, loading, fetchAll, create, update, remove, updateConfig } = useAdvisorStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdvisorMeeting | null>(null);
  const [date, setDate] = useState(''); const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState(''); const [actionItems, setActionItems] = useState('');
  const [nextGoals, setNextGoals] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setDate(dayjs().format('YYYY-MM-DD')); setSummary(''); setFeedback(''); setActionItems(''); setNextGoals(''); setEditing(null); };

  const handleSubmit = async () => {
    if (!date) return;
    const params: CreateMeetingParams = {
      date, summary, feedback,
      action_items: JSON.stringify(actionItems.split('\n').filter(Boolean)),
      next_goals: nextGoals,
      related_task_ids: '[]', related_experiment_ids: '[]',
    };
    if (editing) { await update(editing.id, params); } else { await create(params); }
    setFormOpen(false); resetForm(); message.success('保存成功');
  };

  const handleBatchTasks = async (meeting: AdvisorMeeting) => {
    try {
      const items: string[] = JSON.parse(meeting.action_items || '[]');
      if (items.length === 0) { message.warning('没有可转换的行动项'); return; }
      const ids = await useAdvisorStore.getState().batchTasks(meeting.id, meeting.action_items);
      message.success(`已创建 ${ids.length} 个任务`);
    } catch { message.error('创建失败'); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><TeamOutlined style={{ marginRight: 8, color: '#7C3AED' }} />导师沟通日志</Title>
          {nextMeeting && (
            <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              距下次{nextMeeting.pattern_label}会议: {nextMeeting.days_until} 天 ({nextMeeting.expected_date})
            </Text>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => setShowConfig(!showConfig)} icon={<CalendarOutlined />} style={{ borderRadius: 10 }}>规律</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { resetForm(); setFormOpen(true); }} style={{ borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', border:'none' }}>记录沟通</Button>
        </div>
      </div>

      {showConfig && config && (
        <div style={{ marginBottom: 16, padding: '16px', borderRadius: 12, background: 'var(--color-fill)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select value={config.meeting_pattern} onChange={(v) => updateConfig({ meeting_pattern: v })}
            options={[{ value: 'weekly', label: '每周' }, { value: 'biweekly', label: '每两周' }, { value: 'monthly', label: '每月' }]}
            style={{ width: 120 }} />
        </div>
      )}

      {meetings.length === 0 ? <Empty description="暂无导师沟通记录" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meetings.map((m) => {
            const items: string[] = (() => { try { return JSON.parse(m.action_items || '[]'); } catch { return []; } })();
            return (
              <div key={m.id} style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 15 }}>{m.date}</Text>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="small" onClick={() => { setEditing(m); setDate(m.date); setSummary(m.summary); setFeedback(m.feedback); setActionItems((()=>{try{return JSON.parse(m.action_items||'[]').join('\n')}catch{return''}})()); setNextGoals(m.next_goals); setFormOpen(true); }}>编辑</Button>
                    <Popconfirm title="删除此记录？" onConfirm={() => remove(m.id)}><Button size="small" danger>删除</Button></Popconfirm>
                  </div>
                </div>
                {m.summary && <Text style={{ display:'block', marginBottom: 4 }}>📝 {m.summary}</Text>}
                {m.feedback && <Text style={{ display:'block', marginBottom: 4, color: 'var(--text-secondary)' }}>💬 反馈: {m.feedback}</Text>}
                {items.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>📋 {items.length} 个行动项</Text>
                      <Button size="small" type="link" onClick={() => handleBatchTasks(m)}>批量转任务 <ArrowRightOutlined /></Button>
                    </div>
                    {items.map((item, i) => <Tag key={i} style={{ marginBottom: 4 }}>{item}</Tag>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal title={editing ? '编辑沟通记录' : '新建沟通记录'} open={formOpen} onCancel={() => setFormOpen(false)} onOk={handleSubmit} width={500} okText="保存">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="日期 YYYY-MM-DD" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input placeholder="摘要" value={summary} onChange={(e) => setSummary(e.target.value)} />
          <Input placeholder="导师反馈" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <TextArea placeholder="行动项（每行一个）" value={actionItems} onChange={(e) => setActionItems(e.target.value)} rows={4} />
          <Input placeholder="下次目标" value={nextGoals} onChange={(e) => setNextGoals(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
