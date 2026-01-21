# OneTabs 书签管理系统 - 开发路线图

**项目**: OneTabs Chrome扩展 - 书签管理系统  
**开发模式**: 分阶段迭代开发  
**文档版本**: 1.0.0  
**最后更新**: 2026年1月21日

---

## 📋 开发阶段概览

| 阶段 | 优先级 | 目标 | 预计周期 | 状态 |
|------|--------|------|----------|------|
| **P0** | 最高 | 核心数据层和基础框架 | 1周 | ⏳ 待开始 |
| **P1** | 高 | 核心UI组件和交互 | 1-2周 | ⏳ 待开始 |
| **P2** | 中 | 高级功能和增强 | 2-3周 | ⏳ 待开始 |
| **P3** | 低 | 扩展功能和优化 | 按需迭代 | ⏳ 待规划 |

---

## 🎯 P0 - 核心基础功能（最高优先级）

**开发周期**: 1周  
**前置依赖**: 无

### 关键里程碑
- [ ] bookmarksStore 完整实现
- [ ] 数据持久化机制建立
- [ ] 三级分类CRUD功能完成
- [ ] 书签CRUD功能完成
- [ ] 固定书签功能完成

### 详细任务

#### 1. 数据层实现
- [ ] **bookmarksStore 状态管理**
  - [ ] 创建 `src/stores/bookmarksStore.js`
  - [ ] 定义核心 state（bookmarks、pinnedBookmarks、favoriteBookmarks等）
  - [ ] 实现基础 getters（分类、书签查询）
  - [ ] 数据持久化（loadBookmarks、saveBookmarks）

- [ ] **核心CRUD Actions**
  - [ ] 分类操作（添加、更新、删除三个层级）
  - [ ] 书签操作（添加、更新、删除）
  - [ ] 固定书签操作（固定、取消固定）

#### 2. 工具函数
- [ ] **URL工具** (`src/utils/urlValidator.js`)
  - [ ] URL验证和格式化
  - [ ] 域名提取
  - [ ] Favicon URL生成

#### 3. 路由配置
- [ ] 添加 `/bookmarks` 路由
- [ ] 配置路由元信息

#### 4. 数据验证和错误处理
- [ ] 数据格式验证函数
- [ ] 错误日志集成

---

## 🎨 P1 - 核心UI组件（高优先级）

**开发周期**: 1-2周  
**前置依赖**: P0完成

### 关键里程碑
- [ ] BookmarksView 主页面完成
- [ ] 固定书签栏实现
- [ ] 书签卡片组件完成
- [ ] 分类管理UI完成
- [ ] 编辑对话框实现

### 详细任务

#### 1. 主视图页面
- [ ] **BookmarksView** (`src/views/BookmarksView.vue`)
  - [ ] 整体布局实现（固定栏、分类导航、书签展示区）
  - [ ] 导航状态管理（一级/二级/三级切换）
  - [ ] 响应式设计

#### 2. 固定书签栏
- [ ] **PinnedBookmarksBar** (`src/components/PinnedBookmarksBar.vue`)
  - [ ] 横向滚动书签栏
  - [ ] 拖拽排序功能
  - [ ] 右键菜单集成

#### 3. 书签卡片
- [ ] **BookmarkCard** (`src/components/BookmarkCard.vue`)
  - [ ] 卡片UI设计（图标、名称、描述、标签）
  - [ ] 状态显示（固定、收藏）
  - [ ] 交互功能（点击打开、右键菜单）
  - [ ] 动画效果

#### 4. 分类管理
- [ ] **CategoryTabs** (`src/components/CategoryTabs.vue`) - 一级分类标签栏
- [ ] **CategorySidebar** (`src/components/CategorySidebar.vue`) - 二级/三级分类侧边栏
- [ ] **CategoryDialog** (`src/components/CategoryDialog.vue`) - 分类编辑对话框

#### 5. 书签编辑
- [ ] **BookmarkDialog** (`src/components/BookmarkDialog.vue`)
  - [ ] 表单实现（名称、URL、描述、标签）
  - [ ] URL验证
  - [ ] 图标预览

#### 6. 通用组件
- [ ] 空状态组件
- [ ] Toast通知集成
- [ ] 确认对话框集成
- [ ] 加载状态处理

#### 7. 右键菜单
- [ ] 扩展 `src/utils/contextMenus.js`
- [ ] 书签右键菜单
- [ ] 分类右键菜单

#### 8. 主题和样式
- [ ] CSS变量适配
- [ ] 亮色/暗色主题支持
- [ ] 响应式布局

---

## 🚀 P2 - 高级功能（中优先级）

**开发周期**: 2-3周  
**前置依赖**: P0 + P1完成

### 关键里程碑
- [ ] Chrome书签导入完成
- [ ] 全局搜索实现
- [ ] 书签收藏功能完成
- [ ] 批量操作实现
- [ ] 浏览器书签同步完成

### 详细任务

#### 1. Chrome书签导入
- [ ] **bookmarkImporter工具** (`src/utils/bookmarkImporter.js`)
  - [ ] HTML文件解析（parseGoogleBookmarks）
  - [ ] chrome.bookmarks API集成
  - [ ] 数据格式转换

- [ ] **ImportBookmarks组件** (`src/components/ImportBookmarks.vue`)
  - [ ] 导入对话框UI
  - [ ] 文件选择和上传
  - [ ] 导入模式选择（合并/替换）
  - [ ] 进度显示和结果报告

- [ ] **bookmarksStore导入actions**
  - [ ] importFromChromeHtml
  - [ ] importFromChromeApi
  - [ ] mergeBookmarks

- [ ] **manifest.json权限**
  - [ ] 添加 bookmarks 权限

#### 2. 书签搜索
- [ ] **SearchBar组件** (`src/components/SearchBar.vue`)
  - [ ] 搜索框UI
  - [ ] 实时搜索（防抖）
  - [ ] 快捷键支持（Ctrl+F）

- [ ] **searchBookmarks getter**
  - [ ] 全文搜索逻辑
  - [ ] 多字段搜索（名称、URL、描述、标签）

- [ ] **搜索结果展示**
  - [ ] 搜索结果视图
  - [ ] 关键词高亮
  - [ ] 无结果提示

#### 3. 书签收藏
- [ ] **收藏状态管理**
  - [ ] favoriteBookmark action
  - [ ] unfavoriteBookmark action
  - [ ] reorderFavoriteBookmarks action

- [ ] **FavoriteBookmarksSection组件** (`src/components/FavoriteBookmarksSection.vue`)
  - [ ] 收藏区域UI
  - [ ] 折叠/展开功能
  - [ ] 拖拽排序

- [ ] **BookmarkCard收藏功能**
  - [ ] 收藏按钮（⭐图标）
  - [ ] 右键菜单收藏选项

- [ ] **设置项**
  - [ ] 收藏相关设置（显示、展开、数量限制等）

#### 4. 批量操作
- [ ] **多选模式**
  - [ ] 工具栏（批量管理按钮）
  - [ ] 复选框显示
  - [ ] 选中状态管理

- [ ] **批量操作actions**
  - [ ] batchDeleteBookmarks
  - [ ] batchMoveBookmarks
  - [ ] batchFavoriteBookmarks

- [ ] **CategorySelector组件** (`src/components/CategorySelector.vue`)
  - [ ] 级联选择器
  - [ ] 在批量移动时使用

#### 5. 浏览器书签同步
- [ ] **bookmarkSyncManager工具** (`src/utils/bookmarkSyncManager.js`)
  - [ ] fetchBrowserBookmarks（获取浏览器书签）
  - [ ] syncToBrowser（同步到浏览器）
  - [ ] compareBrowserBookmarks（对比差异）
  - [ ] 格式转换函数

- [ ] **BrowserSyncDialog组件** (`src/components/BrowserSyncDialog.vue`)
  - [ ] "从浏览器获取"功能UI
  - [ ] "同步到浏览器"功能UI
  - [ ] 进度显示和结果报告

- [ ] **bookmarksStore同步actions**
  - [ ] fetchBrowserBookmarks
  - [ ] syncToBrowser
  - [ ] compareBrowserBookmarks
  - [ ] 同步状态管理

- [ ] **自动同步（可选）**
  - [ ] 定时同步任务
  - [ ] 监听浏览器书签变化
  - [ ] 双向同步支持

#### 6. 高级过滤
- [ ] **FilterPanel组件** (`src/components/FilterPanel.vue`)
  - [ ] 按标签过滤
  - [ ] 按来源过滤
  - [ ] 按日期范围过滤
  - [ ] 按访问次数排序

- [ ] **bookmarksStore过滤getters**
  - [ ] getBookmarksByTag
  - [ ] getBookmarksBySource
  - [ ] getBookmarksByDateRange
  - [ ] sortBookmarksByVisitCount

#### 7. 数据导出
- [ ] 导出为JSON
- [ ] 导出为HTML（可选）
- [ ] dataExporter工具扩展

#### 8. 设置页面扩展
- [ ] **书签设置项**
  - [ ] 视图设置
  - [ ] 图标设置
  - [ ] 显示设置
  - [ ] 默认设置
  - [ ] 浏览器同步设置

- [ ] **settingsStore扩展**
  - [ ] 添加所有书签相关设置字段
  - [ ] 默认值配置

#### 9. 数据统计
- [ ] 书签统计信息
- [ ] 数据完整性检查

#### 10. 性能优化
- [ ] 虚拟滚动（大量书签时）
- [ ] 图标缓存
- [ ] 搜索优化

---

## ⭐ P3 - 增强功能（低优先级）

**开发周期**: 按需迭代  
**前置依赖**: P0 + P1 + P2完成

### 功能模块

#### 1. 跨系统数据转换
- [ ] 书签 → 收藏集转换
- [ ] 书签分类 → 收藏集转换
- [ ] 书签 → 模板转换
- [ ] 会话/收藏集/模板 → 书签转换
- [ ] ConvertDialog组件

#### 2. 智能功能
- [ ] 书签智能推荐（基于访问频率和收藏）
- [ ] 重复书签检测和合并
- [ ] 失效链接检测和清理
- [ ] 自动标签建议

#### 3. 标签系统增强
- [ ] TagManager组件（标签云、CRUD）
- [ ] 标签颜色
- [ ] 标签管理actions

#### 4. 快捷键系统
- [ ] 注册书签相关快捷键
- [ ] 快捷键帮助界面

#### 5. 拖拽增强
- [ ] 书签拖拽排序
- [ ] 分类拖拽排序
- [ ] 跨层级拖拽

#### 6. 数据可视化
- [ ] 统计图表（Chart.js/ECharts）
- [ ] 使用习惯分析

#### 7. 导入导出增强
- [ ] 多格式导出（HTML、Markdown、CSV）
- [ ] 支持从其他书签工具导入

#### 8. 主题和UI增强
- [ ] 自定义主题编辑器
- [ ] 布局自定义
- [ ] 动画效果优化

#### 9. 社交和分享
- [ ] 分享书签分类（链接、二维码、HTML）
- [ ] ShareDialog组件

#### 10. 云端同步
- [ ] chrome.storage.sync集成
- [ ] 自定义云端存储（Google Drive、Dropbox）

#### 11. 多语言支持
- [ ] vue-i18n集成
- [ ] 语言文件（中文、英文、日文）
- [ ] 语言切换功能

#### 12. 无障碍支持
- [ ] 键盘导航优化
- [ ] 屏幕阅读器支持
- [ ] 高对比度主题

#### 13. 性能监控和错误追踪
- [ ] 性能指标监控
- [ ] Sentry集成或自定义错误追踪

#### 14. 测试完善
- [ ] 单元测试（Vitest）
- [ ] 端到端测试（Playwright/Cypress）

#### 15. 文档完善
- [ ] 用户手册
- [ ] 开发文档
- [ ] 视频教程（可选）

---

## 📊 开发进度跟踪

### P0进度（基础数据层）
- 总任务数: 约30个
- 已完成: 0
- 进行中: 0
- 待开始: 30
- 完成度: 0%

### P1进度（核心UI）
- 总任务数: 约40个
- 已完成: 0
- 进行中: 0
- 待开始: 40
- 完成度: 0%

### P2进度（高级功能）
- 总任务数: 约60个
- 已完成: 0
- 进行中: 0
- 待开始: 60
- 完成度: 0%

### P3进度（增强功能）
- 总任务数: 约80个
- 已完成: 0
- 进行中: 0
- 待开始: 80
- 完成度: 0%

---

## 🎯 当前开发阶段

**当前阶段**: 准备开始P0  
**下一里程碑**: bookmarksStore完整实现  
**预计完成时间**: 1周后

---

## 📝 开发建议

### 阶段性开发策略
1. **P0**: 专注数据层，确保数据结构和持久化机制稳定
2. **P1**: 快速实现UI，验证用户体验和交互流程
3. **P2**: 补充高级功能，完善核心功能体验
4. **P3**: 根据用户反馈选择性实现增强功能

### 质量保证
- 每个阶段完成后进行充分测试
- 代码review确保代码质量
- 及时修复bug和性能问题
- 保持文档同步更新

### 优先级调整
- P3功能可以根据用户需求动态调整优先级
- 某些P3功能可能提前到P2实现
- 保持灵活性，及时响应用户反馈

---

## 🔗 相关文档

- [PRD完整文档](./prd-adapted.md)
- [P0详细任务](./P0.md)
- [P1详细任务](./P1.md)
- [P2详细任务](./P2.md)
- [P3详细任务](./P3.md)

---

**文档维护**: 请在完成每个任务后更新对应的checkbox状态  
**更新频率**: 建议每周更新一次进度
