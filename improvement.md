Role: 你是一位顶尖的前端 UI/UX 工程师，精通 React/Next.js 和 Tailwind CSS，擅长打造媲美原生 App 体验的 WebApp。

Task: 请优化我的记账 WebApp 的 ，重点在于提升手机端的单手操作效率和视觉信息密度。

Transaction Page Optimization Requirements:

顶部筛选区重构：

目前筛选占位过大。请将其改造为：默认只显示 Month 选择器。

将 Type, Category, Sub-category 整合进一个“筛选”按钮，点击后触发一个 Bottom Sheet (底部抽屉) 进行选择。

实现“滚动收起”逻辑：当用户向上滑动列表时，顶部筛选区自动折叠/缩小，腾出更多空间展示数据。

列表视图 (Transaction List) 升级：

日期分组： 移除每行账单里的日期，改为按天分组（Date Headers），例如“Today”、“April 7, 2026”。

信息瘦身： 每行账单保持在 2-3 行内容。主标题突出 Category，副标题合并显示 Sub-category 和 Account（用中间点分隔）。

金额强化： 增大金额字号并加粗，确保红/绿颜色在深/浅色模式下均有良好的对比度。

原生化交互：

手势操作： 为每一行账单添加 framer-motion 驱动的左滑手势，滑开后显示“删除”和“编辑”操作，移除原本露在表面的铅笔图标。

触控优化： 确保底部 Tab Bar 和右上角 + 按钮有明确的点击态反馈。

视觉细节：

为右下角悬浮按钮 (FAB) 添加轻微的 shadow-lg 阴影。

优化整体间距，利用 Tailwind 的 space-y 让列表更具呼吸感。

Deliverables:
请直接提供修改后的核心组件代码，并说明需要安装的依赖（如 framer-motion 或 lucide-react）。

Dashboard Page Optimization Requirements:

首屏 KPI 卡片布局优化：

目前 4 个指标卡片占据空间较多。请改为更紧凑的 2x2 网格布局。

强化“结余 (Net Savings)”视觉权重，使其在卡片组中更突出（例如背景色略深或字号加大）。

优化百分比趋势箭头：向上/向下箭头的颜色应符合财务直觉（如支出增加应为红色预警）。

图表交互与展示 (Chart.js / Recharts)：

累积支出图 (Cumulative Expenses)： 这是一个趋势图，请确保它支持手势长按 (Tooltips)。在手机上点击某个点时，显示具体日期和金额。目前点击某个点时，filter功能会使当前月份的line变成为0的直线，请修改优化。

柱状图优化 (Breakdowns)： 现在的柱状图（Category/Merchant）在手机上看起来很长。请限制默认显示的条目数（如只显示 Top 5），并提供一个“Show More”展开按钮，避免页面无限拉长。

信息层级与留白：

页面底部的 Transactions 列表在 Dashboard 中显得冗余。请将其简化为仅显示 “最近 10 笔 (Recent Transactions)”，其余翻页展示。

统一卡片的圆角 (Border Radius) 和阴影，使其更具一致性。

性能与动效：

使用 framer-motion 为进入 Dashboard 时的卡片和图表添加交错入场动画 (Staggered Fade-in)，提升 App 的高级感。

优化滚动体验，确保大型图表在快速滑动时不会造成卡顿。