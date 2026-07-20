import { useState } from 'react';
import { Modal, Select, InputNumber, Typography, message } from 'antd';

const { Text } = Typography;

interface Props {
  open: boolean;
  onSave: (birthDate: string) => Promise<void>;
}

export default function BirthDateSetupModal({ open, onSave }: Props) {
  const [year, setYear] = useState<number>(1998);
  const [month, setMonth] = useState<number>(1);
  const [day, setDay] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1900; y--) years.push(y);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleSave = async () => {
    if (!year || !month || !day) {
      message.error('请填写完整的出生日期');
      return;
    }
    setSaving(true);
    try {
      const y = String(year).padStart(4, '0');
      const m = String(month).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      await onSave(`${y}-${m}-${d}`);
    } catch (e) {
      message.error('保存失败: ' + String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="🎂 设置你的出生日期"
      open={open}
      onOk={handleSave}
      confirmLoading={saving}
      okText="开始记录"
      cancelButtonProps={{ style: { display: 'none' } }}
      closable={false}
      maskClosable={false}
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          设置出生日期后，时间线将从你的出生年份开始
        </Text>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 100 }}
            options={years.map(y => ({ value: y, label: `${y}年` }))}
            showSearch
          />
          <Select
            value={month}
            onChange={setMonth}
            style={{ width: 80 }}
            options={months.map(m => ({ value: m, label: `${m}月` }))}
          />
          <InputNumber
            value={day}
            onChange={v => setDay(v || 1)}
            min={1}
            max={31}
            style={{ width: 70 }}
            placeholder="日"
          />
        </div>
      </div>
    </Modal>
  );
}
