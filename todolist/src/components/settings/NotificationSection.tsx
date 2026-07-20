import { Typography, Button, Divider, Switch, Select, Checkbox, message } from 'antd';
import { BellOutlined, SendOutlined } from '@ant-design/icons';
import { notificationService, type NotificationConfig } from '@/services/notificationService';

const { Text } = Typography;

interface NotificationSectionProps {
  notifConfig: NotificationConfig | null;
  updateNotif: (partial: Partial<NotificationConfig>) => void;
}

export default function NotificationSection({ notifConfig, updateNotif }: NotificationSectionProps) {
  return (
    <div className="glass-card" style={{ padding: 22, marginBottom: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
        <BellOutlined style={{ marginRight: 6 }} />通知提醒
      </div>
      {notifConfig && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>每日计划推送</div>
              <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>每天早上推送今日计划摘要</Text>
            </div>
            <Switch
              checked={notifConfig.daily_reminder_enabled}
              onChange={(v) => updateNotif({ daily_reminder_enabled: v })}
            />
          </div>
          {notifConfig.daily_reminder_enabled && (
            <div style={{ marginBottom: 14, marginLeft: 20 }}>
              <Text style={{ color: 'var(--text-muted)', fontSize: 12, marginRight: 8 }}>提醒时间</Text>
              <Select
                value={notifConfig.daily_reminder_time}
                onChange={(v) => updateNotif({ daily_reminder_time: v })}
                style={{ width: 120 }}
                size="small"
                options={['06:00', '07:00', '08:00', '09:00', '10:00', '12:00'].map((t) => ({
                  value: t,
                  label: t,
                }))}
              />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>任务弹窗提醒</div>
              <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>今日计划任务开始前弹窗提醒</Text>
            </div>
            <Switch
              checked={notifConfig.task_reminder_enabled}
              onChange={(v) => updateNotif({ task_reminder_enabled: v })}
            />
          </div>
          {notifConfig.task_reminder_enabled && (
            <div style={{ marginBottom: 14, marginLeft: 20 }}>
              <Text style={{ color: 'var(--text-muted)', fontSize: 12, marginRight: 8 }}>提前</Text>
              <Select
                value={notifConfig.task_reminder_advance_minutes}
                onChange={(v) => updateNotif({ task_reminder_advance_minutes: v })}
                style={{ width: 120 }}
                size="small"
                options={[0, 5, 10, 15, 30].map((m) => ({
                  value: m,
                  label: m === 0 ? '准时' : `${m} 分钟`,
                }))}
              />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>截止日提醒</div>
              <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>任务/作业到期前原生通知</Text>
            </div>
            <Switch
              checked={notifConfig.deadline_reminder_enabled}
              onChange={(v) => updateNotif({ deadline_reminder_enabled: v })}
            />
          </div>
          {notifConfig.deadline_reminder_enabled && (
            <div style={{ marginLeft: 20, display: 'flex', gap: 16 }}>
              <Checkbox
                checked={notifConfig.deadline_1day_enabled}
                onChange={(e) => updateNotif({ deadline_1day_enabled: e.target.checked })}
                style={{ fontSize: 12 }}
              >
                1 天前
              </Checkbox>
              <Checkbox
                checked={notifConfig.deadline_1hour_enabled}
                onChange={(e) => updateNotif({ deadline_1hour_enabled: e.target.checked })}
                style={{ fontSize: 12 }}
              >
                1 小时前
              </Checkbox>
              <Checkbox
                checked={notifConfig.deadline_30min_enabled}
                onChange={(e) => updateNotif({ deadline_30min_enabled: e.target.checked })}
                style={{ fontSize: 12 }}
              >
                当天
              </Checkbox>
            </div>
          )}
          <Divider style={{ margin: '16px 0' }} />
          <Button
            onClick={() => {
              notificationService
                .sendTest()
                .then(() => message.success('测试通知已发送！'))
                .catch((e) => message.error('发送失败: ' + e));
            }}
            style={{ borderRadius: 10 }}
          >
            <SendOutlined /> 发送测试通知
          </Button>
        </>
      )}
    </div>
  );
}
