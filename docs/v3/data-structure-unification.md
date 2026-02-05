# 数据结构统一方案

**目标**: 统一 Sessions（会话）和 Bookmarks（书签）模块的数据结构
**创建日期**: 2026年1月26日
**最后更新**: 2026年1月27日
**状态**: ✅ 已完成

---

## 📊 v2.1.0 更新：Favicon 缓存优化

### 问题
原有 `favIconUrl` 字段存储完整的 Google Favicon 服务 URL，每次刷新页面都会请求 Google 服务，导致大量网络请求。

### 解决方案
1. **Tab 数据只存 `domain`**（域名），不再存储 `favIconUrl`
2. **新增 `favicon_cache` 存储**：`{ domain: faviconUrl }` 映射
3. **显示时从缓存获取**，同一域名只存储一次图标 URL

### 新的数据结构

```javascript
// Tab/Bookmark 数据 - 用 domain 替代 favIconUrl
{
  id: string,
  title: string,
  url: string,
  domain: string,  // 新增：只存 hostname，如 "github.com"
  // favIconUrl: 已废弃
}

// 新增：独立的图标缓存存储
// Storage key: "favicon_cache"
{
  "github.com": "https://github.githubassets.com/favicons/favicon.svg",
  "google.com": "https://www.google.com/favicon.ico",
  // ...
}
```

### 相关文件
- `src/utils/faviconCache.js` - 缓存管理工具
- `src/composables/useFavicon.js` - 组件使用的 composable
- `src/utils/dataMigration.js` - 数据迁移（v2.1.0）

---

## 📊 当前数据结构差异分析

### 1. Tab/Bookmark 单项数据结构

#### Sessions 模块 (TabItem)

```javascript
// background.js 保存的 tab 结构
{
  url: string,           // 标签页URL
  title: string,         // 标签页标题
  domain: string,        // 网站域名（用于获取图标）
  groupId: number        // Chrome标签组ID (可选)
}
```

#### Bookmarks 模块 (BookmarkCard)

```javascript
// bookmarksStore 保存的 bookmark 结构
{
  id: string,            // 书签唯一ID
  title: string,         // 标题
  url: string,           // 网址
  domain: string,        // 网站域名（用于获取图标）
  description: string,   // 描述 (额外字段)
  tags: string[],        // 标签 (额外字段)
  sourceGroup: string,   // 来源分组 (额外字段)
  createdAt: number,     // 创建时间
  visitCount: number,    // 访问次数 (额外字段)
  isPinned: boolean,     // 是否固定
  isFavorite: boolean    // 是否收藏 (额外字段)
}
```

### 2. 核心差异点

| 字段     | Sessions (Tab)     | Bookmarks     | 建议统一           |
| -------- | ------------------ | ------------- | ------------------ |
| 标题字段 | `title`            | `title`       | ✅ 已统一          |
| ID       | 无 (使用 url 标识) | `id`          | ✅ 全部添加 `id`   |
| 图标     | `domain`           | `domain`      | ✅ 已统一          |
| 描述     | 无                 | `description` | 保留为可选         |
| 标签     | 无                 | `tags`        | 保留为可选         |
| 固定状态 | 无                 | `isPinned`    | 保留为可选         |
| 收藏状态 | 无                 | `isFavorite`  | 保留为可选         |

### 3. 容器结构差异

#### Session 结构

```javascript
{
  date: number,          // 时间戳作为ID
  type: 'ungrouped' | 'grouped',
  title: string,         // 会话标题
  tabs: Tab[],           // 标签页数组
  isPinned: boolean,
  groupInfo?: {          // Chrome标签组信息
    id: number,
    title: string,
    color: string,
    collapsed: boolean
  }
}
```

#### Collection 结构

```javascript
{
  id: string,
  name: string,          // ⚠️ 使用 name 而非 title
  color: string,
  icon: string,
  createdAt: number,
  updatedAt: number,
  pinned: boolean,       // ⚠️ 使用 pinned 而非 isPinned
  tabs: Tab[]
}
```

#### Bookmark Category 结构 (三级树)

```javascript
{
  id: string,
  name: string,          // ⚠️ 使用 name 而非 title
  icon: string,
  color: string,
  children?: Category[], // 子分类
  bookmarks?: Bookmark[] // 书签列表 ⚠️ 字段名不同
}
```

---

## 🎯 统一方案

### 统一后的 Tab/Bookmark 结构

```javascript
// 统一的标签页/书签 数据结构
interface UnifiedTabItem {
  id: string,              // 唯一ID (必需)
  title: string,           // 标题 (统一使用 title)
  url: string,             // 网址 (必需)
  favIconUrl?: string,     // 网站图标 (可选)

  // === 扩展字段 (书签功能) ===
  description?: string,    // 描述 (可选)
  tags?: string[],         // 标签 (可选)
  sourceGroup?: string,    // 来源分组 (可选)
  createdAt?: number,      // 创建时间 (可选)
  visitCount?: number,     // 访问次数 (可选)
  isPinned?: boolean,      // 是否固定 (可选)
  isFavorite?: boolean,    // 是否收藏 (可选)

  // === Chrome 原生字段 ===
  groupId?: number,        // Chrome标签组ID (可选)
}
```

### 统一后的容器结构

```javascript
// 统一的分类/分组 结构
interface UnifiedCategory {
  id: string,              // 唯一ID
  title: string,           // 标题 (统一使用 title, 原 name)
  icon?: string,           // 图标
  color?: string,          // 颜色
  isPinned?: boolean,      // 是否置顶 (统一使用 isPinned)
  createdAt?: number,      // 创建时间
  updatedAt?: number,      // 更新时间

  // === 子项 ===
  tabs?: UnifiedTabItem[], // 标签页列表 (统一使用 tabs)
  children?: UnifiedCategory[], // 子分类
}
```

---

## 📋 实施 TodoList

### Phase 1: 数据层统一 (Store 修改)

#### 1.1 修改 bookmarksStore.js

- [x] 将 bookmark 结构中的 `name` 字段改为 `title`
- [x] 将 category 结构中的 `name` 字段改为 `title`
- [x] 将 `bookmarks` 数组字段名改为 `tabs` (与其他模块统一)
- [x] 添加数据迁移逻辑（兼容旧数据）
- [x] 更新所有 getters 中的字段引用
- [x] 更新所有 actions 中的字段引用

#### 1.2 修改 collectionsStore.js

- [x] 将 collection 结构中的 `name` 字段改为 `title`
- [x] 将 `pinned` 字段改为 `isPinned`
- [x] 添加数据迁移逻辑
- [x] 更新 getters 和 actions

#### 1.3 修改 templatesStore.js

- [x] 检查并统一 template.collections 中的字段名
- [x] 检查 standaloneTabs 的字段结构

#### 1.4 修改 sessionsStore.js

- [x] 为每个 tab 添加 `id` 字段生成逻辑
- [x] 确保 Session 和 Tab 结构符合统一规范

### Phase 2: UI 组件修改

#### 2.1 Bookmarks 相关组件

- [x] **BookmarkCard.vue**: `bookmark.name` → `bookmark.title`
- [x] **BookmarkDialog.vue**: 表单字段 `name` → `title`
- [x] **BookmarkSearchBar.vue**: 搜索结果 `name` → `title`
- [x] **CategoryTabs.vue**: `category.name` → `category.title`
- [x] **CategorySidebar.vue**: `category.name` → `category.title`
- [x] **CategoryDialog.vue**: 表单字段 `name` → `title`
- [x] **PinnedBookmarksBar.vue**: 检查字段引用

#### 2.2 Collections 相关组件

- [x] **CollectionCard.vue**: `collection.name` → `collection.title`
- [x] **CollectionEditor.vue**: 表单字段 `name` → `title`
- [x] **CollectionSelector.vue**: 检查字段引用

#### 2.3 Sessions 相关组件

- [x] **SessionCard.vue**: 确认使用 `title` (已正确)
- [x] **TabItem.vue**: 确认使用 `title` (已正确)

#### 2.4 Templates 相关组件

- [x] **TemplateCard.vue**: 检查集合引用字段
- [x] **TemplateEditor.vue**: 检查表单字段

### Phase 3: 工具函数和辅助代码

#### 3.1 导入工具

- [x] **bookmarkImporter.js**: 解析后输出 `title` 而非 `name`

#### 3.2 上下文菜单

- [x] **contextMenus.js**: 检查菜单项生成时的字段引用

#### 3.3 Background Script

- [x] **background.js**: 确认生成的 tab 结构正确

### Phase 4: 数据迁移

#### 4.1 创建迁移工具

- [x] 创建 `src/utils/dataMigration.js`
- [x] 实现 `migrateBookmarksData()` 函数
- [x] 实现 `migrateCollectionsData()` 函数
- [x] 添加版本检测逻辑

#### 4.2 Store 加载时迁移

- [x] bookmarksStore.loadBookmarks() 中添加迁移调用
- [x] collectionsStore.loadCollections() 中添加迁移调用

### Phase 5: 测试和验证

- [x] 测试 Sessions 功能正常
- [x] 测试 Bookmarks 功能正常
- [x] 测试 Collections 功能正常
- [x] 测试 Templates 功能正常
- [x] 测试数据迁移（旧数据 → 新数据）
- [x] 测试导入导出功能

---

## ✅ 完成状态

**所有任务已完成！** (2024年完成)

数据结构统一工作已全部完成，包括：
- Store 层字段统一 (name→title, bookmarks→tabs, pinned→isPinned)
- UI 组件字段引用更新
- 数据迁移工具创建和集成
- 导入工具更新

---

## 🔄 数据迁移策略

### 迁移代码示例

```javascript
// src/utils/dataMigration.js

const DATA_VERSION = '2.0.0'

/**
 * 迁移书签数据到统一结构
 */
export function migrateBookmarksData(data) {
  if (!data || data._version === DATA_VERSION) {
    return data
  }

  const migrateCategory = (category) => ({
    ...category,
    title: category.title || category.name, // name → title
    tabs: (category.bookmarks || category.tabs || []).map(migrateTab),
    children: category.children?.map(migrateCategory),
    // 删除旧字段
    name: undefined,
    bookmarks: undefined,
  })

  const migrateTab = (tab) => ({
    id: tab.id || generateId('tab'),
    title: tab.title || tab.name,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    description: tab.description,
    tags: tab.tags,
    isPinned: tab.isPinned ?? tab.pinned,
    isFavorite: tab.isFavorite ?? tab.favorite,
    createdAt: tab.createdAt,
    visitCount: tab.visitCount,
    // 删除旧字段
    name: undefined,
    pinned: undefined,
    favorite: undefined,
  })

  return {
    ...data,
    bookmarks: data.bookmarks?.map(migrateCategory),
    _version: DATA_VERSION,
  }
}

/**
 * 迁移收藏集数据到统一结构
 */
export function migrateCollectionsData(collections) {
  return collections.map((collection) => ({
    ...collection,
    title: collection.title || collection.name,
    isPinned: collection.isPinned ?? collection.pinned,
    tabs: collection.tabs?.map((tab) => ({
      ...tab,
      id: tab.id || generateId('tab'),
      title: tab.title || tab.name,
    })),
    // 删除旧字段
    name: undefined,
    pinned: undefined,
  }))
}
```

---

## 📝 注意事项

1. **向后兼容**: 迁移时保留对旧字段的读取支持
2. **渐进式迁移**: 用户打开应用时自动迁移，无需手动操作
3. **日志记录**: 迁移过程中记录日志，便于调试
4. **备份建议**: 迁移前建议用户备份数据（可选功能）

---

## 📅 执行计划

| 阶段    | 任务         | 预计时间 | 优先级 |
| ------- | ------------ | -------- | ------ |
| Phase 1 | 数据层统一   | 2-3小时  | 最高   |
| Phase 2 | UI组件修改   | 2-3小时  | 高     |
| Phase 3 | 工具函数修改 | 1小时    | 中     |
| Phase 4 | 数据迁移     | 1-2小时  | 高     |
| Phase 5 | 测试验证     | 1-2小时  | 高     |

**总预计时间**: 7-11小时

---

## ✅ 完成标准

- [ ] 所有模块使用统一的 `title` 字段表示标题
- [ ] 所有模块使用统一的 `isPinned` 字段表示置顶状态
- [ ] Bookmarks 模块的 `bookmarks` 数组统一为 `tabs`
- [ ] 所有 Tab 项都有唯一的 `id`
- [ ] 旧数据可以自动迁移到新结构
- [ ] 所有功能测试通过
