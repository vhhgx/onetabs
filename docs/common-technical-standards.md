# OneTabs 通用技术标准文档

本文档定义了 OneTabs 项目中通用的技术标准、规范和最佳实践，适用于所有模块（标签页管理、会话、收藏集、模板、书签等）。

---

## 1. 技术栈

### 1.1 核心技术

| 类别     | 技术       | 版本   | 说明                           |
| -------- | ---------- | ------ | ------------------------------ |
| 框架     | Vue 3      | ^3.5.x | Composition API + Script Setup |
| 状态管理 | Pinia      | ^3.0.x | 模块化 Store 设计              |
| 路由     | Vue Router | ^4.x   | 单页面应用路由                 |
| 构建工具 | Vite       | ^6.x   | 快速开发和构建                 |
| 代码规范 | ESLint     | ^9.x   | 代码质量检查                   |

### 1.2 UI 组件库

| 组件库            | 版本 | 用途           |
| ----------------- | ---- | -------------- |
| PrimeVue          | ^4.x | 主要 UI 组件库 |
| PrimeIcons        | ^7.x | 图标库         |
| 阿里巴巴 iconfont | -    | 自定义图标     |

### 1.3 Chrome 扩展 API

```json
{
  "manifest_version": 3,
  "permissions": [
    "tabs", // 标签页管理
    "tabGroups", // 标签组管理
    "storage", // 本地存储
    "activeTab", // 活跃标签页
    "bookmarks" // 书签管理（v3新增）
  ]
}
```

---

## 2. 组件库使用规范

### 2.1 PrimeVue 组件使用

#### 对话框组件

```javascript
import Dialog from 'primevue/dialog'

// 使用规范
// - 必须设置 :modal="true"
// - 必须设置 :closable="true"
// - 使用 v-model:visible 双向绑定
// - 使用 pt 属性自定义样式
```

#### 确认对话框

```javascript
import { useConfirm } from 'primevue/useconfirm'

const confirm = useConfirm()
confirm.require({
  message: '确定要删除吗？',
  header: '确认删除',
  icon: 'pi pi-exclamation-triangle',
  acceptClass: 'p-button-danger',
  accept: () => {
    /* 确认回调 */
  },
  reject: () => {
    /* 取消回调 */
  },
})
```

#### Toast 通知

```javascript
import { useToast } from 'primevue/usetoast'

const toast = useToast()
// 成功提示
toast.add({ severity: 'success', summary: '成功', detail: '操作成功', life: 3000 })
// 错误提示
toast.add({ severity: 'error', summary: '错误', detail: '操作失败', life: 5000 })
// 警告提示
toast.add({ severity: 'warn', summary: '警告', detail: '请注意', life: 3000 })
// 信息提示
toast.add({ severity: 'info', summary: '提示', detail: '一般信息', life: 3000 })
```

### 2.2 表单组件

| 场景     | 推荐组件              | 备注 |
| -------- | --------------------- | ---- |
| 文本输入 | PrimeVue InputText    |      |
| 长文本   | PrimeVue Textarea     |      |
| 下拉选择 | PrimeVue Dropdown     |      |
| 多选     | PrimeVue MultiSelect  |      |
| 开关     | PrimeVue ToggleSwitch |      |
| 颜色选择 | PrimeVue ColorPicker  |      |
| 日期选择 | PrimeVue DatePicker   |      |

### 2.3 自定义图标使用

```vue
<!-- 使用 iconfont -->
<Icon name="iconfont-xxx" :size="16" />

<!-- 使用 PrimeIcons -->
<i class="pi pi-search"></i>

<!-- 图标规范 -->
<!-- - 小图标: 12-14px -->
<!-- - 中图标: 16-20px -->
<!-- - 大图标: 24-32px -->
```

---

## 3. 动画规范

### 3.1 CSS 过渡

```css
/* 基础过渡 - 悬停效果 */
.card {
  transition: all var(--transition-duration) ease;
}

/* 标准过渡时长 */
:root {
  --transition-fast: 0.15s; /* 快速响应 */
  --transition-duration: 0.25s; /* 默认过渡 */
  --transition-slow: 0.35s; /* 缓慢过渡 */
}

/* 悬停效果 */
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### 3.2 Vue Transition 组件

```vue
<!-- 淡入淡出 -->
<Transition name="fade">
  <Component v-if="show" />
</Transition>

<!-- 滑动过渡 -->
<Transition name="slide-up">
  <Component v-if="show" />
</Transition>

<!-- 列表过渡 -->
<TransitionGroup name="list" tag="div">
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</TransitionGroup>
```

### 3.3 预定义动画类

```css
/* animations.css 中定义 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.list-move {
  transition: transform 0.3s ease;
}
```

### 3.4 动画性能原则

- ✅ 优先使用 `transform` 和 `opacity`（GPU 加速）
- ✅ 使用 `will-change` 提示浏览器（谨慎使用）
- ❌ 避免动画 `width`、`height`、`top`、`left` 等触发重排的属性
- ❌ 避免在大列表中使用复杂动画

---

## 4. 性能优化规范

### 4.1 虚拟滚动

当列表项超过 50 个时，应启用虚拟滚动：

```vue
<script setup>
import VirtualScroller from 'primevue/virtualscroller'
</script>

<template>
  <VirtualScroller :items="largeList" :itemSize="60" class="border-1 surface-border border-round" style="height: 400px">
    <template #item="{ item }">
      <div class="item">{{ item.name }}</div>
    </template>
  </VirtualScroller>
</template>
```

### 4.2 懒加载

```javascript
// 路由懒加载
const routes = [
  {
    path: '/bookmarks',
    component: () => import('@/views/BookmarksView.vue'),
  },
]

// 组件懒加载
import { defineAsyncComponent } from 'vue'
const HeavyComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))
```

### 4.3 防抖与节流

```javascript
// 搜索防抖 - 300ms
import { useDebounceFn } from '@vueuse/core'

const debouncedSearch = useDebounceFn((keyword) => {
  performSearch(keyword)
}, 300)

// 拖拽节流 - 16ms (约60fps)
import { useThrottleFn } from '@vueuse/core'

const throttledDrag = useThrottleFn((event) => {
  handleDrag(event)
}, 16)
```

### 4.4 图标/图片缓存

```javascript
// Favicon 缓存策略
const faviconCache = new Map()

async function getFavicon(url) {
  const domain = new URL(url).hostname

  if (faviconCache.has(domain)) {
    return faviconCache.get(domain)
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  faviconCache.set(domain, faviconUrl)
  return faviconUrl
}
```

### 4.5 性能指标

| 指标             | 目标值  | 测量方法        |
| ---------------- | ------- | --------------- |
| 首屏加载         | < 1.5s  | Performance API |
| 列表渲染 (100项) | < 100ms | console.time    |
| 搜索响应         | < 200ms | 防抖后响应      |
| 拖拽帧率         | 60fps   | 节流处理        |

---

## 5. 兼容性规范

### 5.1 浏览器支持

| 浏览器  | 最低版本 | 说明                         |
| ------- | -------- | ---------------------------- |
| Chrome  | 88+      | 主要目标平台                 |
| Edge    | 88+      | Chromium 内核                |
| Firefox | -        | 暂不支持（无 tabGroups API） |
| Safari  | -        | 暂不支持                     |

### 5.2 Chrome API 兼容性检测

```javascript
// 检测 API 是否可用
function isTabGroupsSupported() {
  return typeof chrome !== 'undefined' && typeof chrome.tabGroups !== 'undefined'
}

function isBookmarksSupported() {
  return typeof chrome !== 'undefined' && typeof chrome.bookmarks !== 'undefined'
}

// 安全调用 API
async function safeGetTabs() {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    console.warn('chrome.tabs API not available')
    return []
  }
  return await chrome.tabs.query({})
}
```

### 5.3 开发环境降级处理

```javascript
// 开发环境使用 Mock 数据
const isDev = import.meta.env.DEV

export async function getTabs() {
  if (isDev && typeof chrome === 'undefined') {
    return getMockTabs()
  }
  return await chrome.tabs.query({})
}
```

---

## 6. 边界情况处理

### 6.1 空状态处理

每个列表/数据展示区域必须处理空状态：

```vue
<template>
  <div v-if="loading">
    <ProgressSpinner />
  </div>
  <div v-else-if="items.length === 0">
    <EmptyState icon="pi-inbox" title="暂无数据" description="点击右上角添加按钮创建第一条数据">
      <template #action>
        <Button label="立即添加" @click="handleAdd" />
      </template>
    </EmptyState>
  </div>
  <div v-else>
    <!-- 正常列表展示 -->
  </div>
</template>
```

### 6.2 错误处理

```javascript
// 全局错误处理器
import { errorHandler } from '@/utils/errorHandler'

// Store 中的错误处理
async function loadData() {
  try {
    this.loading = true
    this.error = null
    const data = await fetchData()
    this.data = data
  } catch (error) {
    this.error = error.message
    errorHandler.handle(error, '加载数据失败')
  } finally {
    this.loading = false
  }
}

// 显示用户友好的错误提示
function showError(error) {
  toast.add({
    severity: 'error',
    summary: '操作失败',
    detail: error.message || '未知错误，请重试',
    life: 5000,
  })
}
```

### 6.3 数据验证

```javascript
// URL 验证
import { validateUrl, sanitizeUrl } from '@/utils/urlValidator'

// 表单验证
const rules = {
  title: [
    { required: true, message: '名称不能为空' },
    { max: 100, message: '名称不能超过100个字符' },
  ],
  url: [
    { required: true, message: 'URL不能为空' },
    { validator: validateUrl, message: 'URL格式无效' },
  ],
}
```

### 6.4 边界数据处理

```javascript
// 最大数量限制
const LIMITS = {
  MAX_TABS_PER_SESSION: 500,
  MAX_BOOKMARKS_PER_CATEGORY: 1000,
  MAX_PINNED_ITEMS: 20,
  MAX_FAVORITE_ITEMS: 100,
  MAX_SEARCH_RESULTS: 50,
}

// 超出限制时的处理
function addTab(session, tab) {
  if (session.tabs.length >= LIMITS.MAX_TABS_PER_SESSION) {
    throw new Error(`单个会话最多保存 ${LIMITS.MAX_TABS_PER_SESSION} 个标签页`)
  }
  session.tabs.push(tab)
}
```

### 6.5 并发和竞态处理

```javascript
// 使用 AbortController 取消过期请求
let abortController = null

async function search(keyword) {
  // 取消之前的请求
  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()

  try {
    const results = await fetchResults(keyword, {
      signal: abortController.signal,
    })
    return results
  } catch (error) {
    if (error.name === 'AbortError') {
      // 请求被取消，忽略
      return null
    }
    throw error
  }
}
```

---

## 7. 数据结构规范

### 7.1 统一字段命名

所有模块使用统一的字段命名：

| 统一字段     | 类型    | 说明              |
| ------------ | ------- | ----------------- |
| `id`         | string  | 唯一标识符 (UUID) |
| `title`      | string  | 显示名称          |
| `tabs`       | Tab[]   | 标签页列表        |
| `isPinned`   | boolean | 是否固定          |
| `isFavorite` | boolean | 是否收藏          |
| `createdAt`  | number  | 创建时间戳        |
| `updatedAt`  | number  | 更新时间戳        |

### 7.2 Tab 标准格式

```typescript
interface Tab {
  id: string // 唯一ID
  title: string // 标签页标题
  url: string // URL地址
  favIconUrl?: string // 网站图标
}
```

### 7.3 数据迁移

当数据结构变更时，使用 `dataMigration.js` 进行迁移：

```javascript
import { migrateData, migrateCategory } from '@/utils/dataMigration'

// 加载数据时自动迁移
async function loadData() {
  const rawData = await chrome.storage.local.get('bookmarks')
  const migratedData = rawData.categories.map((category) => migrateCategory(category))
  return migratedData
}
```

---

## 8. 主题样式规范

### 8.1 CSS 变量

```css
:root {
  /* 主色调 */
  --primary-color: #3b82f6;
  --primary-color-hover: #2563eb;

  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;

  /* 文字色 */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;

  /* 边框色 */
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* 暗色主题 */
[data-theme='dark'] {
  --primary-color: #60a5fa;
  --bg-primary: #1e293b;
  --bg-secondary: #0f172a;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-primary: #334155;
}
```

### 8.2 响应式断点

```css
/* 移动端 */
@media (max-width: 767px) {
  /* 单列布局 */
}

/* 平板端 */
@media (min-width: 768px) and (max-width: 1023px) {
  /* 2-3列布局 */
}

/* 桌面端 */
@media (min-width: 1024px) {
  /* 多列布局 */
}
```

---

## 9. 测试规范

### 9.1 测试工具

| 工具               | 用途             |
| ------------------ | ---------------- |
| Vitest             | 单元测试         |
| Vue Test Utils     | 组件测试         |
| Playwright/Cypress | E2E 测试（可选） |

### 9.2 测试覆盖率要求

| 模块                    | 最低覆盖率 |
| ----------------------- | ---------- |
| Store (actions/getters) | 80%        |
| 工具函数 (utils)        | 90%        |
| 组件                    | 60%        |

### 9.3 测试文件命名

```
src/
  stores/
    bookmarksStore.js
    __tests__/
      bookmarksStore.test.js
  utils/
    urlValidator.js
    __tests__/
      urlValidator.test.js
```

---

## 10. 文档规范

### 10.1 代码注释

```javascript
/**
 * 搜索书签
 * @param {string} keyword - 搜索关键词
 * @param {Object} options - 搜索选项
 * @param {string[]} options.tags - 按标签筛选
 * @param {boolean} options.pinnedOnly - 仅搜索固定书签
 * @returns {Bookmark[]} 匹配的书签列表
 */
function searchBookmarks(keyword, options = {}) {
  // ...
}
```

### 10.2 提交信息规范

```
<type>(<scope>): <description>

类型(type):
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- perf: 性能优化
- test: 测试
- chore: 构建/工具

示例:
feat(bookmarks): 添加批量删除功能
fix(sessions): 修复会话加载失败问题
docs(readme): 更新安装说明
```

---

## 11. 安全规范

### 11.1 XSS 防护

```javascript
// 使用 Vue 的自动转义（默认行为）
// ✅ 安全
<span>{{ userInput }}</span>

// ❌ 危险，除非确定内容安全
<span v-html="userInput"></span>

// 手动转义
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
```

### 11.2 URL 验证

```javascript
// 只允许 http(s) 协议
function isValidUrl(url) {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// 清理 URL
function sanitizeUrl(url) {
  if (!isValidUrl(url)) {
    return ''
  }
  return url.trim()
}
```

### 11.3 存储安全

```javascript
// 敏感数据不存储在 chrome.storage.sync（有配额限制且可能同步）
// 大量数据使用 chrome.storage.local

// 数据加密（如需要）
import { encrypt, decrypt } from '@/utils/crypto'

async function saveSecureData(key, data) {
  const encrypted = await encrypt(JSON.stringify(data))
  await chrome.storage.local.set({ [key]: encrypted })
}
```

---

## 更新日志

| 版本  | 日期    | 更新内容             |
| ----- | ------- | -------------------- |
| 1.0.0 | 2024-01 | 初始版本             |
| 1.1.0 | -       | 添加数据结构统一规范 |

---

_本文档由 OneTabs 开发团队维护，如有疑问请提交 Issue。_
