export interface Feature {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
}

export interface FeatureGroup {
  id: string;
  name: string;
  nameEn: string;
  features: Feature[];
}

export const featureGroups: FeatureGroup[] = [
  {
    id: "core",
    name: "核心",
    nameEn: "Core",
    features: [
      {
        id: "dashboard",
        name: "仪表盘",
        nameEn: "Dashboard",
        description: "今日概览、热力图、周趋势、分类分布、预估 vs 实际",
        icon: "LayoutDashboard",
      },
      {
        id: "tasks",
        name: "任务库",
        nameEn: "Tasks",
        description: "全功能 CRUD，自然语言解析，优先级/分类/标签/截止日期",
        icon: "CheckSquare",
      },
      {
        id: "daily-plan",
        name: "每日计划",
        nameEn: "Daily Plan",
        description: "上午/下午/晚间三段式时间线，拖拽排序，完成复盘",
        icon: "CalendarDays",
      },
      {
        id: "calendar",
        name: "日历视图",
        nameEn: "Calendar",
        description: "周视图 + 月视图，农历/节气/节假日，拖拽调度",
        icon: "Calendar",
      },
      {
        id: "pomodoro",
        name: "番茄钟",
        nameEn: "Pomodoro",
        description: "正向计时，关联任务，会话历史，系统托盘提示",
        icon: "Timer",
      },
    ],
  },
  {
    id: "time",
    name: "时间",
    nameEn: "Time",
    features: [
      {
        id: "timeline",
        name: "时间线（甘特图）",
        nameEn: "Timeline",
        description: "日期范围可视化，拖拽调整，任务连线，自动进度计算",
        icon: "GanttChart",
      },
      {
        id: "countdown",
        name: "倒数日",
        nameEn: "Countdown",
        description: "生日/纪念日/考试/项目截止等，正数/倒数，每年重复",
        icon: "Hourglass",
      },
      {
        id: "life-events",
        name: "人生事件",
        nameEn: "Life Events",
        description: "三列交替时间线，出生日期基准，月份比例定位",
        icon: "Milestone",
      },
      {
        id: "travel-map",
        name: "旅行地图",
        nameEn: "Travel Map",
        description: "ECharts Geo 中国地图，城市标记/评分/笔记，点击添加",
        icon: "MapPin",
      },
      {
        id: "packing",
        name: "出行清单",
        nameEn: "Packing",
        description: "模板库 + 4 列网格清单，逐项核对/进度条，拖拽排序",
        icon: "ClipboardList",
      },
      {
        id: "assets",
        name: "物品管理",
        nameEn: "Assets",
        description: "个人资产记录，购买信息/质保跟踪，分类统计/价值汇总",
        icon: "Package",
      },
    ],
  },
  {
    id: "academic",
    name: "学术",
    nameEn: "Academic",
    features: [
      {
        id: "papers",
        name: "论文库",
        nameEn: "Papers",
        description: "待读/阅读中/已读三栏，笔记/标签/星标",
        icon: "FileText",
      },
      {
        id: "experiments",
        name: "实验追踪",
        nameEn: "Experiments",
        description: "模型/数据集/超参/指标，实验对比",
        icon: "FlaskConical",
      },
      {
        id: "courses",
        name: "课程管理",
        nameEn: "Courses",
        description: "课程 + 作业管理，截止日期追踪",
        icon: "GraduationCap",
      },
    ],
  },
  {
    id: "tools",
    name: "工具",
    nameEn: "Tools",
    features: [
      {
        id: "bookkeeping",
        name: "记账",
        nameEn: "Bookkeeping",
        description: "收支记录，分类统计，月度报表",
        icon: "Wallet",
      },
      {
        id: "weekly-report",
        name: "周报生成",
        nameEn: "Weekly Report",
        description: "自动汇总本周完成情况，Markdown 导出",
        icon: "FileBarChart",
      },
      {
        id: "obsidian",
        name: "Obsidian 同步",
        nameEn: "Obsidian Sync",
        description: "自动扫描 vault 标签，双向链接面板",
        icon: "Link",
      },
      {
        id: "tags",
        name: "全局标签",
        nameEn: "Tags",
        description: "任务/论文/实验统一标签体系，回链追踪",
        icon: "Tag",
      },
      {
        id: "notifications",
        name: "通知系统",
        nameEn: "Notifications",
        description: "任务到期提醒 + 时间线弹窗提醒 + 质保到期提醒",
        icon: "Bell",
      },
    ],
  },
];

export const allFeatures = featureGroups.flatMap((g) => g.features);
