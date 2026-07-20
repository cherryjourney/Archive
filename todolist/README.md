# Archive · 存迹

> 研究生个人效率桌面应用 — 任务管理 · 时间线 · 倒数日 · 番茄钟 · 论文库 · Obsidian 集成

**技术栈:** Tauri 2 (Rust) + React 18 + TypeScript + Ant Design 5 + SQLite  
**目标平台:** Windows (x86_64-pc-windows-gnu)  
**当前版本:** V5.4.0

---

## 功能矩阵

| 模块 | 说明 |
|------|------|
| 📋 任务库 | 全功能 CRUD，自然语言解析，优先级/分类/标签/截止日期 |
| 📅 每日计划 | 上午/下午/晚间三段式时间线，拖拽排序，完成复盘 |
| 📆 日历视图 | 周视图 + 月视图，农历/节气/节假日，拖拽调度 |
| ⏱️ 时间线（甘特图） | 日期范围可视化，拖拽调整，任务连线，自动进度计算 |
| 🔢 倒数日 | 生日/纪念日/考试/项目截止等，正数/倒数，每年重复 |
| 🍅 番茄钟 | 正向计时，关联任务，会话历史，系统托盘提示 |
| 📝 论文库 | 待读/阅读中/已读三栏，笔记/标签/星标 |
| 🧪 实验追踪 | 模型/数据集/超参/指标，实验对比 |
| 📚 课程管理 | 课程 + 作业管理，截止日期追踪 |
| 📊 仪表盘 | 今日概览、热力图、周趋势、分类分布、预估 vs 实际 |
| 📈 周报生成 | 自动汇总本周完成情况，Markdown 导出 |
| 📓 Obsidian 深度集成 | Daily Note 导出 + 双向任务同步 + TODO 捕获/沉淀 + 知识图谱上下文 + Calendar 皮肤 |
| 🏷️ 全局标签 | 任务/论文/实验统一标签体系，回链追踪 |
| 🧭 人生事件 | 三列交替时间线，出生日期基准，月份比例定位，单日/范围事件 |
| 🗺️ 旅行地图 | ECharts Geo 中国地图，城市标记/评分/笔记，点击添加，Glass 面板 |
| 📋 出行清单 | 模板库 + 4 列网格清单，逐项核对/进度条，拖拽排序 |
| 📦 物品管理 | 个人资产记录，购买信息/质保跟踪，分类统计/价值汇总，质保到期提醒 |
| 💰 记账 | 收支记录/转账，12 个预设分类，存款+日常双账户体系，月度统计/热力图/趋势图 |
| 🤖 AI 对话 | 右侧滑出 Glass 面板，Ollama 本地大模型，模型可切换，流式逐字输出，多会话管理，Markdown 渲染 |
| 🛠️ AI 工具调用 | ReAct Agent — LLM 可查询/创建任务、搜索论文、查账、查倒数日/旅行/统计，中文 NLP 自然语言精确解析 |
| 🔔 通知系统 | 任务到期提醒 + 时间线即将开始/临近截止弹窗提醒 + 质保到期提醒 |
| 🌙 暗色模式 | 亮色/暗色双主题，CSS 变量 + Ant Design token |

---

## 快速开始

```bash
# 安装依赖
cd todolist && npm install

# 前端开发（浏览器）
npm run dev

# 完整 Tauri 应用
cargo tauri dev

# TypeScript 类型检查
npx tsc --noEmit

# Rust 类型检查
cd src-tauri && cargo check
```

---

## 版本历史

| 版本 | 迁移 | 变更摘要 |
|------|------|----------|
| **V1.0** | v1 | 初始版本：任务管理（CRUD/分类/标签/FTS）、每日计划、知识库（文件夹/文档）、农历日历 |
| **V2.0** | v2 | 每日计划新增时间线视图（start_time/end_time） |
| **V3.0** | v3 | 任务完成复盘（completion_note）、新增「运动」分类 |
| **V3.6** | v5 | 通知配置、番茄钟计时器、周报订阅 |
| **V3.7** | v6 | 项目管理（项目/看板/任务关系）、任务增加日期范围和进度字段 |
| **V3.8** | v7 | 独立甘特图模块（gantt_tasks / gantt_task_relationships） |
| **V4.0** | v8 | 全局标签系统、论文库（待读/阅读中/已读）、实验追踪、OKR 目标管理 |
| **V4.1** | v9 | Obsidian Vault 集成（标签同步/双向链接/文件监听） |
| **V4.2** | v10 | 清理旧模块：移除知识库（被 Obsidian 替代）、项目管理、看板、OKR |
| **V4.3** | v11 | 甘特图任务支持自定义颜色 |
| **V4.4** | v12–14 | 甘特图合并入统一任务表（color 列 + task_relationships → 迁移 → 删旧表） |
| **V4.5** | v15–16 | 倒数日模块、应用使用热力图、时间线自动进度与状态、时间线提醒系统 |
| **V4.6** | v17 | 人生事件 V1（双栏时间线 + MonthPicker + 手动选色） |
| **V4.6.1** | v18 | 人生事件 V2：三列交替时间线重构，月份比例定位，出生日期系统，单日事件支持 |
| **V4.6.2** | — | 侧边栏重构：分组折叠 + 悬浮胶囊风格 + 亮/暗双模式适配，去毛玻璃效果 |
| **V4.7** | v19 | 旅行地图：ECharts 中国地图 + 城市标记/评分/笔记 + 右侧 Glass 面板 + 点击地图添加城市 |
| **V4.8** | v20 | 出行清单：模板库（8 个模板）+ 4 列网格清单 + 物品核对 + 进度条 |
| **V4.9** | v21 | 物品管理：个人资产记录 + 分类/状态筛选 + 质保跟踪 + 价值统计 + 质保到期通知 |
| **V5.0** | — | 全局 UI 品质升级：Dashboard Bento Grid 重构、Tasks 双栏编辑+状态自动化、20 页面打磨、12 项交互动画改进 |
| **V5.0.1** | — | 热修复：去除 React.StrictMode（Tauri WebView2 双重点击）、修复 CSS 动画与 Ant Design 5 内置过渡系统冲突（Modal/Tabs/Button 闪烁） |
| **V5.0.2** | — | 热修复：未来日期任务在日历视图不显示 + 任务库中未来任务状态显示错误 |
| **V5.1** | v22 | 记账模块：收支记录 + 转账 + 账户管理 + 月度统计图表（统计/热力图/趋势/分类饼图） |
| **V5.1.1** | v23 | Obsidian 深度集成 V1：Daily Note 导出 + 双向任务同步 + TODO 捕获/沉淀 + 知识图谱上下文 |
| **V5.2.0** | — | Obsidian 深度集成 V2：Calendar 皮肤 — 批量同步计划到 Daily Note + 任务完成自动更新统计 |
| **V5.3.0** | v24 | AI 对话面板：Ollama 本地大模型集成 + 右侧 Glass 面板 + 流式逐字输出 + 多会话管理 + Markdown 渲染 |
| **V5.4.0** | — | AI 工具调用（Agent）：ReAct 循环 + 10 个工具（任务/论文/记账/倒数日/旅行/统计）+ NLP 中文自然语言解析器 + create_task 混合解析 |

### V4.5 详细变更

**新增功能：**
- 🔢 **倒数日模块**：countdown_events 表 + 完整 CRUD，15 个预设分类（生日/考试/纪念日/旅行/项目截止等），支持每年重复，Dashboard 卡片展示，正数/倒数双模式
- 📊 **应用使用热力图**：app_sessions 表记录每次会话时长，Dashboard 贡献热力图展示完整年度
- ⏱️ **时间线自动进度**：进度 = 已过天数/总天数，状态基于日期自动判定（pending/in_progress），手动设置的状态不被覆盖
- 🔔 **时间线提醒系统**：弹窗（即将开始 ≤1天 + 临近截止 ≤2天）+ 系统原生通知 + "今天不再提醒"

**改进与修复：**
- 热力图月标签对齐修复（flex → absolute 定位）
- 热力图显示完整年度（移除 compact 模式）
- 倒数日页面内容整体放大
- 时间线表单移除进度滑块，改为日期自动计算
- 新建时间线任务默认状态改为「进行中」

### V4.6.1 详细变更

**人生事件 V2 三列时间线重构：**
- 🧭 **三列交替布局**：左列事件 + 中列虚线时间线 + 右列事件，按时间交替排列（偶数左/奇数右）
- 🎂 **出生日期系统**：首次弹窗设置 → `user_profile` 表存储 → 页顶常驻显示 · 已度过 N 年
- 📅 **日期精度**：年月必填 + 日可选填（年 Select + 月 Select + 日 InputNumber，不用 DatePicker）
- 🎨 **自动配色**：去掉颜色选择器，6 个分类（教育/职业/居住/关系/成长/其他）自动匹配预设色
- 📍 **单日事件**：不设结束日期自动存为同日，卡片只显示单个日期
- 📐 **月份比例定位**：间距 = 月份差 × 6px，12 月靠近下一年，1 月靠近上一年，空年份压缩 14px
- 🪟 **详情 Modal**：点击卡片弹出居中 Modal 展示统计/关联/备注（替代原右侧面板）

**技术细节：**
- 新增 `user_profile` 表（key-value 模式）存储出生日期
- `life_events` 表新增 `start_precision` / `end_precision` 列
- 6 个新组件 + 2 个旧组件删除
- 侧边栏滚动修复（flex wrapper + flexShrink）

### V4.6.2 详细变更

**侧边栏重新设计：**
- 🗂️ **分组折叠**：15 项导航压缩为 4 组（核心/时间规划/学术/工具），默认展开前两组，"学术""工具"初始折叠
- 💊 **悬浮胶囊风格**：每项独立胶囊卡片（borderRadius 12px），项间距 3px，hover 淡蓝底
- 🎯 **Active 状态**：蓝色渐变填充 `#2563EB→#3B82F6` + 白色文字 + 发光 boxShadow（替代旧的全宽条状背景）
- ☀️🌙 **亮/暗双模式**：亮色侧边栏实色 `#F8FAFC`，暗色深底 `#0F172A`（替代原玻璃半透明），去 backdropFilter
- 📏 **分组标题**：UPPERCASE + CaretDown 展开指示器 + `::after` 分割线
- 🚀 **自动展开**：导航到折叠组中的页面时自动展开该组
- 🏷️ **甘特图**：侧边栏标签"时间线"→"甘特图"，与页面标题一致

- 侧边栏 CSS token 更新：`--bg-sidebar` 亮色 `#F8FAFC` / 暗色 `#0F172A`

### V4.7 详细变更

**旅行地图：**
- 🗺️ **ECharts Geo 中国地图**：基于 GeoJSON 的中国行政区划渲染，支持缩放/平移，审图号标注
- 📍 **城市标记**：已访问城市彩色标记 + 高亮星标，评分/日期 tooltip 悬浮
- 🏙️ **点击添加**：点击地图上任意城市区域 → 弹出添加对话框（自动填入城市名/省份/坐标）
- 📋 **右侧 Glass 面板**：可折叠城市列表（320px 宽），glass morphism（`backdrop-filter: blur()`），显示颜色圆点/评分/日期
- 📝 **城市详情页**：城市信息 + 旅行攻略 Markdown + 旅记 CRUD
- **新增数据库表**：`visited_cities`（14 列）+ `city_notes`（6 列，外键 CASCADE）

**技术细节：**
- 使用 ECharts `geo` 组件而非 Leaflet（无外部瓦片依赖，离线可用）
- `getChinaGeoJSON()` + `getCityList()` 工具函数从 TopoJSON 数据提取城市坐标
- `allCityMap` ref 存储所有 GeoJSON 城市名→坐标映射，用于点击识别未标记城市

### V4.8 详细变更

**出行清单：**
- 📋 **模板库**：8 个预置模板（短途/长途/出差/海边/滑雪/露营/出国/探亲），支持自定义模板
- 🗂️ **4 列网格**：清单列表 + 物品核对均为 4 列 CSS Grid，大屏一目了然
- ✅ **逐项核对**：checkbox 44px 触控区，勾选后保留原位变灰 + 删除线，动画过渡
- 📊 **进度条**：渐变色进度条（100% 变绿 + ✅），sticky 定位常驻顶部
- 🔄 **模板使用**：点击"使用"一键复制为清单，模板与清单完全隔离（`list_user_lists` / `list_templates` 独立命令）
- **新增数据库表**：`packing_lists`（8 列）+ `packing_items`（9 列，外键 CASCADE）
- **命令设计**：14 个 Tauri 命令（CRUD + toggle + reorder + resetAll + completeAll + duplicate）

**技术细节：**
- 模板播种按 ID 逐个检查（`seed_template()`），已存在的跳过，新模板自动追加
- Template/List 隔离通过两个独立 Rust 命令实现（避免 `Option<bool>` 序列化歧义）

### V4.9 详细变更

**物品管理：**
- 📦 **个人资产记录**：名称/分类/品牌/型号/购买日期/价格/数量/质保到期/状态/成色/备注
- 🗂️ **4 列卡片网格**：分类图标 + 名称 + 价格 + 购买日期 + 状态标签 + 质保倒计时
- 📊 **统计条**：总价值 + 物品总数
- 🔍 **筛选/搜索**：分类下拉 + 状态下拉 + 排序下拉 + 搜索框
- 🛡️ **质保跟踪**：有质保期的物品始终显示剩余倒计时（绿/黄/红/灰四色），已过期灰色
- 🔔 **质保提醒**：集成通知系统，每 24 小时检查一次，30 天内到期发送系统通知
- 📝 **详情页**：独立页面表单式展示，Modal 编辑

**新增数据库表：** `personal_assets`（14 列：name/category/purchase_date/price/currency/quantity/brand/model/warranty_expiry/status/condition/notes/created_at/updated_at）

**去掉的字段：** 存放位置（location）、照片（photo_path）、发票（receipt_path）、服饰鞋包分类

**预设分类（7 类）：** 电子数码、家居电器、书籍文具、娱乐休闲、工具设备、运动户外、其他

**技术细节：**
- 5 个状态（in_use/idle/sold/broken/lost）+ 4 个成色（new/good/fair/poor）
- 质保倒计时颜色规则：>90 天绿色，30-90 天黄色，<30 天红色，已过期灰色
- 7 个 Tauri 命令（create/update/delete/get/list/stats/get_expiring_warranties）
- 通知系统新增 `check_warranty_expiry()` 每 30 秒检查，同一日不重复发送

### V5.0.1 热修复

**问题修复：**
- 🐛 **双重点击修复**：去除 `main.tsx` 中 `React.StrictMode` 包裹——在 Tauri WebView2 + Ant Design 5.26 组合下，StrictMode 的双重渲染会导致事件处理器被注册两次
- 🎨 **按钮闪烁修复**：`.ant-btn:active` 移除 `filter: brightness(0.95)`——filter 属性在 WebView2 中创建新合成层，快速 mousedown/mouseup 切换时产生可见闪烁；同时将 `transition` 移至 `.ant-btn` 基类，保证按下和松开都有平滑过渡
- 🎨 **Modal 双重动画修复**：移除 `.ant-modal` 自定义 `@keyframes modalEnter/modalLeave`——会覆盖 Ant Design 5 内置 Modal 过渡系统导致双重播放
- 🎨 **全视口闪烁修复**：移除 `html { transition: background-color }`——全局过渡在 Modal 开关时触发整个视口闪烁
- 🎨 **Tabs 切换冲突修复**：移除 `.ant-tabs-content` 自定义 transition——与 Ant Design 5 内置标签切换动画冲突

**核心教训：** Ant Design 5.26 所有组件（Modal、Tabs、Message、Button）内部已有完整的 CSS transition 系统。自定义动画应使用 `transition` 叠加而非 `@keyframes` 覆盖。覆盖 = 内置动画 + 自定义动画同时播放 = 跳两次/闪一下。

### V5.0.2 热修复

**问题 1：未来日期 + 具体时间的任务在目标日期不显示**

- 🐛 **现象**：通过"快速新建"创建未来日期 + 具体时间的任务后，在日历周视图中该任务显示为"未分配时间"
- 🔍 **根因**：`PlanPage.tsx` 的 `handleQuickCreate` 在 `taskDate !== displayDate` 时跳过了 `addTaskToPlan`，导致未创建 `daily_plan_tasks` 关联记录。该日期的 `load_plan_tasks` 查不到任务，而任务库查询又过滤了 `WHERE scheduled_date IS NULL`，导致任务在两端都不显示
- ✅ **修复**：对于未来日期且有具体时间的任务，调用 `planService.getDailyPlan(taskDate)` 获取/创建目标日期的计划，再通过 `planService.addTaskToPlan()` 将任务关联到该计划
- 📄 **修改文件**：[PlanPage.tsx](todolist/src/pages/PlanPage.tsx#L108-L131) — `handleQuickCreate` 新增未来日期分支

**问题 2：任务库中未来任务状态显示为"进行中"**

- 🐛 **现象**：通过"快速新建"创建的未来日期任务，在任务库中状态显示为"进行中"而非"待开始"
- 🔍 **根因**：`TasksPage.tsx` 的 `calcAutoStatus` 只检查 `start_date` 和 `due_date`，忽略了 `scheduled_date`。快速新建的任务只设置 `scheduled_date`，函数一路落到默认的 `return 'in_progress'`
- ✅ **修复**：`calcAutoStatus` 新增 `scheduled_date` 参数，计算 `effectiveStart = start_date || scheduled_date`，若 `effectiveStart` 在未来则返回 `'pending'`。同时修复了 `handleSaveEdit` 调用处的类型
- 📄 **修改文件**：[TasksPage.tsx](todolist/src/pages/TasksPage.tsx#L42-L58) — `calcAutoStatus` 签名和逻辑

### V5.1 详细变更

**新增功能：**
- 💰 **记账模块**：完整的个人财务管理，支持日常记账和账户管理

**数据模型：**
| 表 | 说明 |
|----|------|
| `transaction_categories` | 12 个预设分类（学习/餐饮/购物/交通/娱乐/医疗/服务/转账/借款/红包/生活缴费/其他），含 icon/color |
| `accounts` | 账户管理（name/balance/is_savings/color），存款和日常双账户体系 |
| `transactions` | 交易记录（expense/income/transfer_out/transfer_in），date/amount/category/account/note，4 个索引 |

**功能特点：**
- 📊 **4 统计卡片**：本月支出、本月收入、存款总额、净资产
- 📅 **月度导航**：左右箭头切换月份，按日期分组展示交易记录
- 💳 **双账户体系**：存款账户（紫色高亮）+ 日常账户（如微信/支付宝/现金），左栏独立管理
- 🔄 **转账支持**：账户间转账自动创建配对记录，余额同步更新
- 🏷️ **12 个预设分类**：每类有专属图标和颜色，可视化区分
- 🔍 **多维度筛选**：关键词搜索 + 分类下拉 + 账户下拉
- 📈 **统计页面**（FinanceStatsPage）：月度收支柱状图（ECharts）+ 分类支出饼图 + 每日支出热力图 + 净资产趋势
- 📋 **账户管理页面**（FinanceAccountsPage）：独立管理全部账户的 CRUD
- ✏️ **编辑保护**：删除账户检查关联记录，编辑/删除交易自动回滚并重算余额

**前端文件：**
| 层级 | 文件 |
|------|------|
| Pages | `FinancePage.tsx`（主页面：统计卡+筛选+双栏）、`FinanceStatsPage.tsx`（ECharts 图表统计）、`FinanceAccountsPage.tsx`（账户管理） |
| Components | `RecordModal.tsx`（收支/转账弹窗）、`AccountModal.tsx`（账户创建/编辑弹窗）、`TransferModal.tsx`（转账弹窗）、`StatCard.tsx`（统计卡片） |
| Store | `financeStore.ts` — Zustand store（categories/accounts/transactions/stats/month nav） |
| Service | `financeService.ts` — invoke 封装（16 个 Tauri 命令） |
| Types | `finance.ts` — 完整 TS 类型（Transaction/Account/Category/Stats/Chart 数据） |

**后端文件：**
| 层级 | 文件 |
|------|------|
| Models | `finance.rs` — Rust 数据结构（TransactionCategory/Account/Transaction/FinanceStats + chart types） |
| Service | `finance_svc.rs` — 全 CRUD + 统计查询（月度汇总/年度趋势/分类饼图/每日热力图/净资产趋势） |
| Commands | `finance_cmd.rs` — 16 个 Tauri 命令（create/update/delete/list x 2 + stats + chart + heatmap + trend），注册于 `lib.rs` |

**数据库迁移：**
- v22: 创建 `transaction_categories` + `accounts` + `transactions` 表，插入 12 个预设分类
- 4 个索引：`idx_transactions_date` / `type` / `account` / `category`
- 转账逻辑：`transfer_out` 自动创建配对 `transfer_in` 记录，`transfer_id` 关联

**技术细节：**
- 交易创建：根据 type 自动增减账户余额（expense/transfer_out 减，income/transfer_in 加）
- 交易编辑：先回滚旧记录的余额变更，再应用新变更
- 交易删除：回滚余额 + 自动清理转账配对记录
- 统计页面使用 `echarts-for-react` + `ReactECharts` 组件

### V5.1.1 详细变更

**Obsidian 深度集成 V1 — 4 个特性：**

| # | 特性 | 说明 | 入口 |
|---|------|------|------|
| 1 | Daily Plan → Obsidian Daily Note | 一键导出每日计划为 Obsidian Daily Note（YAML frontmatter + checklist + task ID 嵌入） | PlanPage 📓 按钮 |
| 2 | 双向任务状态同步 | Archive 完成任务→自动勾选 Obsidian checklist；Obsidian 手动勾选→Archive 状态更新；时间戳仲裁（≥3s 新者胜，<3s Archive 优先） | PlanPage SyncStatus 徽章 |
| 3 | 知识图谱上下文 | 解析 vault 全量 `[[wikilinks]]`，BFS 2 层邻居，按 degree 推荐阅读 | PlanPage → 编辑弹窗 → 图谱标签页 |
| 4 | "想法→行动→沉淀"流水线 | 从 Obsidian 任意笔记捕获 `- [ ]` / `> TODO` → Archive 执行 → 完成后回写 | SettingsPage 捕获面板 |

**新增数据表（migration v23）：**
`task_obsidian_meta` / `vault_daily_notes` / `obsidian_sync_log` / `obsidian_todo_capture_log`

**新增 15 个文件：** Rust 4（models/knowledge_graph、services/knowledge_graph_svc、commands/knowledge_graph_cmd、models/obsidian_sync）+ TS 11（types/services/components）

### V5.2.0 详细变更

**Feature 5: Calendar 皮肤 — 批量同步 + 自动更新统计：**

| 功能 | 说明 |
|------|------|
| 批量同步到 Calendar | 遍历所有 `daily_plans` 日期，批量生成 Obsidian Daily Note，Calendar 插件自动显示圆点 |
| 任务完成自动更新 | 完成计划任务后 fire-and-forget 更新当日 Daily Note 的 `completion_rate` 和 checklist 状态 |

**新增函数：**
| 文件 | 函数 |
|------|------|
| `vault_svc.rs` | `generate_calendar_note()`（单日）、`sync_all_plans_to_calendar()`（批量，返回同步数）、`update_calendar_note_stats()`（fire-and-forget） |
| `vault_cmd.rs` | `generate_calendar_note`、`sync_all_plans_to_calendar`（2 个 Tauri 命令） |
| `plan_cmd.rs` | `complete_task_in_plan` 后异步触发 `update_calendar_note_stats` |

**前端：** SettingsPage 新增「同步到 Calendar」按钮（`CalendarOutlined`）

**关键设计：**
- 复用 Feature 1 的 `generate_and_write_daily_note`（markdown 生成 + 智能合并逻辑）
- 任务完成后的 stats 更新通过 `std::thread::spawn` 异步执行，不阻塞 UI
- 每次更新重建当日完整 Daily Note，确保 stats 始终准确

### V5.3.0 详细变更

**AI 对话面板 — 右侧滑出面板嵌入本地 Ollama 大模型对话：**

**新增数据库表 (migration v24)：**
| 表 | 说明 |
|----|------|
| `ai_chat_sessions` | 会话记录（title/model/created_at/updated_at） |
| `ai_chat_messages` | 消息记录（session_id FK CASCADE/role CHECK/ content/created_at），索引 `idx_chat_messages_session` |

**前端文件（7 个组件 + store + service + types）：**
| 组件 | 用途 |
|------|------|
| `ChatPanel.tsx` | 主面板：380px Glass morphism + translateX 滑入/滑出 + ToggleTab + Header(会话下拉/重命名/删除) + MessageList + OllamaWarning + InputArea |
| `ChatMessageBubble.tsx` | 消息气泡：user 蓝色渐变右对齐 + assistant 毛玻璃左对齐 + 内联 Markdown 渲染（无依赖） |
| `ChatInputArea.tsx` | 输入区：TextArea(autoSize) + SendButton(流式中→StopButton) + Enter发送/Shift+Enter换行 |
| `OllamaStatusBadge.tsx` | 连接指示器：检测中(黄色脉冲)/已连接(绿色+模型名)/离线(红色+重试) |
| `chatStore.ts` | Zustand store：sessions/messages/ollamaStatus/panelOpen/isStreaming + sendMessage(乐观更新+流式累积) |

**后端文件（3 个 Rust 模块）：**
| 文件 | 用途 |
|------|------|
| `models/chat.rs` | ChatSession, ChatMessage, OllamaModel, OllamaStatus 等 6 个 struct |
| `services/chat_svc.rs` | SQLite CRUD + Ollama HTTP（/api/tags 健康检查 + /api/chat 流式 NDJSON） |
| `commands/chat_cmd.rs` | 8 个 Tauri 命令（流式+非流式）；DB 操作提取为非 async 函数，避免 MutexGuard 跨 await |

**UI 集成：**
- 侧边栏底部新增聊天按钮（`MessageOutlined`），蓝色高亮表示已打开
- 键盘快捷键 `Ctrl+Shift+A` 切换面板
- 面板打开时内容区 `marginRight: 380px` 平滑过渡左移（不遮挡内容）

**关键设计：**
- **MutexGuard 不能跨 await**：DB 操作提取为独立非 async 函数（`save_user_and_load_history` / `save_assistant_and_touch`）
- **流式传输**：Tauri 2 `ipc::Channel<String>` 逐 token 推送，前端 Zustand 累积渲染
- **非流式 fallback**：流式返回空时自动重试 `stream: false`
- **Model**：自动检测 Ollama 可用模型，用户可自由切换

### V5.4.0 详细变更

**AI 工具调用（Agent）— ReAct 循环让 LLM 控制 Archive：**

CherryAgent 的 ReAct Agent 循环从 Python 移植到 Rust。LLM 通过 Ollama 原生 function calling 调用 Archive 的实际功能。

**架构：**
```
用户输入 → chatStore.sendMessage()
  → chat_svc::stream_chat_with_tools()
    ┌─ ReAct Loop (max 8 轮) ────────────────────────┐
    │ POST /api/chat { messages, tools, stream:false } │
    │ → tool_calls? → execute_tool() → 追加结果 → loop │
    │ → content?    → 流式输出 → 结束                   │
    └──────────────────────────────────────────────────┘
```

**10 个 AI 工具：**

| 工具 | 参数 | 说明 |
|------|------|------|
| `get_today_tasks` | — | 今日计划 + 待办一览 |
| `search_tasks` | query/date/status | 按关键词/日期/状态搜索任务 |
| **`create_task`** | **instruction**(必填) + title/date/time/priority/category/estimated_minutes(可选覆盖) | **NLP 正则解析 + LLM 覆盖合并** |
| `update_task` | task_id + status/priority | 更新任务状态/优先级 |
| `list_categories` | — | 列出任务分类 |
| `search_papers` | query/status | 搜索论文库 |
| `get_finance_summary` | year/month | 月度收支汇总 |
| `get_countdowns` | — | 活跃倒数日列表 |
| `get_travel_cities` | — | 已访问城市列表 |
| `get_stats` | — | 本周使用统计 |

**新增文件：**
| 文件 | 用途 |
|------|------|
| `src-tauri/src/utils/nlp.rs` | 中文自然语言任务解析器（从 TS 版移植+增强）：正则提取标题/日期/时间/优先级/重复/时长；新增 duration/月底/月初/中午/傍晚 等 TS 版未覆盖的模式 |
| `src-tauri/src/services/tool_svc.rs` | 工具定义（Ollama JSON Schema）+ 执行引擎（match 分发 10 handler）+ 结果截断（2000 字符） |
| `src/components/chat/ToolCallIndicator.tsx` | 工具执行状态横幅：蓝色 spinner + "正在搜索任务…" 文案 |

**修改文件：**
| 文件 | 变更 |
|------|------|
| `chat_svc.rs` | 更新 SYSTEM_PROMPT（删除"无法访问数据库"免责声明）+ 新增 `stream_chat_with_tools()` + `chat_with_tools_non_streaming()` |
| `chat_cmd.rs` | `stream_chat_message` 和 `send_message` 切换到 tool-calling；闭包捕获 `&Mutex<Database>` 传给 ReAct 循环 |
| `chatStore.ts` | + `toolCallStatus` 状态 + `__STATUS:` 协议检测 |
| `ChatPanel.tsx` | + ToolCallIndicator 渲染 |

**`create_task` 混合解析（核心创新）：**
- LLM 将用户原话作为 `instruction` 传入 → Rust 正则精确解析 → LLM 可选传覆盖值
- 合并策略：**LLM 显式值 > NLP 解析 > 默认值**
- 避免 7B 模型不稳定的结构化提取

**`__STATUS:` 协议：**
- Channel 发送 `__STATUS:正在搜索任务…` → 前端显示工具状态横幅
- `__STATUS:`（空后缀）→ 清除横幅

---

## 后续计划

> **V5.0 已完成：** 全局 UI 重构（Dual-Column Layout + Bento Grid + 20 页抛光）+ 12 项交互动画改进。以下为剩余规划。

### 多平台部署
| 平台 | 状态 |
|------|------|
| macOS | 规划中 |
| Linux | 规划中 |
| iOS / Android | 远期目标 |

### 功能扩展
| 功能 | 说明 |
|------|------|
| 协作共享 | 任务看板团队共享，实时同步 |
| 数据导出 | 多格式导出（PDF/CSV/JSON） |

---

## 项目结构

```
todolist/
├── src/                          # 前端 (React + TypeScript)
│   ├── pages/                    # 23 个页面组件
│   ├── components/               # 通用组件库
│   │   ├── layout/               # AppLayout (侧边栏 + 提醒系统)
│   │   ├── charts/               # ECharts 图表封装
│   │   ├── timeline/             # TimelineChart + TimelineTable
│   │   ├── life-event/           # VerticalTimeline, EventCard, TimelineNode, EventFormModal, EventDetailModal, BirthDateSetupModal
│   │   ├── travel/               # TravelMap, CityInfoCard, CityNoteEditor
│   │   ├── packing/              # PackingProgress, PackingItemRow, PackingCategoryGroup
│   │   ├── asset/                # AssetCard, AssetFormModal, AssetStatsBar
│   │   ├── finance/              # StatCard, RecordModal, AccountModal, TransferModal
│   │   ├── chat/                 # ChatPanel, ChatMessageBubble, ChatInputArea, OllamaStatusBadge, ToolCallIndicator
│   │   ├── plan/                 # 每日计划面板
│   │   ├── task/                 # 任务表单/复盘弹窗
│   │   ├── vault/                # Obsidian 回链面板
│   │   └── common/               # 全局搜索、标签选择、连线等
│   ├── stores/                   # Zustand 状态管理 (17 个 domain store)
│   ├── services/                 # Tauri invoke 封装 (19 个服务模块)
│   ├── types/                    # TypeScript 类型定义
│   ├── utils/                    # 工具函数 (农历/节假日/NLP/常量)
│   ├── hooks/                    # 自定义 Hooks
│   └── assets/styles/            # 主题配置 + 全局样式
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs                # 应用入口、托盘、命令注册
│   │   ├── db.rs                 # 数据库连接 + 迁移 (v1–v24)
│   │   ├── commands/             # 19 个 Tauri 命令模块
│   │   ├── services/             # 20 个 Rust 服务模块
│   │   ├── models/               # Rust 数据结构
│   │   └── utils/                # 日期/ID/NLP/解析工具
│   ├── migrations/               # SQL 迁移文件
│   └── Cargo.toml
└── package.json
```

---

## 架构模式

```
React Page → Zustand Store → Service (invoke) → Rust Command → Rust Service → SQLite
```

每个功能严格遵循 5 层调用链。页面不直接调用 invoke，命令不直接操作数据库。

---

## 关键设计

### 时间线自动进度与状态
- 进度 = `已过天数 / 总天数 × 100`，由日期范围自动计算
- 状态自动判定：未到开始日期 → `待开始`，在日期范围内 → `进行中`，超期保持 `进行中` 等待手动完成
- 手动设置的 `已完成`/`已取消`/`审核中`/`已暂停` 不受自动覆盖

### 时间线提醒
- 每 5 分钟检查：距开始 ≤1 天弹窗提醒，距截止 ≤2 天弹窗提醒（含当前进度）
- Modal 展示 + 系统通知 + "今天不再提醒" + "查看时间线" 快捷跳转

### 倒数日
- 支持正数（已过多少天）和倒数（还剩多少天），每年重复开关
- 15 个预设分类（生日/考试/纪念日/旅行/项目截止等）
- Dashboard 卡片网格展示近期事件

### 人生事件 V2

- **三列时间线**：容器 1080px，左/右列各 500px，中间虚线时间线 50px，卡片 192px 虚线连接
- **月份比例**：间距 = 月份差 × 6px（1 年 = 72px），空年份压缩为 14px
- **月份标记**：事件显示月份（如"9月"），年份标记显示年份（13px 600 字体），从出生年延伸到当前年
- **单日事件**：不设结束日期自动 `end_date = start_date`，卡片只显示单日期
- **出生日期**：首次弹窗设置存入 `user_profile` 表，页顶常驻「🎂 出生于 XXXX年X月X日 · N年」

### 日历农历
- 基于 `lunar-typescript`，覆盖 1900–2100 年
- 农历日期 + 节气 + 中国节假日 + 调休标记
- 节日颜色区分（春节红/清明绿/中秋金等）

---

## 数据库迁移

| 版本 | 功能 |
|------|------|
| v1 | 初始 Schema（任务/分类/计划/知识库） |
| v2–v3 | 时间线、复盘、运动 |
| v4 | 课程 + 作业 |
| v5 | 通知/番茄钟/周报 |
| v6 | 项目管理/看板/任务日期范围 |
| v7–v8 | 甘特图/标签/论文/实验/OKR |
| v9–v10 | Obsidian Vault / 清理旧表 |
| v11–v14 | 时间线颜色/统一任务表/清理甘特图 |
| v15 | 应用使用会话（热力图） |
| v16 | 倒数日事件表 |
| v17 | 人生事件 V1（life_events + life_event_links） |
| v18 | 人生事件 V2（user_profile + 日期精度列） |
| v19 | 旅行地图（visited_cities + city_notes） |
| v20 | 出行清单（packing_lists + packing_items + 8 个预设模板） |
| v21 | 物品管理（personal_assets） |
| v22 | 记账模块（transaction_categories + accounts + transactions） |
| v23 | Obsidian 深度集成 V1（task_obsidian_meta + vault_daily_notes + obsidian_sync_log + obsidian_todo_capture_log） |
| v24 | AI 对话面板（ai_chat_sessions + ai_chat_messages） |
