# OneTabs V2.0 架构说明

> 创建时间：2026-01-20  
> 状态：已确认

---

## 📐 整体架构

### 页面结构

OneTabs V2.0 采用 **单页面 + Tab切换** 的架构模式，而非多路由页面模式。

```
┌─────────────────────────────────────────────┐
│  App.vue                                     │
│  ├─ AppHeader (Logo + 搜索 + 设置)           │
│  └─ MainView / Tabs容器                      │
│     ├─ Tab导航栏                             │
│     │  ├─ 📦 会话收纳 (默认)                │
│     │  ├─ 📁 标签页组                       │
│     │  └─ 🚀 窗口模板                       │
│     └─ Tab内容区                             │
│        ├─ SessionsView (会话收纳视图)        │
│        ├─ CollectionsView (标签页组视图)    │
│        └─ TemplatesView (窗口模板视图)      │
└─────────────────────────────────────────────┘
```

---

## 🔄 路由设计

### 简化的路由配置

```javascript
// router/index.js
const routes = [
  {
    path: '/',
    name: 'Main',
    component: MainView  // 包含所有三个Tab的主视图
  },
  {
    path: '/settings',  // 可选的独立设置页面
    name: 'Settings',
    component: Settings
  }
]
```

### 为什么不使用多路由？

❌ **不推荐的方案：多路由页面**
```javascript
const routes = [
  { path: '/sessions', component: SessionsView },
  { path: '/collections', component: CollectionsView },
  { path: '/templates', component: TemplatesView }
]
```

**原因：**
1. Chrome扩展的弹出页面刷新会导致路由状态丢失
2. 用户体验不佳，切换Tab时URL会变化
3. 无法利用KeepAlive缓存组件状态
4. 增加不必要的路由复杂度

✅ **推荐的方案：单页面内Tab切换**
- 使用响应式状态管理当前Tab
- 组件状态自然保持
- 切换流畅无闪烁
- 更符合Chrome扩展的使用场景

---

## 🎨 Tab切换实现

### 方案一：使用PrimeVue Tabs（推荐）

```vue
<template>
  <div class="app-container">
    <AppHeader />
    
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="sessions">📦 会话收纳</Tab>
        <Tab value="collections">📁 标签页组</Tab>
        <Tab value="templates">🚀 窗口模板</Tab>
      </TabList>
      
      <TabPanels>
        <TabPanel value="sessions">
          <SessionsView />
        </TabPanel>
        <TabPanel value="collections">
          <CollectionsView />
        </TabPanel>
        <TabPanel value="templates">
          <TemplatesView />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('sessions')
</script>
```

**优点：**
- 开箱即用，UI美观
- 支持键盘导航
- 动画过渡自然
- 符合设计规范

### 方案二：自定义Tab组件

```vue
<template>
  <div class="app-container">
    <AppHeader />
    
    <!-- Tab导航 -->
    <div class="tab-nav">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>
    
    <!-- Tab内容 -->
    <div class="tab-content">
      <KeepAlive>
        <component :is="currentComponent" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SessionsView from './views/SessionsView.vue'
import CollectionsView from './views/CollectionsView.vue'
import TemplatesView from './views/TemplatesView.vue'

const activeTab = ref('sessions')

const tabs = [
  { key: 'sessions', label: '会话收纳', icon: '📦' },
  { key: 'collections', label: '标签页组', icon: '📁' },
  { key: 'templates', label: '窗口模板', icon: '🚀' }
]

const currentComponent = computed(() => {
  const map = {
    sessions: SessionsView,
    collections: CollectionsView,
    templates: TemplatesView
  }
  return map[activeTab.value]
})
</script>
```

**优点：**
- 完全自定义样式
- 更轻量级
- 完全控制行为
- 易于扩展

---

## 📦 组件结构

### 主要组件层级

```
App.vue
├── AppHeader.vue (顶部导航栏)
│   ├── Logo
│   ├── SearchBar.vue (全局搜索)
│   └── SettingsButton
│
└── MainView.vue / Tabs容器
    ├── TabNavigation (Tab导航栏)
    │   ├── SessionsTab
    │   ├── CollectionsTab
    │   └── TemplatesTab
    │
    └── TabContent (内容区)
        │
        ├── SessionsView.vue (会话收纳)
        │   ├── SessionCard.vue
        │   │   ├── TabGroup.vue
        │   │   └── TabItem.vue
        │   └── EmptyState.vue
        │
        ├── CollectionsView.vue (标签页组)
        │   ├── CollectionCard.vue
        │   │   └── TabItem.vue
        │   ├── CollectionEditor.vue
        │   └── EmptyState.vue
        │
        └── TemplatesView.vue (窗口模板)
            ├── TemplateCard.vue
            │   ├── CollectionRef.vue
            │   └── TabItem.vue
            ├── TemplateEditor.vue
            └── EmptyState.vue
```

---

## 🗄️ 状态管理

### Pinia Stores

```javascript
// stores/
├── sessionsStore.js      // 会话收纳数据
│   ├── sessions[]        // 所有保存的会话
│   └── actions           // loadSessions, deleteSession, restoreSession
│
├── collectionsStore.js   // 标签页组数据
│   ├── collections[]     // 所有标签页组
│   └── actions           // createCollection, updateCollection, openCollection
│
├── templatesStore.js     // 窗口模板数据
│   ├── templates[]       // 所有窗口模板
│   └── actions           // createTemplate, openTemplate, duplicateTemplate
│
└── settingsStore.js      // 全局设置
    ├── autoClose         // 自动关闭标签页
    ├── keepPinned        // 保留固定标签页
    └── maxSessions       // 最大会话数
```

### 状态共享

Tab切换时，组件状态通过以下方式保持：
1. **Pinia Store**：持久化数据，跨组件共享
2. **KeepAlive**：缓存组件实例，保持UI状态
3. **localStorage/chrome.storage**：浏览器级别持久化

---

## 🎯 开发优先级

### P0 - 核心功能（MVP必须）
1. ✅ Background Service Worker
2. 🚧 基础UI框架（单页面+Tab）
3. ⏳ 会话收纳功能
4. ⏳ 基础设置功能
5. ✅ Manifest配置
6. ✅ 构建与打包

### P1 - 主要功能
1. ⏳ 标签页组管理（Collections）
2. ⏳ 窗口模板管理（Templates）
3. ⏳ 基础拖拽功能

### P2 - 优化功能
1. ⏳ 高级拖拽功能
2. ⏳ 搜索功能
3. ⏳ 数据导入导出
4. ⏳ 右键菜单
5. ⏳ 快捷键支持
6. ⏳ 性能优化

---

## 🚀 实施步骤

### 第一步：重构现有代码
1. 将 `TabGroups.vue` 重命名为 `SessionsView.vue`
2. 将 `Groups.vue` 重命名为 `CollectionsView.vue`
3. 创建 `TemplatesView.vue`
4. 创建 `MainView.vue` 作为Tab容器

### 第二步：实现Tab切换
1. 在 `MainView.vue` 中实现Tab导航逻辑
2. 使用 `v-model` 绑定 `activeTab` 状态
3. 根据 `activeTab` 切换显示对应的View组件
4. 使用 `KeepAlive` 缓存组件状态

### 第三步：调整路由配置
1. 简化 `router/index.js`，只保留 `/` 主路由
2. 移除 `/sessions`、`/collections`、`/templates` 路由
3. 可选：保留 `/settings` 作为独立页面

### 第四步：重构Store
1. 创建 `sessionsStore.js`（从 `tabsStore.js` 重构）
2. 完善 `collectionsStore.js`（从 `groupsStore.js` 重构）
3. 创建 `templatesStore.js`
4. 创建 `settingsStore.js`

---

## ✅ 架构优势

1. **用户体验更好**
   - 切换流畅无延迟
   - 状态自然保持
   - 符合Tab UI的心智模型

2. **开发更简单**
   - 无需管理复杂路由
   - 组件通信更直接
   - 状态管理更清晰

3. **性能更优**
   - 组件复用，减少重渲染
   - KeepAlive缓存提升响应速度
   - 减少不必要的数据加载

4. **维护更容易**
   - 代码结构清晰
   - 单一职责原则
   - 易于测试和调试

---

## 📚 相关文档

- [P0.md](./P0.md) - 核心功能开发计划
- [P1.md](./P1.md) - 主要功能开发计划
- [prd.md](./prd.md) - 产品需求文档
- [roadmap.md](./roadmap.md) - 开发路线图

---

## 🔄 更新记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-01-20 | 1.0 | 确定单页面+Tab切换架构 |
