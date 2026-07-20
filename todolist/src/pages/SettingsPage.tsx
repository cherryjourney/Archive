import { useState, useEffect } from 'react';
import { Typography, Button, Space, Divider, Tag, message, Switch, Segmented } from 'antd';
import {
  ExportOutlined, ImportOutlined, FolderOpenOutlined, PoweroffOutlined,
  CheckCircleOutlined, WarningOutlined,
  FolderAddOutlined, ReloadOutlined, LinkOutlined,
  SunOutlined, MoonOutlined, LaptopOutlined,
  SettingOutlined, AppstoreOutlined,
  BgColorsOutlined, InboxOutlined, CalendarOutlined,
  BellOutlined, DatabaseOutlined, InfoCircleOutlined, TagsOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { systemService } from '@/services/systemService';
import type { ShortcutEntry } from '@/types/system';
import { notificationService, type NotificationConfig } from '@/services/notificationService';
import { vaultService } from '@/services/vaultService';
import type { VaultConfig } from '@/types/vault';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { save, open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import NotificationSection from '@/components/settings/NotificationSection';
import CaptureTodosPanel from '@/components/vault/CaptureTodosPanel';
import ShortcutKeyCapture from '@/components/common/ShortcutKeyCapture';

const { Text, Title } = Typography;

type Section = 'general' | 'data' | 'obsidian' | 'notifications' | 'about';

const NAV: { key: Section; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'general',       label: '通用',       icon: <AppstoreOutlined />,   desc: '启动、主题、快捷键' },
  { key: 'data',          label: '数据管理',   icon: <DatabaseOutlined />,   desc: '备份、迁移、存储路径' },
  { key: 'obsidian',      label: 'Obsidian',   icon: <LinkOutlined />,       desc: 'Vault 连接与同步' },
  { key: 'notifications', label: '通知',       icon: <BellOutlined />,       desc: '任务提醒与推送' },
  { key: 'about',         label: '关于',       icon: <InfoCircleOutlined />, desc: '版本与技术栈' },
];

export default function SettingsPage({ inModal, onClose }: { inModal?: boolean; onClose?: () => void }) {
  const [section, setSection] = useState<Section>('general');

  const [autoStart, setAutoStart] = useState(false);
  const { mode, resolved, setMode } = useTheme();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dataPath, setDataPath] = useState('');

  const [vaultConfig, setVaultConfig] = useState<VaultConfig>({ vault_path: '', is_configured: false });
  const [vaultSyncing, setVaultSyncing] = useState(false);
  const [vaultTagCount, setVaultTagCount] = useState(0);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);

  const [notifConfig, setNotifConfig] = useState<NotificationConfig | null>(null);

  const [shortcuts, setShortcuts] = useState<ShortcutEntry[]>([]);
  const [exportPath, setExportPath] = useState('');

  useEffect(() => {
    systemService.checkAutoStart().then(setAutoStart).catch(() => {});
    systemService.getAppConfig().then(cfg => {
      setDataPath(cfg.data_path);
      setVaultConfig({ vault_path: cfg.vault_path, is_configured: !!cfg.vault_path });
      setExportPath(cfg.export_path || '');
    }).catch(() => {});
    notificationService.getConfig().then(setNotifConfig).catch(() => {});
    systemService.getShortcutConfig().then(setShortcuts).catch(() => {});
  }, []);

  useEffect(() => {
    const p = listen<{ total_tags: number }>('vault-tags-changed', (event) => {
      if (event.payload?.total_tags) setVaultTagCount(event.payload.total_tags);
    });
    return () => { p.then(fn => fn()); };
  }, []);

  const toggleAutoStart = async (enabled: boolean) => {
    try {
      await systemService.toggleAutoStart(enabled);
      setAutoStart(enabled);
      message.success(enabled ? '已设置开机自启' : '已取消开机自启');
    } catch (e: any) { message.error('操作失败：' + e); }
  };

  const updateNotif = async (partial: Partial<NotificationConfig>) => {
    if (!notifConfig) return;
    const updated = { ...notifConfig, ...partial };
    setNotifConfig(updated);
    try { await notificationService.updateConfig(updated); } catch (e: any) { message.error('保存失败: ' + e); }
  };

  const handleSelectVault = async () => {
    try {
      const selectedPath = await open({ directory: true, multiple: false, title: '选择 Obsidian Vault 文件夹' });
      if (!selectedPath) return;
      setVaultSyncing(true);
      const config = await vaultService.setVaultPath(selectedPath as string);
      setVaultConfig(config);
      setVaultTagCount(0);
      message.success('Vault 已连接！');
    } catch (e: any) { message.error('连接失败：' + e); }
    setVaultSyncing(false);
  };

  const handleSyncVault = async () => {
    try {
      setVaultSyncing(true);
      const result = await vaultService.syncVaultTags();
      setVaultTagCount(result.total_tags);
      message.success(`同步完成：${result.synced_count} 个新标签，共 ${result.total_tags} 个标签`);
    } catch (e: any) { message.error('同步失败：' + e); }
    setVaultSyncing(false);
  };

  const handleCalendarSync = async () => {
    try {
      setCalendarSyncing(true);
      const count = await vaultService.syncAllPlansToCalendar();
      message.success(`已同步 ${count} 个计划到 Obsidian Calendar`);
    } catch (e: any) { message.error('日历同步失败：' + e); }
    setCalendarSyncing(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filePath = await save({ filters: [{ name: 'ZIP 备份', extensions: ['zip'] }], defaultPath: `backup-${timestamp}.zip` });
      if (!filePath) { setExporting(false); return; }
      await systemService.exportBackup(filePath);
      message.success(`已导出到：${filePath}`);
    } catch (e) { message.error('导出失败：' + e); }
    setExporting(false);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const filePath = await open({ filters: [{ name: 'ZIP 备份', extensions: ['zip'] }], multiple: false });
      if (!filePath) { setImporting(false); return; }
      await systemService.importBackup(filePath as string);
      message.success('备份已恢复！请重启应用');
    } catch (e) { message.error('导入失败：' + e); }
    setImporting(false);
  };

  // ═══════════════════════════════════
  // Section content renderers
  // ═══════════════════════════════════

  const renderGeneral = () => (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>通用</div>
      <Text style={{ color: 'var(--text-muted)', fontSize: 14, display: 'block', marginBottom: 28 }}>启动行为、外观主题与快捷键</Text>

      <div className="glass-card" style={{ padding: 28, borderRadius: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>启动</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>
              <PoweroffOutlined style={{ marginRight: 8, color: '#2563EB' }} />开机自启动
            </div>
            <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>电脑开机后自动启动 Archive · 存迹</Text>
          </div>
          <Switch checked={autoStart} onChange={toggleAutoStart} />
        </div>
      </div>

      <div className="glass-card" style={{ padding: 28, borderRadius: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>外观</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>
              <BgColorsOutlined style={{ marginRight: 8, color: '#7C3AED' }} />主题模式
            </div>
            <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              当前：{resolved === 'dark' ? '🌙 暗色模式' : '☀️ 亮色模式'}{mode === 'system' ? '（跟随系统自动切换）' : ''}
            </Text>
          </div>
          <Segmented
            value={mode}
            onChange={(val) => setMode(val as ThemeMode)}
            options={[
              { label: '跟随系统', value: 'system', icon: <LaptopOutlined /> },
              { label: '白天', value: 'light', icon: <SunOutlined /> },
              { label: '夜间', value: 'dark', icon: <MoonOutlined /> },
            ]}
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: 28, borderRadius: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>快捷键</div>
        <Text style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 18 }}>
          点击快捷键标签进入编辑模式，按下新组合键即可修改。需要至少一个修饰键（Ctrl/Shift/Alt）加一个字母键。
        </Text>
        {shortcuts.map((sc) => (
          <div key={sc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15, marginBottom: 2 }}>💭 {sc.description}</div>
              <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>任意位置唤出记忆快速记录</Text>
            </div>
            <ShortcutKeyCapture
              value={sc.binding}
              onChange={async (newBinding) => {
                try {
                  await systemService.setShortcutConfig(sc.name, newBinding);
                  setShortcuts(prev => prev.map(s => s.name === sc.name ? { ...s, binding: newBinding } : s));
                  message.success(`快捷键已更新为 ${newBinding}`);
                } catch (e: any) { message.error('设置失败：' + e); }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderData = () => (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>数据管理</div>
      <Text style={{ color: 'var(--text-muted)', fontSize: 14, display: 'block', marginBottom: 28 }}>备份、恢复与数据存储位置</Text>

      <div className="glass-card" style={{ padding: 28, borderRadius: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>存储</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>
              <FolderOpenOutlined style={{ marginRight: 8, color: '#2563EB' }} />数据目录
            </div>
            <Text style={{ color: 'var(--text-muted)', fontSize: 13, wordBreak: 'break-all' }}>
              {dataPath || '加载中...'}
            </Text>
          </div>
          <Button
            icon={<FolderOpenOutlined />}
            onClick={async () => {
              try { await open({ path: dataPath, directory: true }); } catch { message.info(`数据目录: ${dataPath}`); }
            }}
            style={{ borderRadius: 10, marginLeft: 20, fontWeight: 500, height: 38 }}
          >
            打开目录
          </Button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 28, borderRadius: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>每日笔记导出</div>
        <Text style={{ color: 'var(--text-muted)', fontSize: 13, display: 'block', marginBottom: 16 }}>
          每日计划、一日三餐、记忆将导出为 Markdown 文件到该目录。如果已连接 Obsidian Vault，将优先使用 Obsidian Daily Note 路径。
        </Text>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>
              <FolderOpenOutlined style={{ marginRight: 8, color: '#059669' }} />导出路径
            </div>
            <Text style={{ color: 'var(--text-muted)', fontSize: 13, wordBreak: 'break-all' }}>
              {exportPath || '未设置（仅保存到本地数据库）'}
            </Text>
          </div>
          <Button
            icon={<FolderAddOutlined />}
            onClick={async () => {
              const p = await open({ directory: true, multiple: false, title: '选择每日笔记导出目录' });
              if (p) {
                await systemService.setExportPath(p as string);
                setExportPath(p as string);
                message.success('导出路径已设置');
              }
            }}
            style={{ borderRadius: 10, marginLeft: 20, fontWeight: 500, height: 38 }}
          >
            选择目录
          </Button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 28, borderRadius: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
          <ExportOutlined style={{ marginRight: 8, color: '#2563EB' }} />备份与迁移
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF, #F0F4FF)',
            borderRadius: 14, padding: 24, textAlign: 'center',
            border: '1px solid rgba(37,99,235,0.12)',
          }}>
            <ExportOutlined style={{ fontSize: 28, color: '#2563EB', marginBottom: 12 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>导出备份</div>
            <Text style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 16 }}>
              数据库打包为 .zip 文件
            </Text>
            <Button
              icon={<ExportOutlined />}
              loading={exporting}
              onClick={handleExport}
              block
              style={{
                height: 40, borderRadius: 10, fontWeight: 600,
                background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', border: 'none', color: '#fff',
              }}
            >
              立即导出
            </Button>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #FFFBEB, #FFF7ED)',
            borderRadius: 14, padding: 24, textAlign: 'center',
            border: '1px solid rgba(245,158,11,0.15)',
          }}>
            <ImportOutlined style={{ fontSize: 28, color: '#F59E0B', marginBottom: 12 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>导入备份</div>
            <Text style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 16 }}>
              从 .zip 文件恢复全部数据
            </Text>
            <Button
              icon={<ImportOutlined />}
              loading={importing}
              onClick={handleImport}
              block
              style={{
                height: 40, borderRadius: 10, fontWeight: 600,
                background: 'linear-gradient(135deg,#f59e0b,#f97316)', border: 'none', color: '#fff',
              }}
            >
              导入备份
            </Button>
          </div>
        </div>
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(5,150,105,0.06)', borderRadius: 10,
          border: '1px solid rgba(5,150,105,0.1)',
        }}>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            <CheckCircleOutlined style={{ color: '#059669', marginRight: 6 }} />
            <strong style={{ color: 'var(--text-secondary)' }}>迁移到新电脑：</strong>
            导出备份 → 在新电脑安装 Archive · 存迹 → 导入备份 → 完成
          </Text>
        </div>
      </div>
    </div>
  );

  const renderObsidian = () => (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Obsidian</div>
      <Text style={{ color: 'var(--text-muted)', fontSize: 14, display: 'block', marginBottom: 28 }}>
        Vault 连接、标签同步与 Calendar 集成。不使用 Obsidian？在「数据管理」设置导出路径即可。
      </Text>

      <div className="glass-card" style={{ padding: 28, borderRadius: 16 }}>
        {vaultConfig.is_configured ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#059669', boxShadow: '0 0 8px rgba(5,150,105,0.4)' }} />
              <Text strong style={{ color: 'var(--text-primary)', fontSize: 16 }}>已连接</Text>
              {vaultTagCount > 0 && (
                <Tag style={{ borderRadius: 8, fontSize: 12, padding: '2px 10px' }}>
                  <TagsOutlined /> {vaultTagCount} 个标签已同步
                </Tag>
              )}
            </div>
            <div style={{
              background: 'rgba(37,99,235,0.04)', borderRadius: 10, padding: '12px 16px',
              border: '1px solid rgba(37,99,235,0.08)', marginBottom: 20,
            }}>
              <Text style={{ color: 'var(--text-secondary)', fontSize: 13, wordBreak: 'break-all' }}>
                {vaultConfig.vault_path}
              </Text>
            </div>
            <Space wrap size="middle">
              <Button icon={<ReloadOutlined />} loading={vaultSyncing} onClick={handleSyncVault}
                style={{ borderRadius: 10, height: 38, fontWeight: 500 }}>
                立即同步标签
              </Button>
              <Button icon={<InboxOutlined />} onClick={() => setCaptureOpen(true)}
                style={{ borderRadius: 10, height: 38, fontWeight: 500 }}>
                捕获 TODO
              </Button>
              <Button icon={<CalendarOutlined />} loading={calendarSyncing} onClick={handleCalendarSync}
                style={{ borderRadius: 10, height: 38, fontWeight: 500 }}>
                同步到 Calendar
              </Button>
              <Button icon={<FolderAddOutlined />} onClick={handleSelectVault}
                style={{ borderRadius: 10, height: 38, fontWeight: 500 }}>
                更换 Vault
              </Button>
            </Space>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
              background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>
              <WarningOutlined style={{ color: '#D97706' }} />
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 18, marginBottom: 6 }}>未连接 Vault</div>
            <Text style={{ color: 'var(--text-muted)', fontSize: 14, display: 'block', marginBottom: 24 }}>
              选择包含 <Text code>.obsidian</Text> 目录的文件夹以启用同步
            </Text>
            <Button type="primary" icon={<FolderAddOutlined />} loading={vaultSyncing} onClick={handleSelectVault} size="large"
              style={{
                borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', border: 'none',
                fontWeight: 600, height: 46, fontSize: 15, padding: '0 32px',
              }}>
              选择 Vault 文件夹
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>通知</div>
      <Text style={{ color: 'var(--text-muted)', fontSize: 14, display: 'block', marginBottom: 28 }}>任务提醒、每日计划与截止日期推送</Text>
      <NotificationSection notifConfig={notifConfig} updateNotif={updateNotif} />
    </div>
  );

  const renderAbout = () => (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>关于</div>
      <Text style={{ color: 'var(--text-muted)', fontSize: 14, display: 'block', marginBottom: 28 }}>Archive · 存迹 与它的技术栈</Text>

      <div className="glass-card" style={{ padding: 40, borderRadius: 16, textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 22, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 40px rgba(37,99,235,0.35)',
          fontSize: 36,
        }}>
          <img src="/logo.svg" alt="Archive" style={{ width: 52, height: 52 }} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
          Archive<span style={{ color: '#2563EB' }}> · 存迹</span>
        </div>
        <Text style={{ color: 'var(--text-muted)', fontSize: 15, display: 'block', marginBottom: 24 }}>
          每一段认真度过的晨昏，皆在此间。
        </Text>
        <Space size="middle">
          {[
            { c: '#2563EB', l: 'Tauri 2 + React 18' },
            { c: '#7C3AED', l: 'Rust + SQLite' },
            { c: '#059669', l: 'ECharts' },
            { c: '#D97706', l: 'Obsidian 集成' },
          ].map(t => (
            <Tag key={t.l} style={{
              background: `${t.c}12`, border: `1px solid ${t.c}30`,
              color: t.c, borderRadius: 8, fontSize: 13, padding: '6px 14px', fontWeight: 500,
            }}>{t.l}</Tag>
          ))}
        </Space>

        <Divider style={{ margin: '28px 0' }} />

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Button icon={<ExportOutlined />} loading={exporting} onClick={handleExport} size="large"
            style={{
              borderRadius: 12, fontWeight: 600, height: 46, padding: '0 28px', fontSize: 14,
              background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', border: 'none', color: '#fff',
            }}>
            导出备份
          </Button>
          <Button icon={<ImportOutlined />} loading={importing} onClick={handleImport} size="large"
            style={{
              borderRadius: 12, fontWeight: 600, height: 46, padding: '0 28px', fontSize: 14,
              background: 'linear-gradient(135deg,#f59e0b,#f97316)', border: 'none', color: '#fff',
            }}>
            导入备份
          </Button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (section) {
      case 'general':       return renderGeneral();
      case 'data':          return renderData();
      case 'obsidian':      return renderObsidian();
      case 'notifications': return renderNotifications();
      case 'about':         return renderAbout();
    }
  };

  return (
    <div style={inModal ? { display: 'flex', flexDirection: 'column', height: '80vh' } : { maxWidth: 900, margin: '0 auto' }}>
      {/* Modal header bar — only in modal mode */}
      {inModal ? (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 28px', borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingOutlined style={{ fontSize: 20, color: '#2563EB' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>设置</span>
          </div>
          <div
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', transition: 'all 0.15s',
              background: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <CloseOutlined />
          </div>
        </div>
      ) : (
        <Title level={3} style={{ color: 'var(--text-primary)', marginBottom: 24, fontWeight: 700, fontSize: 22 }}>
          <SettingOutlined style={{ marginRight: 10 }} />设置
        </Title>
      )}

      <div style={{ display: 'flex', gap: 28, flex: inModal ? 1 : undefined, minHeight: 0, padding: inModal ? 24 : 0 }}>
        {/* Left nav */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="glass-card" style={{ padding: 10, borderRadius: 16, position: inModal ? 'relative' : 'sticky', top: inModal ? 0 : 24 }}>
            {NAV.map(item => (
              <div
                key={item.key}
                onClick={() => setSection(item.key)}
                style={{
                  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                  fontWeight: section === item.key ? 600 : 400,
                  background: section === item.key ? 'linear-gradient(135deg, #2563EB, #3B82F6)' : 'transparent',
                  color: section === item.key ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  marginBottom: 4,
                  boxShadow: section === item.key ? '0 4px 16px rgba(37,99,235,0.3)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div>
                    <div style={{ lineHeight: 1.4 }}>{item.label}</div>
                    <div style={{
                      fontSize: 11, fontWeight: 400, lineHeight: 1.4,
                      opacity: section === item.key ? 0.75 : 0.5,
                    }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', paddingRight: 4 }}>
          {renderContent()}
        </div>
      </div>

      <CaptureTodosPanel open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
}
