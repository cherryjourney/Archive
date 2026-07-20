export interface Version {
  version: string;
  date: string;
  summary: string;
  changes: string[];
}

export const versions: Version[] = [
  {
    version: "V5.0.1",
    date: "2025-06",
    summary: "热修复：双重点击、CSS 动画冲突",
    changes: [
      "去除 React.StrictMode（Tauri WebView2 双重点击修复）",
      "修复 Ant Design 5 内置过渡系统冲突（Modal/Tabs/Button 闪烁）",
      "移除 filter: brightness / 自定义 @keyframes / 全局 transition",
    ],
  },
  {
    version: "V5.0",
    date: "2025-05",
    summary: "全局 UI 品质升级",
    changes: [
      "Dashboard Bento Grid 重构",
      "Tasks 双栏编辑 + 状态自动化",
      "20 页面打磨",
      "12 项交互动画改进",
    ],
  },
  {
    version: "V4.9",
    date: "2025-04",
    summary: "物品管理模块",
    changes: [
      "个人资产记录（名称/分类/品牌/价格/质保）",
      "4 列卡片网格 + 统计条",
      "质保到期提醒（30 天内系统通知）",
    ],
  },
  {
    version: "V4.8",
    date: "2025-03",
    summary: "出行清单模块",
    changes: [
      "8 个预置模板（短途/长途/出差/海边/滑雪等）",
      "4 列网格清单 + 逐项核对 + 进度条",
    ],
  },
  {
    version: "V4.7",
    date: "2025-02",
    summary: "旅行地图模块",
    changes: [
      "ECharts Geo 中国地图",
      "城市标记/评分/笔记 + 右侧 Glass 面板",
      "点击地图添加城市",
    ],
  },
  {
    version: "V4.6.2",
    date: "2025-01",
    summary: "侧边栏重构",
    changes: [
      "分组折叠 + 悬浮胶囊风格",
      "亮/暗双模式适配",
    ],
  },
  {
    version: "V4.6.1",
    date: "2024-12",
    summary: "人生事件 V2",
    changes: [
      "三列交替时间线重构",
      "出生日期系统 + 月份比例定位",
      "单日事件支持",
    ],
  },
  {
    version: "V4.5",
    date: "2024-11",
    summary: "倒数日 + 热力图 + 时间线提醒",
    changes: [
      "倒数日模块（15 个预设分类）",
      "应用使用热力图",
      "时间线自动进度与状态",
      "时间线弹窗提醒系统",
    ],
  },
  {
    version: "V4.0",
    date: "2024-09",
    summary: "学术模块 + 标签系统",
    changes: [
      "全局标签系统",
      "论文库（三栏看板）",
      "实验追踪",
    ],
  },
  {
    version: "V3.0",
    date: "2024-06",
    summary: "任务完成复盘 + 运动分类",
    changes: ["任务完成复盘（completion_note）", "新增「运动」分类"],
  },
  {
    version: "V2.0",
    date: "2024-03",
    summary: "每日计划时间线视图",
    changes: ["每日计划新增时间线视图（start_time/end_time）"],
  },
  {
    version: "V1.0",
    date: "2024-01",
    summary: "初始版本",
    changes: [
      "任务管理（CRUD/分类/标签/FTS）",
      "每日计划",
      "农历日历",
    ],
  },
];
