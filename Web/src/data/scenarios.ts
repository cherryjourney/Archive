export interface Scenario {
  id: string;
  number: string;
  title: string;
  titleEn: string;
  quote: string;
  description: string;
  moduleIds: string[];
  reversed?: boolean;
}

export const scenarios: Scenario[] = [
  {
    id: "life",
    number: "01",
    title: "把日子，一点点记下来。",
    titleEn: "Record your days, one by one.",
    quote: "不记得昨天做了什么，就谈不上过好今天。",
    description:
      "倒数日帮你记住每个重要时刻，人生事件用三列时间线记录你的成长轨迹。去过的城市在地图上点亮，出行前用清单模板从容准备，买过的东西有质保到期提醒。",
    moduleIds: ["countdown", "life-events", "travel-map", "packing", "assets"],
  },
  {
    id: "reading",
    number: "02",
    title: "让每一篇论文，都留下痕迹。",
    titleEn: "Let every paper leave a trace.",
    quote: "读过的论文不该消失在浏览器历史里。",
    description:
      "论文库用三栏看板管理你的阅读进度——待读、阅读中、已读。实验追踪记录模型和数据集，课程管理追踪作业截止。全局标签把所有学术内容串联起来，Obsidian 同步让笔记双向流通。",
    moduleIds: ["papers", "experiments", "courses", "tags", "obsidian"],
    reversed: true,
  },
  {
    id: "research",
    number: "03",
    title: "科研的节奏，由你掌控。",
    titleEn: "Research rhythm, under your control.",
    quote: "高效的科研，是把时间花在真正重要的事上。",
    description:
      "任务库用自然语言快速创建待办，每日计划把一天分成上午/下午/晚间三段。甘特图可视化你的项目进度，日历视图叠加农历和节假日。番茄钟帮你专注，仪表盘让你一眼看清全局。",
    moduleIds: [
      "tasks",
      "daily-plan",
      "timeline",
      "calendar",
      "pomodoro",
      "dashboard",
    ],
  },
];
