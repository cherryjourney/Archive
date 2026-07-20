import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Tooltip, Modal, Button, Space, Typography, message } from 'antd';
import {
  HomeOutlined, ScheduleOutlined,
  CalendarOutlined, SettingOutlined, EnvironmentOutlined,
  ClockCircleOutlined, FileTextOutlined,
  FieldTimeOutlined,
  ExperimentOutlined, TagsOutlined, FundOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  BookOutlined, ThunderboltOutlined,
  BarChartOutlined, HourglassOutlined, HistoryOutlined,
  BellOutlined, CaretDownOutlined, CaretRightOutlined,
  SolutionOutlined, TrophyOutlined, TeamOutlined, RocketOutlined,
  ShoppingOutlined, AccountBookOutlined,
  BulbOutlined, AimOutlined, HeartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { listen } from '@tauri-apps/api/event';
import GlobalSearch from '@/components/common/GlobalSearch';
import SettingsPage from '@/pages/SettingsPage';
import MemoryCapture from '@/components/memory/MemoryCapture';
import EmotionCheckinModal from '@/components/emotion/EmotionCheckinModal';
import { useEmotionStore } from '@/stores/emotionStore';
import { sessionService } from '@/services/sessionService';
import { taskService } from '@/services/taskService';
import { planService } from '@/services/planService';
import { userProfileService } from '@/services/userProfileService';
import { calcAutoProgress } from '@/components/timeline/TimelineTable';
import type { Task } from '@/types/task';
import { PRIORITY_COLORS } from '@/types/task';
const { Sider, Content } = Layout;
const { Text } = Typography;

interface NavItem {
  key: string; label: string; icon: React.ReactNode;
  color: string; bg: string; bgDark: string;
}

interface NavGroup {
  key: string; label: string; items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    key: 'core', label: '核心',
    items: [
      { key: '/',            label: '今日概览', icon: <HomeOutlined />,           color: '#2563EB', bg: '#EFF6FF', bgDark: '#1E3A5F22' },
      { key: '/plan',        label: '每日计划', icon: <ScheduleOutlined />,       color: '#3B82F6', bg: '#F0F9FF', bgDark: '#1E3A5F18' },
    ],
  },
  {
    key: 'time', label: '时间规划',
    items: [
      { key: '/timeline',    label: '甘特图',   icon: <FieldTimeOutlined />,      color: '#2563EB', bg: '#F0F4FF', bgDark: '#1E3A5F18' },
      { key: '/calendar',    label: '日历视图', icon: <CalendarOutlined />,       color: '#0891B2', bg: '#ECFEFF', bgDark: '#155E7518' },
      { key: '/countdown',   label: '倒数日',   icon: <HourglassOutlined />,      color: '#EC4899', bg: '#FFF1F2', bgDark: '#88133712' },
      { key: '/life-events', label: '人生事件', icon: <HistoryOutlined />,        color: '#3B82F6', bg: '#EFF6FF', bgDark: '#1E3A5F22' },
    ],
  },
  {
    key: 'academic', label: '学术',
    items: [
      { key: '/papers',      label: '论文库',   icon: <FundOutlined />,           color: '#7C3AED', bg: '#F5F3FF', bgDark: '#4C1D9518' },
      { key: '/experiments', label: '实验追踪', icon: <ExperimentOutlined />,     color: '#059669', bg: '#ECFDF5', bgDark: '#064E3B12' },
      { key: '/courses',     label: '课程管理', icon: <BookOutlined />,           color: '#6366F1', bg: '#EEF2FF', bgDark: '#3730A318' },
      { key: '/advisor',    label: '导师沟通', icon: <TeamOutlined />,          color: '#7C3AED', bg: '#F5F3FF', bgDark: '#4C1D9518' },
      { key: '/grad',       label: '读研全景', icon: <RocketOutlined />,       color: '#F59E0B', bg: '#FFFBEB', bgDark: '#78350F18' },
    ],
  },
  {
    key: 'tools', label: '工具',
    items: [
      { key: '/finance',     label: '记账',     icon: <AccountBookOutlined />,    color: '#0891B2', bg: '#ECFEFF', bgDark: '#155E7518' },
      { key: '/travel',      label: '旅行地图', icon: <EnvironmentOutlined />,    color: '#059669', bg: '#ECFDF5', bgDark: '#064E3B12' },
      { key: '/wishlist',   label: '想去的地方', icon: <HeartOutlined />,        color: '#EC4899', bg: '#FFF1F2', bgDark: '#88133712' },
      { key: '/packing',    label: '出行清单', icon: <SolutionOutlined />,       color: '#10B981', bg: '#ECFDF5', bgDark: '#064E3B12' },
      { key: '/assets',     label: '物品管理', icon: <ShoppingOutlined />,      color: '#6366F1', bg: '#EEF2FF', bgDark: '#312E8118' },
      { key: '/contacts',   label: '人脉图谱', icon: <AimOutlined />,           color: '#3B82F6', bg: '#EFF6FF', bgDark: '#1E3A5F22' },
      { key: '/tags',        label: '标签管理', icon: <TagsOutlined />,           color: '#D97706', bg: '#FFF7ED', bgDark: '#78350F12' },
      { key: '/report',      label: '周报',     icon: <FileTextOutlined />,       color: '#7C3AED', bg: '#F5F3FF', bgDark: '#4C1D9518' },
      { key: '/stats',       label: '使用统计', icon: <BarChartOutlined />,       color: '#059669', bg: '#ECFDF5', bgDark: '#064E3B12' },
      { key: '/settings',    label: '设置',     icon: <SettingOutlined />,        color: '#64748B', bg: '#F8FAFC', bgDark: '#1E293B18' },
    ],
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['core', 'time']));
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [taskReminder, setTaskReminder] = useState<{
    task_id: string; title: string; start_time: string; end_time: string | null;
  } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryCaptureOpen, setMemoryCaptureOpen] = useState(false);
  const [emotionCheckinOpen, setEmotionCheckinOpen] = useState(false);
  const emotionCheckedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = '/' + location.pathname.split('/')[1];

  // Listen for memory global shortcut
  useEffect(() => {
    const unlistenPromise = listen('memory-shortcut-pressed', () => {
      setMemoryCaptureOpen(true);
    });
    return () => { unlistenPromise.then((fn: any) => fn()); };
  }, []);

  // Auto-expand group containing the active page
  useEffect(() => {
    for (const group of navGroups) {
      if (group.items.some(item =>
        item.key === selectedKey || (item.key !== '/' && selectedKey.startsWith(item.key))
      )) {
        setExpandedGroups(prev => {
          if (prev.has(group.key)) return prev;
          const next = new Set(prev);
          next.add(group.key);
          return next;
        });
        break;
      }
    }
  }, [selectedKey]);

  // Check if emotion checkin needed today
  const { fetchToday: fetchEmotion, checkedInToday } = useEmotionStore();
  useEffect(() => {
    if (!emotionCheckedRef.current) {
      emotionCheckedRef.current = true;
      fetchEmotion().then(() => {
        const state = useEmotionStore.getState();
        if (!state.checkedInToday && !state.loading) {
          // Delay slightly to let dashboard load first
          setTimeout(() => setEmotionCheckinOpen(true), 800);
        }
      });
    }
  }, []);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  // ── 当天首次打开：待安排任务提醒 ──
  const [unscheduledReminder, setUnscheduledReminder] = useState<
    Array<{ id: string; title: string; priority: number }> | null
  >(null);
  const unscheduledCheckedRef = useRef(false);
  useEffect(() => {
    if (unscheduledCheckedRef.current) return;
    unscheduledCheckedRef.current = true;
    (async () => {
      try {
        const today = dayjs().format('YYYY-MM-DD');
        // 每天只在第一次打开时提醒（user_profile 持久化去重）
        const lastShown = await userProfileService.getProfile('last_unscheduled_reminder_date');
        if (lastShown === today) return;

        const plan = await planService.getDailyPlan(today);
        const unscheduled = plan.tasks.filter(
          (pt) => !pt.start_time && pt.task.status !== 'completed' && pt.task.status !== 'cancelled'
        );
        if (unscheduled.length === 0) return;

        await userProfileService.setProfile('last_unscheduled_reminder_date', today);
        // 稍作延迟，让 Dashboard 先渲染（与情绪签入弹窗错开）
        setTimeout(() => {
          setUnscheduledReminder(
            unscheduled.map((pt) => ({ id: pt.task_id, title: pt.task.title, priority: pt.task.priority }))
          );
        }, 1600);
      } catch { /* best-effort — 提醒失败不影响使用 */ }
    })();
  }, []);

  // Start session on mount
  useEffect(() => {
    sessionService.startSession(sessionIdRef.current).catch((e) =>
      console.error('[AppLayout] Failed to start session:', e)
    );
  }, []);

  // 监听窗口关闭
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setup = async () => {
      try {
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        unlisten = await getCurrentWebviewWindow().onCloseRequested(() => {
          setCloseModalOpen(true);
        });
      } catch (e) {
        console.error('[AppLayout] onCloseRequested failed:', e);
      }
    };
    setup();
    return () => { unlisten?.(); };
  }, []);

  // 监听任务提醒事件
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<{
          task_id: string; title: string; start_time: string; end_time: string | null;
        }>('task-reminder', (event) => {
          setTaskReminder(event.payload);
        });
      } catch (e) {
        console.error('[AppLayout] task-reminder listener failed:', e);
      }
    };
    setup();
    return () => { unlisten?.(); };
  }, []);

  // ── Timeline task reminders ──
  const [timelineReminder, setTimelineReminder] = useState<{
    startingSoon: Array<{ id: string; title: string; startDate: string; daysUntil: number }>;
    endingSoon: Array<{ id: string; title: string; endDate: string; daysLeft: number; progress: number }>;
  } | null>(null);
  const timelineReminderDismissedRef = useRef(false);

  const checkTimelineReminders = useCallback(async () => {
    if (timelineReminderDismissedRef.current) return;
    try {
      const result = await taskService.listTasks({ page_size: 500 });
      const today = dayjs().startOf('day');
      const timelineTasks = result.tasks.filter((t: Task) => t.start_date && t.end_date);

      const startingSoon: Array<{ id: string; title: string; startDate: string; daysUntil: number }> = [];
      const endingSoon: Array<{ id: string; title: string; endDate: string; daysLeft: number; progress: number }> = [];

      for (const t of timelineTasks) {
        const start = dayjs(t.start_date);
        const end = dayjs(t.end_date);
        const daysUntilStart = start.diff(today, 'day');
        const daysUntilEnd = end.diff(today, 'day');

        // Task starts within 1 day (today or tomorrow) and is still pending
        if (daysUntilStart >= 0 && daysUntilStart <= 1 && t.status !== 'completed' && t.status !== 'cancelled') {
          startingSoon.push({
            id: t.id,
            title: t.title,
            startDate: t.start_date!,
            daysUntil: daysUntilStart,
          });
        }

        // Task ending within 2 days and not completed
        if (daysUntilEnd >= 0 && daysUntilEnd <= 2 && t.status !== 'completed' && t.status !== 'cancelled') {
          endingSoon.push({
            id: t.id,
            title: t.title,
            endDate: t.end_date!,
            daysLeft: daysUntilEnd,
            progress: calcAutoProgress(t.start_date!, t.end_date!),
          });
        }
      }

      if (startingSoon.length > 0 || endingSoon.length > 0) {
        setTimelineReminder({ startingSoon, endingSoon });

        // Also send system notification
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const totalCount = startingSoon.length + endingSoon.length;
          const summary = [
            startingSoon.length > 0 ? `${startingSoon.length}个任务即将开始` : '',
            endingSoon.length > 0 ? `${endingSoon.length}个任务临近截止` : '',
          ].filter(Boolean).join('，');
          await invoke('send_timeline_reminder_notification', {
            title: '⏰ 时间线提醒',
            body: `${summary}，共${totalCount}项`,
          }).catch(() => {/* ignore if notification not available */});
        } catch { /* ignore */ }
      }
    } catch { /* silent fail — reminder is best-effort */ }
  }, []);

  // Check timeline reminders on mount and every 5 minutes
  useEffect(() => {
    checkTimelineReminders();
    const interval = setInterval(checkTimelineReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkTimelineReminders]);

  const handleQuit = useCallback(async () => {
    try {
      await sessionService.endSession(sessionIdRef.current);
    } catch (e) {
      console.error('[AppLayout] Failed to end session:', e);
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('confirm_close', { action: 'quit' });
  }, []);

  const handleTray = useCallback(async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('confirm_close', { action: 'tray' });
    setCloseModalOpen(false);
  }, []);

  return (
    <>
    <Layout style={{ height: '100vh', background: 'transparent' }}>
      {/* 侧边栏 — 悬浮胶囊风格 · 亮色浅底 / 暗色深底 */}
      <Sider
        trigger={null} collapsible collapsed={collapsed} width={250}
        style={{
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          boxShadow: '2px 0 24px rgba(0,0,0,0.04)',
          height: '100vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Flex wrapper — bypasses Ant Design's internal div that breaks flex chain */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          height: '100%', overflow: 'hidden',
        }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '18px 0' : '20px 18px',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 12, borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <img src="/logo.svg" alt="Archive · 存迹" style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            boxShadow: '0 4px 16px rgba(37,99,235,0.28)',
          }} />
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: 0.3, lineHeight: 1.3 }}>
                Archive<span style={{ color: '#2563EB' }}> · 存迹</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                每一段认真度过的晨昏，皆在此间。
              </div>
            </div>
          )}
        </div>

        {/* 全局搜索 */}
        <GlobalSearch />

        {/* 导航 — 胶囊风格 */}
        <nav style={{ flex: '1 1 0%', minHeight: 0, padding: '14px 12px', overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {collapsed ? (
            /* 折叠模式 — 胶囊图标 */
            navGroups.flatMap(g => g.items).map((item) => {
              const isActive = selectedKey === item.key || (item.key !== '/' && selectedKey.startsWith(item.key));
              return (
                <Tooltip key={item.key} title={item.label} placement="right">
                  <div
                    onClick={() => {
                      if (item.key === '/settings') {
                        setSettingsOpen(true);
                      } else {
                        navigate(item.key);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 42, height: 42, margin: '0 auto 6px', borderRadius: 12,
                      cursor: 'pointer',
                      background: isActive
                        ? 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
                        : 'transparent',
                      boxShadow: isActive ? '0 4px 14px rgba(37,99,235,0.28)' : 'none',
                      transition: 'all 0.2s var(--ease-out, cubic-bezier(0.16,1,0.3,1))',
                    }}
                  >
                    <span style={{
                      fontSize: 17,
                      color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                      transition: 'color 0.2s ease',
                      display: 'flex',
                    }}>
                      {item.icon}
                    </span>
                  </div>
                </Tooltip>
              );
            })
          ) : (
            /* 展开模式 — 分组 + 胶囊卡片 */
            navGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.key);
              const toggleGroup = () => {
                setExpandedGroups(prev => {
                  const next = new Set(prev);
                  if (next.has(group.key)) next.delete(group.key);
                  else next.add(group.key);
                  return next;
                });
              };

              return (
                <div key={group.key} style={{ marginBottom: 12 }}>
                  {/* 分组标题 + 分割线 */}
                  <div
                    onClick={toggleGroup}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '0 6px', marginBottom: 8,
                      cursor: 'pointer', userSelect: 'none',
                      color: 'var(--text-muted)',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <span style={{
                      fontSize: 9, display: 'flex', alignItems: 'center',
                      transition: 'transform 0.2s ease',
                      transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }}>
                      <CaretDownOutlined />
                    </span>
                    <span style={{ flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                      {group.label}
                    </span>
                    {/* 分割线 */}
                    <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)', minWidth: 12 }} />
                  </div>

                  {/* 胶囊子项 */}
                  <div style={{
                    overflow: 'hidden',
                    maxHeight: isExpanded ? `${group.items.length * 42}px` : '0px',
                    opacity: isExpanded ? 1 : 0,
                    transition: 'max-height 0.3s var(--ease-out, cubic-bezier(0.16,1,0.3,1)), opacity 0.2s ease',
                  }}>
                    {group.items.map((item) => {
                      const isActive = selectedKey === item.key || (item.key !== '/' && selectedKey.startsWith(item.key));
                      const isHovered = hoveredItem === item.key;

                      return (
                        <div
                          key={item.key}
                          onClick={() => {
                            if (item.key === '/settings') {
                              setSettingsOpen(true);
                            } else {
                              navigate(item.key);
                            }
                          }}
                          onMouseEnter={() => setHoveredItem(item.key)}
                          onMouseLeave={() => setHoveredItem(null)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', marginBottom: 3, borderRadius: 12,
                            cursor: 'pointer',
                            background: isActive
                              ? 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
                              : isHovered ? 'rgba(37,99,235,0.05)' : 'transparent',
                            boxShadow: isActive ? '0 4px 14px rgba(37,99,235,0.28)' : 'none',
                            transition: 'all 0.2s var(--ease-out, cubic-bezier(0.16,1,0.3,1))',
                          }}
                        >
                          <span style={{
                            fontSize: 15, display: 'flex', flexShrink: 0,
                            color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                            transition: 'color 0.2s ease',
                          }}>
                            {item.icon}
                          </span>
                          <span style={{
                            fontSize: 13, fontWeight: isActive ? 600 : 500,
                            color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                            transition: 'color 0.2s ease',
                          }}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        {/* 底部折叠按钮 */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          {/* Collapse toggle */}
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              color: 'var(--text-muted)', cursor: 'pointer',
              padding: 6, borderRadius: 8,
              transition: 'color 0.2s ease',
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </div>
        </div>
      </Sider>

      {/* 内容区 */}
      <Layout style={{ background: 'transparent', position: 'relative', overflow: 'hidden' }}>
        <Content className="page-bg" style={{
          margin: 0,
          padding: (location.pathname.startsWith('/travel') || location.pathname.startsWith('/contacts')) ? 0 : '28px 32px',
          minHeight: 280,
          overflow: (location.pathname.startsWith('/travel') || location.pathname.startsWith('/contacts')) ? 'hidden' : 'auto',
          height: '100vh',
        }}>
          <div className="page-enter" style={{ height: (location.pathname.startsWith('/travel') || location.pathname.startsWith('/contacts')) ? '100%' : undefined }}><Outlet /></div>
        </Content>
      </Layout>
    </Layout>

    {/* 关闭确认对话框 */}
    <Modal
      title={null}
      open={closeModalOpen}
      onCancel={() => setCloseModalOpen(false)}
      footer={null}
      width={340}
      closable={false}
      centered
    >
      <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, margin: '0 auto 12px',
          background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: '#fff',
        }}>
          <ThunderboltOutlined />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18 }}>
          选择操作
        </div>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block size="large" onClick={handleTray}
            style={{
              height: 46, borderRadius: 12, fontWeight: 600, fontSize: 14,
              background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
              border: 'none', color: '#fff',
            }}
          >最小化到系统托盘</Button>
          <Button block size="large" onClick={handleQuit}
            style={{
              height: 46, borderRadius: 12, fontWeight: 500, fontSize: 13,
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.18)', color: '#DC2626',
            }}
          >关闭程序</Button>
          <Button block size="large" onClick={() => setCloseModalOpen(false)}
            style={{
              height: 42, borderRadius: 12, fontWeight: 400, fontSize: 13,
              background: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >取消</Button>
        </Space>
      </div>
    </Modal>

    {/* 任务提醒弹窗 */}
    <Modal
      title={null}
      open={!!taskReminder}
      onCancel={() => setTaskReminder(null)}
      footer={null}
      width={360}
      closable={false}
      centered
    >
      {taskReminder && (
        <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 10px',
            background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            <ClockCircleOutlined style={{ color: '#2563EB' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
            该开始了
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#2563EB', marginBottom: 6 }}>
            {taskReminder.title}
          </div>
          <Text style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 18 }}>
            {taskReminder.start_time?.slice(11, 16)}
            {taskReminder.end_time ? ` — ${taskReminder.end_time.slice(11, 16)}` : ''}
          </Text>
          <Space>
            <Button type="primary" onClick={() => { navigate('/plan'); setTaskReminder(null); }}
              style={{
                borderRadius: 12, fontWeight: 600, height: 42,
                background: 'linear-gradient(135deg, #2563EB, #3B82F6)', border: 'none',
              }}
            >查看计划</Button>
            <Button onClick={() => setTaskReminder(null)}
              style={{ borderRadius: 12, height: 42 }}
            >知道了</Button>
          </Space>
        </div>
      )}
    </Modal>

    {/* 设置弹窗 — IDE 风格大对话框 */}
    <Modal
      title={null}
      open={settingsOpen}
      onCancel={() => setSettingsOpen(false)}
      footer={null}
      width={960}
      centered
      closable={false}
      destroyOnClose
      maskStyle={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      styles={{
        body: { padding: 0, maxHeight: '85vh', overflow: 'hidden' },
        content: {
          borderRadius: 20,
          background: 'var(--bg-card)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(37,99,235,0.08)',
          padding: 0,
        },
      }}
    >
      <SettingsPage inModal onClose={() => setSettingsOpen(false)} />
    </Modal>

    {/* 记忆快速捕获（全局快捷键唤出） */}
    <MemoryCapture open={memoryCaptureOpen} onClose={() => setMemoryCaptureOpen(false)} />

    {/* 科研情绪日记签入 */}
    <EmotionCheckinModal open={emotionCheckinOpen} onClose={() => setEmotionCheckinOpen(false)} />

    {/* 时间线任务提醒弹窗 */}
    <Modal
      title={null}
      open={!!timelineReminder}
      onCancel={() => { setTimelineReminder(null); timelineReminderDismissedRef.current = true; }}
      footer={null}
      width={420}
      closable={false}
      centered
    >
      {timelineReminder && (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              <BellOutlined style={{ color: '#D97706' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                时间线提醒
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {dayjs().format('M月D日')}
              </div>
            </div>
          </div>

          {timelineReminder.startingSoon.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', marginBottom: 8 }}>
                🚀 即将开始
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {timelineReminder.startingSoon.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        开始: {item.startDate}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: '#2563EB',
                      padding: '3px 10px', borderRadius: 6,
                      background: 'rgba(37,99,235,0.08)',
                    }}>
                      {item.daysUntil === 0 ? '今天' : '明天'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {timelineReminder.endingSoon.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 8 }}>
                ⏳ 临近截止
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {timelineReminder.endingSoon.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.1)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        截止: {item.endDate} · 进度 {item.progress}%
                      </div>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: '#DC2626',
                      padding: '3px 10px', borderRadius: 6,
                      background: 'rgba(220,38,38,0.08)',
                      flexShrink: 0, marginLeft: 8,
                    }}>
                      {item.daysLeft === 0 ? '今天截止' : `剩${item.daysLeft}天`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => { setTimelineReminder(null); timelineReminderDismissedRef.current = true; }}
              style={{ borderRadius: 10, height: 38 }}
            >
              今天不再提醒
            </Button>
            <Button
              type="primary"
              onClick={() => { navigate('/timeline'); setTimelineReminder(null); }}
              style={{
                borderRadius: 10, fontWeight: 600, height: 38,
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', border: 'none',
              }}
            >
              查看时间线
            </Button>
          </div>
        </div>
      )}
    </Modal>

    {/* 当天首次打开 — 待安排任务提醒弹窗 */}
    <Modal
      title={null}
      open={!!unscheduledReminder}
      onCancel={() => setUnscheduledReminder(null)}
      footer={null}
      width={420}
      closable={false}
      centered
    >
      {unscheduledReminder && (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              📥
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                今日待安排任务
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {dayjs().format('M月D日')} · {unscheduledReminder.length} 个任务还没有安排时间
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {unscheduledReminder.map((item) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: PRIORITY_COLORS[item.priority],
                }} />
                <div style={{
                  fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setUnscheduledReminder(null)}
              style={{ borderRadius: 10, height: 38 }}
            >
              知道了
            </Button>
            <Button
              type="primary"
              onClick={() => { navigate('/plan'); setUnscheduledReminder(null); }}
              style={{
                borderRadius: 10, fontWeight: 600, height: 38,
                background: 'linear-gradient(135deg, #D97706, #F59E0B)', border: 'none',
              }}
            >
              去安排
            </Button>
          </div>
        </div>
      )}
    </Modal>

  </>
  );
}
