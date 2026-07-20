import { useEffect, useState } from 'react';
import { Typography, Button, Space, Spin, Modal, Form, Input, Select, InputNumber, Drawer, Tag, Rate, message, Empty } from 'antd';
import { PlusOutlined, SearchOutlined, FileTextOutlined, InboxOutlined, ReadOutlined, CheckCircleFilled } from '@ant-design/icons';
import { usePaperStore } from '@/stores/paperStore';
import type { Paper, PaperStatus } from '@/types/paper';
import TagSelect from '@/components/common/TagSelect';
import Backlinks from '@/components/common/Backlinks';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const STATUS_OPTIONS: { value: PaperStatus; label: string; color: string }[] = [
  { value: 'to_read', label: '待读', color: '#868E96' },
  { value: 'reading', label: '阅读中', color: '#2563EB' },
  { value: 'read', label: '已读', color: '#059669' },
];

const STATUS_ICONS: Record<PaperStatus, React.ReactNode> = {
  to_read: <InboxOutlined />,
  reading: <ReadOutlined />,
  read: <CheckCircleFilled />,
};

export default function PaperPage() {
  const { papers, loading, fetchPapers, createPaper, updatePaper, deletePaper } = usePaperStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => { fetchPapers(); }, []);

  // ── Filtered papers ──
  const filtered = papers.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())
      && !p.authors.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Add paper ──
  const handleAdd = () => {
    setEditingPaper(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    await createPaper(values);
    setModalOpen(false);
    message.success('论文已添加');
  };

  // ── Open detail ──
  const handleOpenDetail = (paper: Paper) => {
    setSelectedPaper(paper);
    editForm.setFieldsValue(paper);
  };

  // ── Save detail ──
  const handleSaveDetail = async () => {
    if (!selectedPaper) return;
    const values = await editForm.validateFields();
    await updatePaper(selectedPaper.id, values);
    setSelectedPaper(null);
    message.success('已保存');
  };

  // ── Quick status change ──
  const quickStatus = async (paper: Paper, status: string) => {
    await updatePaper(paper.id, { status });
  };

  const statusTag = (s: string) => STATUS_OPTIONS.find((o) => o.value === s);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <Title level={3} style={{ margin: 0, fontSize: 22 }}><FileTextOutlined style={{ marginRight: 8 }} />论文库</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}
          style={{ borderRadius: 8, fontWeight: 600, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', border: 'none' }}>
          添加论文
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索论文..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ width: 260, borderRadius: 8 }} allowClear />
        <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 120, borderRadius: 8 }}
          options={[{ value: 'all', label: '全部状态' }, ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))]} />
        <Text type="secondary" style={{ lineHeight: '32px', fontSize: 12 }}>{filtered.length} 篇</Text>
      </div>

      {/* Paper grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div> :
          filtered.length === 0 ? <Empty description="暂无论文" style={{ marginTop: 60 }} /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {filtered.map((paper) => {
                const st = statusTag(paper.status);
                return (
                  <div key={paper.id}
                    onClick={() => handleOpenDetail(paper)}
                    className="glass-card paper-card"
                    style={{
                      borderRadius: 10, padding: 16, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text strong style={{ fontSize: 14, lineHeight: '20px', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {paper.title}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{paper.authors || '未知作者'}</Text>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {paper.year && <Tag style={{ borderRadius: 6, margin: 0 }}>{paper.year}</Tag>}
                      {paper.venue && <Tag style={{ borderRadius: 6, margin: 0, color: '#2563EB', borderColor: '#93C5FD', background: '#EFF6FF' }}>{paper.venue}</Tag>}
                      {st && <Tag color={st.color} style={{ borderRadius: 6, margin: 0 }}><span style={{ fontSize: 12 }}>{STATUS_ICONS[paper.status as PaperStatus]}</span> {st.label}</Tag>}
                      <Rate disabled value={paper.rating} style={{ fontSize: 14, marginLeft: 'auto' }} />
                    </div>
                    <TagSelect entityType="paper" entityId={paper.id} />
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* Add modal */}
      <Modal title="添加论文" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)} okText="添加" cancelText="取消" centered>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="论文标题" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="authors" label="作者">
            <Input placeholder="如 Vaswani, Shazeer, Parmar et al." style={{ borderRadius: 8 }} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="year" label="年份" style={{ flex: 1 }}>
              <InputNumber placeholder="2024" style={{ width: '100%', borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="venue" label="会议/期刊" style={{ flex: 1 }}>
              <Input placeholder="如 NeurIPS" style={{ borderRadius: 8 }} />
            </Form.Item>
          </div>
          <Form.Item name="doi" label="DOI">
            <Input placeholder="10.xxxx/xxxxx" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="arxiv_id" label="arXiv ID">
            <Input placeholder="如 1706.03762" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="to_read">
            <Select options={STATUS_OPTIONS} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail drawer */}
      <Drawer
        title={null} open={!!selectedPaper} onClose={() => setSelectedPaper(null)} width={560}
        extra={
          <Space>
            <Button onClick={handleSaveDetail} type="primary" style={{ borderRadius: 8 }}>保存</Button>
            <Button danger onClick={() => {
              if (!selectedPaper) return;
              Modal.confirm({ title: '删除论文', content: `确定删除「${selectedPaper.title}」？`, okText: '删除', okType: 'danger', cancelText: '取消', centered: true,
                onOk: async () => { await deletePaper(selectedPaper.id); setSelectedPaper(null); } });
            }} style={{ borderRadius: 8 }}>删除</Button>
          </Space>
        }
      >
        {selectedPaper && (
          <Form form={editForm} layout="vertical">
            <Form.Item name="title" label="标题" rules={[{ required: true }]}>
              <Input style={{ borderRadius: 8, fontWeight: 600, fontSize: 15 }} />
            </Form.Item>
            <Form.Item name="authors" label="作者">
              <Input style={{ borderRadius: 8 }} />
            </Form.Item>
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item name="year" label="年份" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%', borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="venue" label="会议/期刊" style={{ flex: 1 }}>
                <Input style={{ borderRadius: 8 }} />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item name="doi" label="DOI" style={{ flex: 1 }}>
                <Input style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="arxiv_id" label="arXiv ID" style={{ flex: 1 }}>
                <Input style={{ borderRadius: 8 }} />
              </Form.Item>
            </div>
            <Form.Item name="status" label="阅读状态">
              <Select options={STATUS_OPTIONS} style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="rating" label="评分">
              <Rate />
            </Form.Item>
            <Form.Item name="contribution" label="核心贡献">
              <TextArea rows={3} placeholder="一句话总结这篇文章的贡献..." style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="notes" label="我的笔记">
              <TextArea rows={6} placeholder="Markdown 笔记..." style={{ borderRadius: 8 }} />
            </Form.Item>
          </Form>
        )}
        {selectedPaper && <TagSelect entityType="paper" entityId={selectedPaper.id} />}
        {selectedPaper && <Backlinks targetType="paper" targetId={selectedPaper.id} />}
      </Drawer>
    </div>
  );
}

