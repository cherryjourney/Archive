import { useState } from 'react';
import { Modal, Typography, Button, message, Spin } from 'antd';
import { ExportOutlined, EyeOutlined } from '@ant-design/icons';
import { vaultService } from '@/services/vaultService';

const { Text, Paragraph } = Typography;

interface Props {
  open: boolean;
  date: string;
  onClose: () => void;
}

export default function DailyNotePreviewModal({ open, date, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [notePath, setNotePath] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setMarkdown(null);
    try {
      // First generate (which writes the file and returns the path)
      const path = await vaultService.generateDailyNote(date);
      setNotePath(path);
      // Read back for preview
      const content = await vaultService.readVaultNote(path);
      setMarkdown(content);
    } catch (e: any) {
      message.error('生成失败: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await vaultService.generateDailyNote(date);
      message.success(`已导出到 Obsidian Daily Note`);
      onClose();
    } catch (e: any) {
      message.error('导出失败: ' + e);
    } finally {
      setExporting(false);
    }
  };

  // Auto-generate on open
  const handleOpen = () => {
    handleGenerate();
  };

  return (
    <Modal
      title={
        <span>
          <ExportOutlined style={{ marginRight: 8, color: '#7C3AED' }} />
          导出到 Obsidian Daily Note
        </span>
      }
      open={open}
      onCancel={onClose}
      afterOpenChange={(visible) => { if (visible) handleOpen(); }}
      width={600}
      centered
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button
          key="export"
          type="primary"
          icon={<ExportOutlined />}
          loading={exporting}
          onClick={handleExport}
          style={{ borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}
        >
          导出
        </Button>,
      ]}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
          <Text style={{ display: 'block', marginTop: 12, color: 'var(--text-muted)' }}>
            正在生成 Daily Note...
          </Text>
        </div>
      ) : markdown ? (
        <div>
          {notePath && (
            <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
              📁 {notePath}
            </Text>
          )}
          <div style={{
            background: 'var(--bg-glass)',
            borderRadius: 12,
            padding: 16,
            maxHeight: 400,
            overflow: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 13,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
          }}>
            {markdown}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <EyeOutlined style={{ fontSize: 32, color: 'var(--text-muted)', marginBottom: 12 }} />
          <Paragraph style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            将今日计划导出为 Obsidian Daily Note 格式，包含任务清单、时间安排、优先级和完成状态。
          </Paragraph>
        </div>
      )}
    </Modal>
  );
}
