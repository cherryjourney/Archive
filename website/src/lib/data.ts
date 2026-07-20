export interface ModuleInfo {
  name: string;
  desc: string;
  icon: string;
}

export interface FeatureGroup {
  id: string;
  title: string;
  icon: string;
  modules: ModuleInfo[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: 'core',
    title: '核心',
    icon: 'LayoutDashboard',
    modules: [
      { name: '今日总览', desc: 'Bento Grid 仪表盘，一屏掌握今日所有', icon: 'HomeOutlined' },
      { name: '每日计划', desc: '早中晚三段式时间线，拖拽排序', icon: 'ScheduleOutlined' },
      { name: '任务库', desc: '自然语言解析，双栏编辑，全 CRUD', icon: 'CheckSquareOutlined' },
      { name: '番茄钟', desc: '正向计时，关联任务，系统托盘常驻', icon: 'ClockCircleOutlined' },
    ],
  },
  {
    id: 'time',
    title: '时间规划',
    icon: 'Clock',
    modules: [
      { name: '甘特图', desc: '日期范围可视化，拖拽调整，自动进度计算', icon: 'BarChartOutlined' },
      { name: '日历', desc: '周视图 + 月视图，农历节气假期标注', icon: 'CalendarOutlined' },
      { name: '倒计时', desc: '15 种预设分类，支持年度重复事件', icon: 'HourglassOutlined' },
      { name: '人生事件', desc: '三栏交替时间线，出生日期系统，6 色分类', icon: 'FlagOutlined' },
    ],
  },
  {
    id: 'academic',
    title: '学术',
    icon: 'BookOpen',
    modules: [
      { name: '论文库', desc: '三栏看板 (待读/阅读中/已读)，笔记标签', icon: 'ReadOutlined' },
      { name: '实验追踪', desc: '模型、数据集、超参数、指标追踪对比', icon: 'ExperimentOutlined' },
      { name: '课程管理', desc: '课程 + 作业截止日期管理', icon: 'BookOutlined' },
    ],
  },
  {
    id: 'tools',
    title: '工具',
    icon: 'Wrench',
    modules: [
      { name: '记账', desc: '12 分类，双账户体系，图表分析，CSV/MD 导出', icon: 'AccountBookOutlined' },
      { name: '标签', desc: '全局标签系统，Obsidian 双向同步', icon: 'TagsOutlined' },
      { name: '周报', desc: '自动生成每周总结，Markdown 导出', icon: 'FileTextOutlined' },
      { name: '统计', desc: 'GitHub 风格贡献热力图，年度汇总', icon: 'LineChartOutlined' },
      { name: '设置', desc: '主题切换、Obsidian 路径、通知偏好', icon: 'SettingOutlined' },
      { name: '旅行地图', desc: 'ECharts 中国地图，标记城市，旅记攻略', icon: 'EnvironmentOutlined' },
      { name: '出行清单', desc: '8 种预设模板，4 列网格，物品勾选', icon: 'CarryOutOutlined' },
      { name: '资产管理', desc: '7 分类，保修期追踪，过期提醒通知', icon: 'ShoppingOutlined' },
    ],
  },
];

export const VERSIONS = [
  {
    year: '2025',
    versions: [
      { version: 'V5.0.1', date: '2025', changes: 'React.StrictMode 修复，CSS 动画兼容' },
      { version: 'V5.0', date: '2025', changes: 'Bento Grid 仪表盘，双栏任务库，全局 UI 升级，20+ 页面精修' },
    ],
  },
  {
    year: '2025',
    versions: [
      { version: 'V4.9', date: '2025', changes: '资产管理 — 7 分类，保修期追踪，过期提醒' },
      { version: 'V4.8', date: '2025', changes: '出行清单 — 8 模板，4 列网格，物品勾选' },
      { version: 'V4.7', date: '2025', changes: '旅行地图 — ECharts 中国地图，城市标记，旅记' },
      { version: 'V4.6', date: '2025', changes: '人生事件 — 三栏交替时间线，出生日期系统' },
    ],
  },
  {
    year: '2024-2025',
    versions: [
      { version: 'V4.5', date: '2025', changes: '倒计时模块，使用热力图，时间线自动进度' },
      { version: 'V4.4', date: '2025', changes: '甘特图合并到统一任务表' },
      { version: 'V4.3', date: '2024', changes: '甘特图自定义颜色' },
      { version: 'V4.2', date: '2024', changes: '移除旧模块，精简架构' },
      { version: 'V4.1', date: '2024', changes: 'Obsidian Vault 标签同步' },
      { version: 'V4.0', date: '2024', changes: '全局标签，论文库，实验追踪' },
    ],
  },
  {
    year: '2024',
    versions: [
      { version: 'V3.8', date: '2024', changes: '独立甘特图模块' },
      { version: 'V3.7', date: '2024', changes: '项目管理，看板，任务日期范围' },
      { version: 'V3.6', date: '2024', changes: '通知系统，番茄钟，周报订阅' },
      { version: 'V3.0', date: '2024', changes: '任务审查，运动分类' },
    ],
  },
  {
    year: '2023-2024',
    versions: [
      { version: 'V2.0', date: '2024', changes: '每日计划时间线视图' },
      { version: 'V1.0', date: '2023', changes: '项目起步 — 任务管理，每日计划，知识库，农历日历' },
    ],
  },
];

export interface Scenario {
  id: string;
  number: string;
  title: string;
  quote: string;
  description: string;
  moduleNames: string[];
  imagePosition: 'left' | 'right';
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'morning',
    number: '01',
    title: '用 5 分钟，理清一整天',
    quote: '每天起床后打开 Archive，今日要做什么一目了然。',
    description:
      '仪表盘一屏掌握全局，每日计划把一天分成上午/下午/晚间三段，拖拽即可排序。日历视图叠加农历和节假日，番茄钟帮你专注——系统托盘常驻，随时可启。',
    moduleNames: ['今日总览', '每日计划', '日历', '番茄钟'],
    imagePosition: 'right',
  },
  {
    id: 'research',
    number: '02',
    title: '论文、实验、课程，全部有条不紊',
    quote: '不再在文件夹里翻找 PDF——你的研究进度，这里都有。',
    description:
      '论文库用三栏看板管理阅读进度——待读、阅读中、已读。实验追踪记录模型和数据集，课程管理追踪作业截止。全局标签把所有学术内容串联起来。',
    moduleNames: ['论文库', '实验追踪', '课程管理', '甘特图'],
    imagePosition: 'left',
  },
  {
    id: 'life',
    number: '03',
    title: '不只是学术，生活也要井井有条',
    quote: '记账、出行清单、旅行地图——一个应用，管好你的人生。',
    description:
      '记账支持 12 种分类和双账户体系，图表分析一目了然。出行清单内置 8 种预设模板，旅行地图用 ECharts 点亮你去过的城市。资产管理追踪质保到期，提前提醒。',
    moduleNames: ['记账', '出行清单', '旅行地图', '资产管理'],
    imagePosition: 'right',
  },
  {
    id: 'reflect',
    number: '04',
    title: '每一周，看见自己走过的路',
    quote: '周报自动汇总，统计数据说话——你的成长，有迹可循。',
    description:
      '周报自动生成每周总结，支持 Markdown 导出。统计模块提供 GitHub 风格贡献热力图和年度汇总。人生事件用三栏交替时间线记录轨迹，倒计时预设 15 种分类。',
    moduleNames: ['周报', '统计', '人生事件', '倒计时'],
    imagePosition: 'left',
  },
];

export const STATS = [
  { value: '19+', label: '功能模块' },
  { value: '5', label: '年持续迭代' },
  { value: '100%', label: '离线数据' },
];
