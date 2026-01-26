# OneTabs 未完成需求清单

> 更新日期：2025-01-26
> 
> 本文档汇总了 v2 和 v3 模块中所有未完成的需求，按优先级和模块分类。

---

## 目录

- [V2 模块 - 标签页/会话/收藏集/模板](#v2-模块---标签页会话收藏集模板)
  - [P2 - 优化功能](#v2-p2---优化功能)
  - [P3 - 未来功能](#v2-p3---未来功能)
- [V3 模块 - 书签管理](#v3-模块---书签管理)
  - [P0 - 技术债务](#v3-p0---技术债务)
  - [P2 - 高级功能](#v3-p2---高级功能)
  - [P3 - 增强功能](#v3-p3---增强功能)

---

## V2 模块 - 标签页/会话/收藏集/模板

### V2 P2 - 优化功能

#### 拖拽功能增强

- [ ] 批量拖拽 - Ctrl 多选
  - [ ] 按住 Ctrl 点击卡片添加到选中集合
  - [ ] 拖拽时移动所有选中项
- [ ] 批量拖拽 - Shift 范围选择
  - [ ] 按住 Shift 选择范围内的所有卡片
- [ ] 会话 → 模板拖拽
  - [ ] 拖拽会话到模板区域创建新模板
- [ ] 收藏集 → 模板拖拽（引用模式）
  - [ ] 创建引用而非复制
- [ ] 跨区域拖拽
  - [ ] 支持在不同视图区域间拖拽
- [ ] 拖拽撤销功能
  - [ ] 提供 Ctrl+Z 撤销拖拽操作
- [ ] 拖拽节流优化
  - [ ] 使用 requestAnimationFrame 或 16ms 节流
  - [ ] 减少拖拽过程中的重渲染

#### 性能优化

- [ ] 虚拟滚动（50+ 项目）
  - [ ] 使用 PrimeVue VirtualScroller
  - [ ] 优化大列表渲染性能
- [ ] Favicon 缓存机制
  - [ ] 本地缓存网站图标
  - [ ] 避免重复请求相同域名图标
  - [ ] 定期清理过期缓存

#### 无障碍支持

- [ ] 键盘无障碍
  - [ ] Tab 键导航支持
  - [ ] Enter 确认操作
  - [ ] Esc 取消/关闭
- [ ] ARIA 标签完善
  - [ ] 添加 aria-label 属性
  - [ ] 添加 role 属性
  - [ ] 屏幕阅读器支持

#### 其他

- [ ] 导入覆盖模式
  - [ ] 支持完全覆盖现有数据的导入策略

---

### V2 P3 - 未来功能

#### 主题定制

- [ ] 自定义主题编辑器
  - [ ] 主色调选择
  - [ ] 背景色调整
  - [ ] 文字色调整
- [ ] 预设主题包
  - [ ] 经典蓝
  - [ ] 科技紫
  - [ ] 清新绿
  - [ ] 暗夜黑
- [ ] 主题导入/导出

#### 云端同步

- [ ] chrome.storage.sync 集成
  - [ ] 同步设置项
  - [ ] 同步选定的数据
- [ ] WebDAV 支持（可选）
  - [ ] 自定义云存储服务
- [ ] 同步冲突处理
  - [ ] 最新优先策略
  - [ ] 手动选择策略
- [ ] 同步状态显示
  - [ ] 同步时间
  - [ ] 同步状态

#### AI 智能分组

- [ ] 智能标签页分组建议
  - [ ] 基于域名分组
  - [ ] 基于内容分析分组
- [ ] 自动分类建议

#### 数据统计

- [ ] 使用分析
  - [ ] 标签页使用频率
  - [ ] 会话保存统计
- [ ] 图表展示
  - [ ] 使用趋势图
  - [ ] 分类分布图

#### 商业化功能

- [ ] 高级功能规划
- [ ] 付费方案设计

---

## V3 模块 - 书签管理

### V3 P0 - 技术债务

#### 类型和验证

- [ ] TypeScript 类型定义
  - [ ] 书签接口定义
  - [ ] 分类接口定义
  - [ ] Store 类型定义
- [ ] 数据验证函数完善
  - [ ] URL 格式验证
  - [ ] 必填字段验证
  - [ ] 数据完整性检查
- [ ] ESLint 规则配置
  - [ ] 书签模块特定规则

#### 测试

- [ ] 单元测试
  - [ ] bookmarksStore actions 测试
  - [ ] bookmarksStore getters 测试
  - [ ] bookmarkImporter 测试
  - [ ] urlValidator 测试

---

### V3 P2 - 高级功能

#### 收藏功能完善

- [ ] FavoriteBookmarksSection 组件
  - [ ] 收藏区域 UI
  - [ ] 标题栏："⭐ 收藏的书签 (N)"
  - [ ] 展开/收起按钮
  - [ ] 书签网格展示
  - [ ] "查看全部收藏" 按钮
- [ ] 收藏拖拽排序
  - [ ] 使用 Sortable.js 或原生拖拽
  - [ ] 拖拽时显示占位符
  - [ ] `reorderFavoriteBookmarks()` action
- [ ] BookmarkCard 收藏按钮
  - [ ] 未收藏：空心星标
  - [ ] 已收藏：实心星标
  - [ ] 点击切换 + Toast 通知
- [ ] 收藏设置项
  - [ ] `showFavoriteSection` - 是否显示
  - [ ] `favoriteDefaultExpanded` - 默认展开
  - [ ] `favoriteMaxDisplay` - 最大显示数量
  - [ ] `favoriteViewMode` - 展示模式

#### 批量操作功能

- [ ] 多选模式
  - [ ] "批量管理" 按钮
  - [ ] 已选择数量显示
  - [ ] "全选" 按钮
  - [ ] "取消" 按钮
- [ ] BookmarkCard 多选状态
  - [ ] 左上角复选框
  - [ ] 选中时卡片高亮
- [ ] 批量操作栏
  - [ ] 底部固定操作栏
  - [ ] "批量删除" 按钮
  - [ ] "批量移动" 按钮
  - [ ] "批量添加到收藏集" 按钮
  - [ ] "批量收藏" 按钮
- [ ] 批量操作 actions
  - [ ] `batchDeleteBookmarks(bookmarkIds)`
  - [ ] `batchMoveBookmarks(bookmarkIds, targetCategoryPath)`
  - [ ] `batchFavoriteBookmarks(bookmarkIds)`
- [ ] CategorySelector 组件
  - [ ] 级联选择器 UI
  - [ ] 显示三级分类树

#### 浏览器书签同步

- [ ] bookmarkSyncManager 工具
  - [ ] `fetchBrowserBookmarks()` - 获取浏览器书签
  - [ ] `syncToBrowser(mode, options)` - 同步到浏览器
  - [ ] `compareBrowserBookmarks()` - 对比差异
  - [ ] `convertPluginFormatToBrowserTree()` - 格式转换
- [ ] BrowserSyncDialog 组件
  - [ ] "从浏览器获取" 功能
  - [ ] "同步到浏览器" 功能
  - [ ] 同步模式选择（完全覆盖/增量同步）
  - [ ] 进度条和结果报告
- [ ] bookmarksStore 同步 actions
  - [ ] `fetchBrowserBookmarks(options)`
  - [ ] `syncToBrowser(mode, options)`
  - [ ] `compareBrowserBookmarks()`
  - [ ] 同步状态管理
- [ ] 自动同步（可选）
  - [ ] `enableBrowserSync` 设置
  - [ ] `autoSyncInterval` 设置
  - [ ] `syncOnBookmarkChange` 设置

#### 高级过滤功能

- [ ] FilterPanel 组件
  - [ ] 按标签过滤（MultiSelect）
  - [ ] 按来源过滤（Dropdown）
  - [ ] 按日期范围过滤（DatePicker）
  - [ ] 按访问次数排序
  - [ ] 重置按钮
- [ ] bookmarksStore 过滤 getters
  - [ ] `getBookmarksByTag(tag)`
  - [ ] `getBookmarksBySource(source)`
  - [ ] `getBookmarksByDateRange(startDate, endDate)`
  - [ ] `sortBookmarksByVisitCount()`

#### 数据导出功能

- [ ] 导出为 JSON
  - [ ] `exportToJson(filename)` action
  - [ ] 包含元数据（版本、导出时间）
- [ ] 导出为 HTML（Chrome 书签格式）
  - [ ] `exportToHtml(filename)` action
  - [ ] 可直接导入 Chrome 浏览器

#### 设置页面扩展

- [ ] 书签设置选项卡
  - [ ] 书签默认视图：网格/列表
  - [ ] 固定栏最大显示数量
  - [ ] 书签图标获取方式
  - [ ] 是否显示书签描述
  - [ ] 是否显示访问次数
  - [ ] 新建书签默认分类
  - [ ] 书签排序方式
- [ ] 浏览器同步设置
  - [ ] 启用浏览器同步
  - [ ] 自动同步间隔
  - [ ] 同步方向
  - [ ] 冲突解决策略

#### 数据统计

- [ ] 书签统计信息
  - [ ] 书签总数
  - [ ] 分类总数（一/二/三级）
  - [ ] 固定书签数
  - [ ] 收藏书签数
  - [ ] 存储空间使用情况
- [ ] 数据完整性检查
  - [ ] 检查无效 URL
  - [ ] 检查损坏的数据结构
  - [ ] 提供修复工具

#### 性能优化

- [ ] 虚拟滚动（书签 > 100）
  - [ ] 使用 PrimeVue VirtualScroller
- [ ] 图标缓存
  - [ ] favIconUrl 缓存策略
  - [ ] 定期清理过期缓存
- [ ] 搜索优化
  - [ ] 搜索结果缓存
  - [ ] 防抖优化
  - [ ] 索引优化（Lunr.js）

---

### V3 P3 - 增强功能

#### 跨系统数据转换

- [ ] 书签 → 收藏集转换
  - [ ] `createCollectionFromBookmarks(bookmarkIds)` action
  - [ ] 书签右键菜单 "添加到收藏集"
  - [ ] 批量转换支持
- [ ] 书签分类 → 收藏集转换
  - [ ] 分类右键菜单 "转换为收藏集"
  - [ ] `createCollectionFromCategory(categoryId)` action
- [ ] 书签 → 模板转换
  - [ ] `createTemplateFromBookmarks(bookmarkIds, templateName)` action
  - [ ] 书签右键菜单 "创建为模板"
  - [ ] `createTemplateFromCategory(categoryId)` action
- [ ] 会话/收藏集/模板 → 书签转换
  - [ ] `createCategoryFromSession(sessionId)` action
  - [ ] `createCategoryFromCollection(collectionId)` action
  - [ ] `createCategoryFromTemplate(templateId)` action
  - [ ] 右键菜单 "保存为书签"
- [ ] ConvertDialog 组件
  - [ ] 统一的转换对话框
  - [ ] 转换选项配置
  - [ ] 转换预览

#### 智能功能

- [ ] 书签智能推荐
  - [ ] `getFrequentBookmarks(limit)` - 最常访问
  - [ ] `getRecommendedByFavorites()` - 相似推荐
  - [ ] "为你推荐" 板块
- [ ] 重复书签检测
  - [ ] `detectDuplicateBookmarks()` - 按 URL 检测
  - [ ] 显示重复书签列表
  - [ ] 合并或删除选项
- [ ] 失效链接检测
  - [ ] `detectBrokenLinks()` - HEAD 请求检测
  - [ ] 失效链接列表
  - [ ] 删除或更新 URL 选项
  - [ ] Web Worker 后台检测
- [ ] 自动标签建议
  - [ ] `suggestTags(url, name)` - 基于 URL/名称建议
  - [ ] 显示建议标签
  - [ ] 点击快速添加

#### 标签系统增强

- [ ] TagManager 组件
  - [ ] 标签云展示
  - [ ] 标签大小按使用频率
  - [ ] 点击标签筛选
- [ ] 标签 CRUD
  - [ ] 添加新标签
  - [ ] 重命名标签（批量更新）
  - [ ] 删除标签
  - [ ] 合并标签
- [ ] 标签颜色
  - [ ] 为标签设置颜色
  - [ ] 彩色标签显示
- [ ] bookmarksStore 标签功能
  - [ ] `getAllTags()` getter
  - [ ] `renameTag(oldTag, newTag)` action
  - [ ] `deleteTag(tag)` action
  - [ ] `mergeTags(sourceTags, targetTag)` action

#### 快捷键系统

- [ ] 书签相关快捷键
  - [ ] `Ctrl/Cmd + B` - 聚焦书签搜索框
  - [ ] `Ctrl/Cmd + N` - 添加新书签
  - [ ] `Ctrl/Cmd + Shift + N` - 添加新分类
  - [ ] `Ctrl/Cmd + Shift + I` - 打开导入对话框
  - [ ] `Ctrl/Cmd + Shift + B` - 同步到浏览器
  - [ ] `Ctrl/Cmd + Shift + F` - 打开收藏区域
  - [ ] `Ctrl/Cmd + Shift + M` - 进入批量管理模式
  - [ ] `Esc` - 退出多选模式/关闭对话框
- [ ] 快捷键提示
  - [ ] 按钮 Tooltip 显示快捷键
  - [ ] Settings 中显示快捷键列表
- [ ] ShortcutsHelp 组件扩展
  - [ ] 添加书签快捷键说明
  - [ ] `?` 键打开帮助

#### 拖拽增强

- [ ] 书签拖拽排序
  - [ ] 使用 Sortable.js
  - [ ] 拖拽书签卡片调整顺序
  - [ ] 跨分类拖拽
  - [ ] `reorderBookmarks(categoryPath, newOrder)` action
- [ ] 分类拖拽排序
  - [ ] 一级分类标签拖拽
  - [ ] 二/三级分类侧边栏拖拽
  - [ ] 跨层级拖拽（可选）

#### 数据可视化

- [ ] 统计图表
  - [ ] 安装 Chart.js 或 ECharts
  - [ ] 书签数量趋势图
  - [ ] 分类分布饼图
  - [ ] 访问频率柱状图
  - [ ] 标签使用热力图
- [ ] 使用习惯分析
  - [ ] `analyzeUsagePatterns()` - 分析使用习惯
  - [ ] 分析报告展示
  - [ ] 优化建议

#### 导入导出增强

- [ ] 多格式导出
  - [ ] 导出为 Markdown
  - [ ] 导出为 CSV
- [ ] 多格式导入
  - [ ] Pocket JSON 格式
  - [ ] Raindrop.io CSV 格式
  - [ ] Firefox 书签 HTML
- [ ] 导入映射配置
  - [ ] 字段映射配置界面
  - [ ] 预览导入数据

#### 主题和 UI 增强

- [ ] 自定义主题
  - [ ] 主题编辑器
  - [ ] 颜色方案编辑
  - [ ] 预设主题包
  - [ ] 导入/导出主题配置
- [ ] 布局自定义
  - [ ] 书签卡片大小
  - [ ] 书签卡片间距
  - [ ] 侧边栏宽度
  - [ ] 固定栏位置
- [ ] 字体设置
  - [ ] 字体大小调整
  - [ ] 字体家族选择
- [ ] 动画效果
  - [ ] 页面切换动画
  - [ ] 卡片进入/退出动画
  - [ ] 禁用动画选项（性能模式）

#### 社交和分享功能

- [ ] shareManager 工具
  - [ ] `generateShareLink(categoryId)` - 生成分享链接
  - [ ] QRCode.js 生成二维码
  - [ ] 导出为 HTML 网页
- [ ] ShareDialog 组件
  - [ ] 分享选项界面
  - [ ] 复制到剪贴板

#### 云端同步

- [ ] chrome.storage.sync 集成
  - [ ] 云同步开关
  - [ ] 选择同步内容
  - [ ] 冲突处理
  - [ ] 同步状态显示
- [ ] 自定义云端存储（高级）
  - [ ] Google Drive / Dropbox 支持
  - [ ] OAuth 认证
  - [ ] 数据加密

#### 多语言支持

- [ ] vue-i18n 集成
- [ ] 语言文件
  - [ ] `zh-CN.json` - 简体中文
  - [ ] `en-US.json` - 英文
  - [ ] `ja-JP.json` - 日文（可选）
- [ ] 翻译所有 UI 文本
- [ ] Settings 中语言切换

#### 无障碍支持

- [ ] 键盘导航
  - [ ] 所有功能可键盘操作
  - [ ] Tab 键导航顺序合理
  - [ ] 焦点可见
- [ ] 屏幕阅读器支持
  - [ ] ARIA 属性完善
  - [ ] 语义化 HTML
  - [ ] 图片 alt 属性
- [ ] 对比度优化
  - [ ] WCAG AA 标准
  - [ ] 高对比度主题选项

#### 性能监控和错误追踪

- [ ] 性能监控
  - [ ] 页面加载时间
  - [ ] 书签数据加载时间
  - [ ] 搜索响应时间
  - [ ] 内存使用情况
- [ ] 错误追踪
  - [ ] Sentry 集成（可选）
  - [ ] 未处理错误捕获
  - [ ] 错误日志显示

#### 测试完善

- [ ] 单元测试
  - [ ] Vitest 配置
  - [ ] Store 测试覆盖率 > 80%
  - [ ] 工具函数测试覆盖率 > 90%
- [ ] 端到端测试（可选）
  - [ ] Playwright / Cypress
  - [ ] 关键流程测试

#### 文档完善

- [ ] 用户文档
  - [ ] 快速入门指南
  - [ ] 功能详细说明
  - [ ] 常见问题解答
  - [ ] 快捷键列表
- [ ] 开发文档
  - [ ] 完善代码注释
  - [ ] API 文档
  - [ ] 贡献指南
  - [ ] 架构设计文档

---

## 统计汇总

| 模块 | 优先级 | 未完成项数 |
|------|--------|------------|
| V2 | P2 | ~15 项 |
| V2 | P3 | ~20 项 |
| V3 | P0 | ~8 项 |
| V3 | P2 | ~50 项 |
| V3 | P3 | ~80 项 |
| **总计** | | **~173 项** |

---

*本文档根据 docs/v2 和 docs/v3 目录下的 P*.md 文件整理，如需查看详细说明请参考原始文档。*
