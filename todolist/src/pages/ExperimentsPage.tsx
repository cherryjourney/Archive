import { useEffect, useState, useMemo } from 'react';
import { Typography, Button, Space, Spin, Modal, Form, Input, Select, Table, Tag, Empty, message, Popover } from 'antd';
import { PlusOutlined, SwapOutlined, ExperimentOutlined, TrophyOutlined, ArrowUpOutlined, ArrowDownOutlined, StarFilled } from '@ant-design/icons';
import { useExperimentStore } from '@/stores/experimentStore';
import type { Experiment } from '@/types/experiment';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ExperimentsPage() {
  const { experiments, loading, fetchExperiments, createExperiment, updateExperiment, deleteExperiment } = useExperimentStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Experiment | null>(null);
  const [selectedRows, setSelectedRows] = useState<Experiment[]>([]);
  const [form] = Form.useForm();

  useEffect(() => { fetchExperiments(); }, []);

  const handleOpenAdd = () => { setEditingExp(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (exp: Experiment) => { setEditingExp(exp); form.setFieldsValue({ ...exp, hyperparams: exp.hyperparams ? JSON.stringify(JSON.parse(exp.hyperparams), null, 2) : '', metrics: exp.metrics ? JSON.stringify(JSON.parse(exp.metrics), null, 2) : '' }); setModalOpen(true); };

  const handleSave = async () => {
    const values = await form.validateFields();
    const params: any = { ...values };
    // Parse JSON fields
    if (params.hyperparams && typeof params.hyperparams === 'string') {
      try { params.hyperparams = JSON.stringify(JSON.parse(params.hyperparams)); } catch { message.error('超参格式错误，需为 JSON'); return; }
    }
    if (params.metrics && typeof params.metrics === 'string') {
      try { params.metrics = JSON.stringify(JSON.parse(params.metrics)); } catch { message.error('指标格式错误，需为 JSON'); return; }
    }
    if (editingExp) {
      await updateExperiment(editingExp.id, params);
    } else {
      await createExperiment(params);
    }
    setModalOpen(false);
    message.success(editingExp ? '已更新' : '实验已记录');
  };

  // Parse metrics for table display
  const parseMetrics = (json: string): Record<string, number> => {
    try { return JSON.parse(json); } catch { return {}; }
  };

  // Collect all metric keys
  const allMetricKeys = [...new Set(experiments.flatMap((e) => Object.keys(parseMetrics(e.metrics))))];

  // Build dynamic columns
  const columns: any[] = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 200, ellipsis: true,
      render: (v: string, r: Experiment) => <a onClick={() => handleEdit(r)}>{v}</a> },
    { title: '模型', dataIndex: 'model', key: 'model', width: 120, render: (v: string) => v || '-' },
    { title: '数据集', dataIndex: 'dataset', key: 'dataset', width: 100, render: (v: string) => v || '-' },
    ...allMetricKeys.map((key) => ({
      title: key, key, width: 80,
      render: (_: any, r: Experiment) => {
        const m = parseMetrics(r.metrics);
        const val = m[key];
        if (val === undefined) return <Text type="secondary">-</Text>;
        // Find baseline for comparison
        const baseline = experiments.find((e) => e.is_baseline && e.dataset === r.dataset && e.model === r.model);
        let compareEl = null;
        if (baseline && baseline.id !== r.id) {
          const baseVal = parseMetrics(baseline.metrics)[key];
          if (baseVal !== undefined) {
            const diff = val - baseVal;
            const better = diff > 0;
            compareEl = <Text style={{ fontSize: 10, color: better ? '#059669' : '#DC2626', marginLeft: 4 }}>{better ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{Math.abs(diff).toFixed(2)}</Text>;
          }
        }
        return <span style={{ fontWeight: r.is_baseline ? 700 : 400 }}>{val.toFixed(3)}{compareEl}</span>;
      },
    })),
    { title: 'Baseline', dataIndex: 'is_baseline', key: 'is_baseline', width: 80,
      render: (v: boolean) => v ? <Tag color="green" style={{ borderRadius: 6 }}>Baseline</Tag> : null },
    { title: '日期', dataIndex: 'created_at', key: 'created_at', width: 100, render: (v: string) => v?.slice(0, 10) },
    { title: '操作', key: 'actions', width: 80,
      render: (_: any, r: Experiment) => (
        <Space size={4}>
          <Button size="small" type="text" onClick={() => handleEdit(r)}>编辑</Button>
          <Button size="small" type="text" danger onClick={() => {
            Modal.confirm({ title: '删除实验', content: `确定删除「${r.title}」？`, okText: '删除', okType: 'danger', cancelText: '取消', centered: true, onOk: () => deleteExperiment(r.id) });
          }}>删除</Button>
        </Space>
      ),
    },
  ];

  // Compare view
  const [compareOpen, setCompareOpen] = useState(false);

  const compareData = useMemo(() => {
    const rows: any[] = [];
    // Title row
    const titleRow: any = { key: '__title__', metric: '名称' };
    selectedRows.forEach((r) => { titleRow[r.id] = r.title; titleRow[`${r.id}_best`] = false; });
    rows.push(titleRow);
    // Metric rows
    allMetricKeys.forEach((metricKey) => {
      const row: any = { key: metricKey, metric: metricKey };
      let bestVal: number | undefined;
      selectedRows.forEach((r) => {
        const val = parseMetrics(r.metrics)[metricKey];
        if (val !== undefined && (bestVal === undefined || val > bestVal)) bestVal = val;
      });
      selectedRows.forEach((r) => {
        const val = parseMetrics(r.metrics)[metricKey];
        row[r.id] = val;
        row[`${r.id}_best`] = val !== undefined && val === bestVal;
      });
      rows.push(row);
    });
    return rows;
  }, [selectedRows, allMetricKeys]);

  const compareColumns = useMemo(() => [
    { title: '指标', dataIndex: 'metric', key: 'metric', width: 120, fixed: 'left' as const },
    ...selectedRows.map((r) => ({
      title: <span>{r.title.slice(0, 20)}{r.is_baseline ? <TrophyOutlined style={{ marginLeft: 4 }} /> : ''}</span>,
      dataIndex: r.id,
      key: r.id,
      width: 130,
      render: (val: any, record: any) => {
        if (val === undefined) return <span>-</span>;
        if (record.key === '__title__') return <span style={{ fontWeight: 500 }}>{val}</span>;
        const isBest = record[`${r.id}_best`];
        return (
          <span style={{
            fontWeight: isBest ? 700 : 400,
            background: isBest ? 'rgba(5,150,105,0.08)' : 'transparent',
            padding: '1px 4px', borderRadius: 4,
          }}>
            {val.toFixed(3)}
            {isBest && <StarFilled style={{ color: '#059669', marginLeft: 4 }} />}
          </span>
        );
      },
    })),
  ], [selectedRows]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <Title level={3} style={{ margin: 0, fontSize: 22 }}><ExperimentOutlined style={{ marginRight: 8 }} />实验追踪</Title>
        <Space>
          {selectedRows.length >= 2 && (
            <Button icon={<SwapOutlined />} onClick={() => setCompareOpen(true)} style={{ borderRadius: 8 }}>
              对比 ({selectedRows.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}
            style={{ borderRadius: 8, fontWeight: 600, background: 'linear-gradient(135deg, #F76707, #f59f00)', border: 'none' }}>
            记录实验
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? <Spin style={{ display: 'block', marginTop: 80 }} size="large" /> :
          experiments.length === 0 ? <Empty description="暂无实验记录" style={{ marginTop: 60 }} /> : (
            <Table
              dataSource={experiments} columns={columns} rowKey="id" size="small"
              rowSelection={{ type: 'checkbox', onChange: (_, rows) => setSelectedRows(rows) }}
              pagination={{ pageSize: 50 }}
              style={{ background: 'var(--bg-card)', borderRadius: 10 }}
              scroll={{ x: 'max-content' }}
            />
          )}
      </div>

      {/* Experiment form modal */}
      <Modal title={editingExp ? '编辑实验' : '记录实验'} open={modalOpen} onOk={handleSave}
        onCancel={() => setModalOpen(false)} okText={editingExp ? '保存' : '记录'} cancelText="取消" centered width={560}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="title" label="实验名称" rules={[{ required: true }]}>
            <Input placeholder="如：Transformer base WMT14 EN-DE" style={{ borderRadius: 8 }} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="model" label="模型" style={{ flex: 1 }}>
              <Input placeholder="如：Transformer" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="dataset" label="数据集" style={{ flex: 1 }}>
              <Input placeholder="如：WMT14" style={{ borderRadius: 8 }} />
            </Form.Item>
          </div>
          <Form.Item name="hyperparams" label="超参数 (JSON)">
            <TextArea rows={3} placeholder='{"lr": 0.001, "batch": 32, "epochs": 100}' style={{ borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }} />
          </Form.Item>
          <Form.Item name="metrics" label="指标 (JSON)">
            <TextArea rows={3} placeholder='{"accuracy": 0.953, "f1": 0.921, "bleu": 27.3}' style={{ borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="实验备注..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="is_baseline" label="设为 Baseline" valuePropName="checked" initialValue={false}>
            <Select options={[{ value: false, label: '否' }, { value: true, label: '是 — 标记为基准实验' }]} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Compare modal */}
      <Modal title="实验对比" open={compareOpen} onCancel={() => setCompareOpen(false)} footer={null} width={800} centered>
        <Table
          columns={compareColumns}
          dataSource={compareData}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 800 }}
        />
      </Modal>
    </div>
  );
}
