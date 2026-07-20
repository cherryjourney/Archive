import { useState, useEffect } from 'react';
import { Modal, Typography, Button, Checkbox, Tag, Empty, Spin, message } from 'antd';
import {
  InboxOutlined, ImportOutlined, FileTextOutlined,
  CheckSquareOutlined, BlockOutlined,
} from '@ant-design/icons';
import { vaultService } from '@/services/vaultService';
import type { CapturedTodo } from '@/types/obsidianSync';

const { Text, Paragraph } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CaptureTodosPanel({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [todos, setTodos] = useState<CapturedTodo[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      handleScan();
    }
  }, [open]);

  const handleScan = async () => {
    setLoading(true);
    setTodos([]);
    setSelected(new Set());
    try {
      const result = await vaultService.captureTodosFromVault();
      setTodos(result);
    } catch (e: any) {
      message.error('扫描失败: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === todos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(todos.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const indices = Array.from(selected);
      const count = await vaultService.importCapturedTodos(indices, todos);
      message.success(`已导入 ${count} 个任务`);
      // Remove imported from list
      const importedSet = new Set(indices);
      setTodos(todos.filter((_, i) => !importedSet.has(i)));
      setSelected(new Set());
    } catch (e: any) {
      message.error('导入失败: ' + e);
    } finally {
      setImporting(false);
    }
  };

  const todoTypeIcon = (type: string) =>
    type === 'checklist'
      ? <CheckSquareOutlined style={{ color: '#059669', fontSize: 13 }} />
      : <BlockOutlined style={{ color: '#7C3AED', fontSize: 13 }} />;

  return (
    <Modal
      title={
        <span>
          <InboxOutlined style={{ marginRight: 8, color: '#7C3AED' }} />
          从 Obsidian 捕获 TODO
        </span>
      }
      open={open}
      onCancel={onClose}
      width={640}
      centered
      footer={[
        <Button key="scan" onClick={handleScan} loading={loading}>
          重新扫描
        </Button>,
        <Button key="cancel" onClick={onClose}>
          关闭
        </Button>,
        <Button
          key="import"
          type="primary"
          icon={<ImportOutlined />}
          loading={importing}
          disabled={selected.size === 0}
          onClick={handleImport}
          style={{ borderRadius: 10 }}
        >
          导入选中 ({selected.size})
        </Button>,
      ]}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
          <Text style={{ display: 'block', marginTop: 12, color: 'var(--text-muted)' }}>
            正在扫描 Vault 中的 TODO 项...
          </Text>
        </div>
      ) : todos.length === 0 ? (
        <Empty
          image={<InboxOutlined style={{ fontSize: 48, color: 'var(--text-muted)' }} />}
          description="未发现新的 TODO 项"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              共 {todos.length} 项
            </Text>
            <Button size="small" type="link" onClick={selectAll} style={{ fontSize: 12 }}>
              {selected.size === todos.length ? '取消全选' : '全选'}
            </Button>
          </div>

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {todos.map((todo, idx) => (
              <div
                key={`${todo.source_note_path}:${todo.line_number}`}
                onClick={() => toggleSelect(idx)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  cursor: 'pointer',
                  background: selected.has(idx)
                    ? 'rgba(124,58,237,0.06)'
                    : 'var(--bg-glass)',
                  border: selected.has(idx)
                    ? '1px solid rgba(124,58,237,0.20)'
                    : '1px solid var(--border-subtle)',
                  marginBottom: 6,
                  transition: 'all 0.15s',
                }}
              >
                <Checkbox checked={selected.has(idx)} style={{ marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {todoTypeIcon(todo.todo_type)}
                    <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {todo.text}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileTextOutlined style={{ color: 'var(--text-muted)', fontSize: 10 }} />
                    <Text style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {todo.source_note_path}:{todo.line_number}
                    </Text>
                    <Tag style={{
                      borderRadius: 4, margin: 0, fontSize: 10,
                      background: todo.todo_type === 'checklist' ? 'rgba(5,150,105,0.08)' : 'rgba(124,58,237,0.08)',
                      border: 'none',
                      color: todo.todo_type === 'checklist' ? '#059669' : '#7C3AED',
                    }}>
                      {todo.todo_type === 'checklist' ? '待办' : 'TODO'}
                    </Tag>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
