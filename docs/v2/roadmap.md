# OneTabs V2.0 开发路线图

> 最后更新：2026-01-26  
> 状态图例：✅ 已完成 | 🚧 进行中 | ⏳ 待开始

---

## 📊 优先级说明

- **P0（核心功能）**：必须实现，产品MVP的基础功能
- **P1（主要功能）**：重要功能，构成产品核心价值
- **P2（优化功能）**：增强用户体验，可在迭代中完成
- **P3（未来规划）**：锦上添花，长期规划

---

## 🎯 P0 - 核心功能（MVP必须）

### 1. Background Service Worker（后台服务）

#### 1.1 扩展图标点击处理
- [x] 监听扩展图标点击事件 `chrome.action.onClicked`
- [x] 获取当前窗口信息 `chrome.windows.getCurrent()`
- [x] 触发标签页保存流程

#### 1.2 标签页数据获取
- [x] 使用 `chrome.tabs.query()` 获取当前窗口所有标签页
- [x] 使用 `chrome.tabGroups.query()` 获取标签页组信息
- [x] 获取每个标签页的详细信息：
  - [x] 标题（title）
  - [x] URL（url）
  - [x] 图标（favIconUrl）
  - [x] 是否固定（pinned）
  - [x] 所属分组ID（groupId）
  - [x] 索引位置（index）

#### 1.3 数据组织与存储
- [x] 将标签页按分组组织成结构化数据
- [x] 区分已分组和未分组的标签页
- [x] 生成唯一会话ID和时间戳
- [x] 保存数据到 `chrome.storage.local`
- [x] 存储键名：`tabGroups`（实际使用）

#### 1.4 标签页关闭逻辑
- [x] 获取所有需要关闭的标签页ID
- [x] 过滤掉扩展自身页面
- [x] 可选：根据设置过滤固定标签页
- [x] 批量关闭标签页 `chrome.tabs.remove()`
- [x] 确保至少保留一个标签页（扩展页面）

#### 1.5 扩展页面打开
- [x] 关闭完成后自动打开扩展页面
- [x] 使用 `chrome.tabs.create()` 创建新标签页
- [x] 跳转到扩展主页 `index.html`

---

### 2. 基础UI框架搭建

#### 2.1 页面布局结构
- [x] 创建顶部导航栏组件 `AppHeader.vue`
  - [x] Logo和产品名称显示
  - [x] 设置按钮
- [x] 创建主视图容器 `HomeView.vue` 实现
  - [x] 包含Tab导航和内容区域
  - [x] 使用局部状态管理当前激活的Tab
- [x] 创建Tab导航组件（在HomeView中实现）
  - [x] 三个Tab：Collections、Templates、Bookmarks
  - [x] Tab切换逻辑（使用activeTab状态）
  - [x] 高亮当前活动Tab
- [x] 创建内容区域组件
  - [x] `TemplatesView.vue` - 窗口模板视图
  - [x] `CollectionsView.vue` - 标签页组视图
  - [x] `SessionsView.vue` - 会话收纳视图
  - [x] 使用v-if动态组件切换显示

#### 2.2 路由配置
- [x] 配置 Vue Router（简化版）
- [x] 主路由配置：
  - [x] `/` - 主页面（HomeView，包含Tab切换功能）
  - [x] `/settings` - 设置页面（独立路由）
- [x] 默认显示主页面

注：采用单页面+Tab切换方式，三个功能模块不使用独立路由

---

### 3. 会话收纳功能（Sessions）

#### 3.1 Pinia Store - sessionsStore
- [x] 创建 `stores/sessionsStore.js`
- [x] State定义：
  - [x] `sessions: []` - 所有会话列表
  - [x] `currentSession: null` - 当前查看的会话
- [x] Actions实现：
  - [x] `loadSessions()` - 从Storage加载会话
  - [x] `saveSession(data)` - 保存新会话
  - [x] `deleteSession(id)` - 删除会话
  - [x] `restoreSession(id)` - 恢复整个会话
  - [x] `restoreGroup(sessionId, groupId)` - 恢复单个组
  - [x] `restoreTab(sessionId, tabId)` - 恢复单个标签页

#### 3.2 会话列表展示
- [x] 创建 `SessionCard.vue` 组件
  - [x] 显示保存时间（相对时间格式）
  - [x] 显示标签页总数
  - [x] 显示操作按钮：恢复、删除
  - [x] 支持折叠/展开
- [x] 创建 `TabGroup.vue` 组件（会话内的标签页组）
  - [x] 显示组名称和颜色指示器
  - [x] 显示组内标签页数量
  - [x] 标签页列表展示
  - [x] 操作按钮：恢复组、删除组
- [x] 创建 `TabItem.vue` 组件
  - [x] 显示网站图标（favicon）
  - [x] 显示页面标题
  - [x] 点击打开链接
  - [x] 悬停显示完整URL

#### 3.3 会话数据结构
```javascript
{
  date: number,            // 保存时间戳（作为唯一ID）
  type: string,            // 'grouped' | 'ungrouped'
  title: string,           // 会话标题
  isPinned: boolean,       // 是否置顶
  groupInfo: {             // 分组信息（仅grouped类型）
    id: number,
    title: string,
    color: string,
    collapsed: boolean,
  },
  tabs: [...]              // 标签页列表
}
```

#### 3.4 会话恢复功能
- [x] 恢复整个会话：
  - [x] 创建新窗口或在当前窗口打开
  - [x] 按原结构恢复所有标签页
  - [x] 恢复标签页组（Chrome Tab Groups）
  - [x] 设置组颜色和名称
- [x] 恢复单个标签页组：
  - [x] 批量创建组内所有标签页
  - [x] 创建Chrome Tab Group
  - [x] 应用组配置
- [x] 恢复单个标签页：
  - [x] 在新标签页打开URL
  - [x] 保持原有数据不变

#### 3.5 会话删除功能
- [x] 删除确认对话框
- [x] 从sessions数组中移除
- [x] 更新Storage
- [x] 显示删除成功提示

---

### 4. 基础设置功能

#### 4.1 设置页面 `Settings.vue`
- [x] 创建设置页面组件
- [x] 快速收纳设置：
  - [x] 点击图标后自动关闭标签页（默认：开启）
  - [x] 保留固定标签页（默认：关闭）
  - [x] 最大保存会话数量（默认：50）
- [x] 数据管理：
  - [x] 清空会话收纳按钮
  - [x] 清空所有数据按钮（需二次确认）

#### 4.2 Settings Store
- [x] 创建 `stores/settingsStore.js`
- [x] State定义：
  - [x] `autoClose: true` - 自动关闭标签页
  - [x] `keepPinned: false` - 保留固定标签页
  - [x] `maxSessions: 50` - 最大会话数
- [x] Actions实现：
  - [x] `loadSettings()` - 加载设置
  - [x] `updateSettings(key, value)` - 更新设置
  - [x] `resetSettings()` - 重置为默认值

---

### 5. Manifest配置

#### 5.1 基础Manifest（manifest.json）
- [x] 配置 manifest_version: 3
- [x] 设置扩展名称、版本、描述
- [x] 配置扩展图标（16/48/128）
- [x] 配置 action 点击行为
- [x] 声明必要权限：
  - [x] `tabs` - 标签页操作
  - [x] `tabGroups` - 标签页组访问
  - [x] `storage` - 本地存储
  - [x] `activeTab` - 当前标签页
  - [x] `bookmarks` - 书签操作（已添加）
- [x] 配置 background service worker
- [x] 配置 web_accessible_resources

---

### 6. 构建与打包

#### 6.1 Vite构建配置优化
- [x] 确保 `chromeExtensionPlugins()` 正常工作
- [x] 自动复制 manifest.json
- [x] 自动复制 background.js
- [x] 自动生成图标（16/48/128）
- [x] 生成默认favicon

#### 6.2 开发调试
- [x] npm run dev 本地开发
- [x] npm run build 生产构建
- [x] 加载dist文件夹到Chrome测试

---

## 🚀 P1 - 主要功能

### 7. 标签页组管理（Collections）

#### 7.1 Collections Store
- [x] 创建 `stores/collectionsStore.js`
- [x] State定义：
  - [x] `collections: []` - 所有标签页组
  - [x] `currentCollection: null` - 当前编辑的组
- [x] Actions实现：
  - [x] `loadCollections()` - 加载标签页组
  - [x] `createCollection(data)` - 创建新组
  - [x] `updateCollection(id, data)` - 更新组
  - [x] `deleteCollection(id)` - 删除组
  - [x] `addTab(collectionId, tabData)` - 添加标签页到组
  - [x] `removeTab(collectionId, tabId)` - 从组中删除标签页
  - [x] `reorderTabs(collectionId, newOrder)` - 重新排序标签页
  - [x] `reorderCollections(newOrder)` - 重新排序标签页组
  - [x] `openCollection(id, options)` - 打开标签页组

#### 7.2 标签页组数据结构
```javascript
{
  id: string,              // 唯一ID
  name: string,            // 组名称
  color: string,           // 组颜色
  icon: string,            // 组图标（可选）
  createdAt: number,       // 创建时间
  updatedAt: number,       // 更新时间
  pinned: boolean,         // 是否固定在顶部
  tabs: [                  // 标签页列表
    {
      title: string,
      url: string,
      favIconUrl: string,
      order: number
    }
  ]
}
```

#### 7.3 标签页组UI组件

##### 7.3.1 CollectionCard组件
- [x] 创建 `CollectionCard.vue`
- [x] 显示组名称和颜色
- [x] 显示标签页数量
- [x] 标签页列表（可折叠）
- [x] 操作按钮：
  - [x] 打开组
  - [x] 编辑
  - [x] 删除
- [x] 支持拖拽排序

##### 7.3.2 CollectionEditor组件（创建/编辑弹窗）
- [x] 创建 `CollectionEditor.vue`
- [x] 输入组名称
- [x] 选择组颜色（色块选择器）
- [x] 添加标签页方式：
  - [x] 从当前窗口选择（显示当前打开的标签页，支持多选）
  - [x] 手动输入URL
  - [ ] 从会话中选择（可选）
- [x] 已添加标签页列表：
  - [x] 显示、删除、排序（拖拽或上下箭头）
- [x] 保存和取消按钮

##### 7.3.3 TabSelector组件
- [x] 创建 `TabSelector.vue`
- [x] 显示当前窗口所有标签页
- [x] 支持复选框多选
- [x] 显示favicon和标题
- [x] 搜索过滤

#### 7.4 标签页组操作功能

##### 7.4.1 创建标签页组
- [x] 点击"新建标签页组"按钮打开弹窗
- [x] 填写组信息并添加标签页
- [x] 验证数据（组名不能为空，至少1个标签页）
- [x] 保存到Storage
- [x] 显示在标签页组列表

##### 7.4.2 编辑标签页组
- [x] 点击编辑按钮打开弹窗
- [x] 加载现有数据
- [x] 允许修改组名、颜色
- [x] 添加/删除标签页
- [x] 拖拽调整标签页顺序
- [x] 保存更新

##### 7.4.3 删除标签页组
- [x] 点击删除按钮
- [x] 显示确认对话框
- [x] 从collections数组移除
- [x] 更新Storage
- [x] 显示删除成功提示

##### 7.4.4 打开标签页组
- [x] 支持配置选项：
  - [x] 在当前窗口打开 / 新窗口打开
  - [x] 是否创建Chrome Tab Group
  - [ ] 是否后台打开
- [x] 批量创建标签页 `chrome.tabs.create()`
- [x] 如果选择创建Tab Group：
  - [x] 使用 `chrome.tabGroups.group()` 创建分组
  - [x] 设置组名称和颜色
- [ ] 显示打开进度（如果标签页较多）

---

### 8. 窗口模板管理（Window Templates）

#### 8.1 Templates Store
- [x] 创建 `stores/templatesStore.js`
- [x] State定义：
  - [x] `templates: []` - 所有窗口模板
  - [x] `currentTemplate: null` - 当前编辑的模板
- [x] Actions实现：
  - [x] `loadTemplates()` - 加载模板
  - [x] `createTemplate(data)` - 创建新模板
  - [x] `createFromCurrentWindow()` - 从当前窗口创建
  - [x] `updateTemplate(id, data)` - 更新模板
  - [x] `deleteTemplate(id)` - 删除模板
  - [x] `duplicateTemplate(id)` - 复制模板
  - [x] `openTemplate(id, options)` - 打开窗口模板

#### 8.2 窗口模板数据结构
```javascript
{
  id: string,              // 唯一ID
  name: string,            // 模板名称
  description: string,     // 模板描述
  icon: string,            // 模板图标
  createdAt: number,       // 创建时间
  updatedAt: number,       // 更新时间
  collections: [           // 包含的标签页组
    {
      collectionId: string,    // 引用的Collection ID（引用模式）
      name: string,            // 组名称（快照）
      color: string,           // 组颜色
      createGroup: boolean,    // 是否创建Tab Group
      isReference: boolean,    // true=引用模式, false=快照模式
      tabs: []                 // 标签页列表（快照）
    }
  ],
  standaloneTabs: [        // 独立标签页
    {
      title: string,
      url: string,
      favIconUrl: string,
      pinned: boolean
    }
  ]
}
```

#### 8.3 窗口模板UI组件

##### 8.3.1 TemplateCard组件
- [x] 创建 `TemplateCard.vue`
- [x] 显示模板名称和描述
- [x] 显示包含的资源统计：
  - [x] X个标签页组
  - [x] Y个独立标签页
- [x] 显示最后更新时间
- [x] 操作按钮：
  - [x] 打开窗口
  - [x] 编辑
  - [x] 复制
  - [x] 删除

##### 8.3.2 TemplateEditor组件
- [x] 创建 `TemplateEditor.vue`
- [x] 输入模板名称和描述
- [x] 创建方式选择：
  - [x] 从当前窗口创建（快照当前窗口所有内容）
  - [x] 手动选择标签页组
- [x] 标签页组区域：
  - [x] 显示已添加的标签页组列表
  - [x] 每个组显示：名称、颜色、标签页数量
  - [x] "创建Tab Group"复选框
  - [x] 引用/快照标识图标
  - [x] 删除、排序按钮
  - [x] "添加标签页组"按钮
- [x] 独立标签页区域：
  - [x] 显示已添加的独立标签页
  - [x] "固定标签页"复选框
  - [x] 删除按钮
  - [x] "添加标签页"按钮
- [x] 保存和取消按钮

##### 8.3.3 CollectionSelector组件
- [x] 创建 `CollectionSelector.vue`
- [x] 显示所有现有标签页组
- [x] 支持多选
- [x] 显示组的基本信息（名称、颜色、标签页数）
- [x] 确认选择按钮

#### 8.4 窗口模板操作功能

##### 8.4.1 创建窗口模板
- [x] 从当前窗口创建：
  - [x] 获取当前窗口所有标签页和Tab Groups
  - [x] 自动组织成模板结构
  - [x] 区分已分组和未分组标签页
- [x] 手动创建：
  - [x] 创建空白模板
  - [x] 从标签页组列表选择
  - [x] 手动添加独立标签页
- [x] 保存到Storage

##### 8.4.2 编辑窗口模板
- [x] 修改模板名称和描述
- [x] 添加/删除标签页组（引用或快照）
- [x] 添加/删除独立标签页
- [x] 拖拽调整顺序
- [x] 切换"创建Tab Group"选项
- [x] 切换引用/快照模式（"锁定版本"）
- [x] 保存更新

##### 8.4.3 打开窗口模板
- [x] 创建新窗口 `chrome.windows.create()`
- [x] 遍历所有标签页组：
  - [x] 如果是引用模式，从collectionsStore获取最新数据
  - [x] 如果是快照模式，使用保存的数据
  - [x] 批量创建标签页
  - [x] 如果配置了createGroup，创建Chrome Tab Group
  - [x] 设置组颜色和名称
- [x] 创建独立标签页
- [x] 处理固定标签页（pin）
- [ ] 显示打开进度

##### 8.4.4 复制窗口模板
- [x] 克隆模板数据
- [x] 生成新ID和时间戳
- [x] 名称后缀"(副本)"
- [x] 保存新模板

##### 8.4.5 删除窗口模板
- [x] 确认对话框
- [x] 从templates数组移除
- [x] 更新Storage
- [x] 成功提示

---

### 9. 基础拖拽功能

#### 9.1 拖拽基础架构

##### 9.1.1 DraggableTab组件
- [x] 创建 `DraggableTab.vue`
- [x] 支持 `draggable` 属性
- [x] 实现拖拽事件：
  - [x] `@dragstart` - 设置拖拽数据
  - [x] `@dragend` - 清理拖拽状态
- [x] 拖拽时显示半透明效果
- [x] 传递标签页数据到dataTransfer

##### 9.1.2 DropZone组件
- [x] 创建 `DropZone.vue`
- [x] 接收拖拽目标类型（collection/template）
- [x] 实现放置事件：
  - [x] `@dragover.prevent` - 允许放置
  - [x] `@dragleave` - 移除高亮
  - [x] `@drop` - 处理放置
- [x] 拖拽悬停时显示高亮边框（绿色）
- [x] 无效目标显示禁止图标

##### 9.1.3 DragPreview组件
- [x] 创建 `DragPreview.vue`
- [x] 显示拖拽预览
- [x] 显示拖拽的标签页信息
- [x] 多选时显示数量徽章

#### 9.2 拖拽场景实现

##### 9.2.1 会话标签页 → 标签页组
- [x] 在SessionCard中的TabItem添加draggable
- [x] 在CollectionCard添加DropZone
- [x] 拖拽逻辑：
  - [x] 获取源标签页数据
  - [x] 调用 `collectionsStore.addTab()`
  - [x] 根据设置决定是否从会话移除
  - [x] 更新Storage
  - [x] 显示成功Toast

##### 9.2.2 会话标签页 → 窗口模板
- [x] 在TemplateCard添加DropZone
- [x] 拖拽逻辑：
  - [x] 添加到模板的standaloneTabs数组
  - [x] 调用 `templatesStore.updateTemplate()`
  - [x] 根据设置决定是否从会话移除
  - [x] 更新Storage
  - [x] 显示成功Toast

#### 9.3 拖拽设置
- [x] 在Settings.vue添加拖拽设置部分
- [x] 设置项：
  - [x] 启用拖拽功能（默认：开启）
  - [x] 拖拽后从源列表移除标签页（默认：关闭）
  - [x] 拖拽时显示预览（默认：开启）
- [x] 在settingsStore添加对应状态

#### 9.4 拖拽视觉反馈
- [x] 拖拽开始：源元素半透明
- [x] 拖拽进行：
  - [x] 有效目标显示绿色边框
  - [x] 无效目标显示禁止图标
  - [x] 显示拖拽游标
- [x] 拖拽成功：
  - [x] 目标区域显示淡入动画
  - [x] Toast提示"已添加到xxx"
- [ ] 拖拽失败：
  - [ ] 震动动画
  - [ ] Toast提示错误原因

---

## 🔧 P2 - 优化功能

### 10. 高级拖拽功能

#### 10.1 批量拖拽
- [ ] 支持Ctrl/Cmd多选标签页
- [ ] 支持Shift连续选择
- [ ] 多选状态视觉标识（复选框或背景色）
- [ ] 拖拽时显示"N个标签页"徽章
- [ ] 批量添加到目标
- [ ] 保持标签页顺序

#### 10.2 会话标签页组 → 窗口模板
- [ ] 在SessionCard的TabGroup组件添加draggable
- [ ] 拖拽整个标签页组（包含所有标签页）
- [ ] 保留组名称、颜色
- [ ] 添加到模板的collections数组（快照模式）
- [ ] 自动设置createGroup=true

#### 10.3 标签页组管理 → 窗口模板（引用模式）
- [ ] 在CollectionCard添加draggable
- [ ] 拖拽到TemplateCard的DropZone
- [ ] 建立引用关系：
  - [ ] 保存collectionId
  - [ ] 设置isReference=true
  - [ ] 显示引用图标
- [ ] 引用模式自动同步：
  - [ ] 标签页组更新时，模板自动获取最新数据
  - [ ] 在模板编辑界面显示"最新版本"提示
- [ ] 支持切换为快照模式（"锁定版本"按钮）

#### 10.4 跨区域拖拽
- [ ] 标签页组A → 标签页组B（标签页移动/复制）
- [ ] 标签页组内标签页 → 窗口模板（提取为独立标签）
- [ ] 窗口模板内的标签页组 → 标签页组管理（可选）

#### 10.5 拖拽操作撤销
- [ ] 记录最近一次拖拽操作
- [ ] 提供"撤销"按钮（Toast中）
- [ ] 恢复到拖拽前的状态
- [ ] 3秒后自动消失

#### 10.6 拖拽中断处理
- [ ] 按ESC键取消拖拽
- [ ] 拖出窗口外自动取消
- [ ] 拖拽中断时恢复原状态
- [ ] 无错误提示（静默处理）

---

### 11. 搜索功能

#### 11.1 全局搜索框
- [x] 创建 `SearchBar.vue` 组件
- [x] 放置在AppHeader顶部导航栏
- [x] 输入框样式和占位符
- [x] 实时搜索（防抖300ms）

#### 11.2 搜索逻辑实现
- [x] 搜索范围：
  - [x] 会话中的标签页（标题、URL）
  - [x] 标签页组（组名、标签页标题、URL）
  - [x] 窗口模板（模板名、描述）
- [x] 搜索算法：
  - [x] 模糊匹配
  - [ ] 支持中文拼音搜索（可选）
  - [x] 关键词高亮显示
- [x] 搜索结果展示：
  - [x] 按类型分组显示
  - [x] 点击结果跳转到对应位置
  - [ ] 显示匹配度排序

#### 11.3 搜索过滤器（可选）
- [ ] 按类型过滤（会话/标签页组/模板）
- [ ] 按时间范围过滤
- [ ] 按标签页组颜色过滤

---

### 12. 数据导入导出

#### 12.1 导出功能
- [x] 在Settings页面添加"导出数据"按钮
- [x] 导出格式：JSON
- [x] 导出内容：
  - [x] 所有会话
  - [x] 所有标签页组
  - [x] 所有窗口模板
  - [x] 用户设置
- [x] 生成文件名：`onetabs-backup-YYYYMMDD.json`
- [x] 使用浏览器下载API

#### 12.2 导入功能
- [x] 在Settings页面添加"导入数据"按钮
- [x] 文件选择器（accept=".json"）
- [x] 数据验证：
  - [x] 检查JSON格式
  - [x] 验证数据结构
  - [ ] 处理版本兼容性
- [ ] 导入策略选择：
  - [x] 覆盖现有数据
  - [ ] 合并数据（保留现有+导入新的）
- [ ] 显示导入结果统计

#### 12.3 数据迁移（可选）
- [ ] 支持从OneTab导入
- [ ] 支持从其他标签管理器导入
- [ ] 数据格式转换

---

### 13. 右键菜单增强

#### 13.1 上下文菜单组件
- [x] 创建 `ContextMenu.vue` 组件
- [x] 支持右键触发
- [x] 菜单项配置化
- [x] 位置自动计算（避免超出视口）

#### 13.2 会话标签页右键菜单
- [x] 打开
- [x] 复制URL
- [x] 添加到标签页组
- [x] 添加到窗口模板
- [x] 删除

#### 13.3 标签页组右键菜单
- [x] 打开（新窗口/当前窗口）
- [x] 编辑
- [x] 复制
- [x] 添加到窗口模板
- [x] 删除

#### 13.4 窗口模板右键菜单
- [x] 打开
- [x] 编辑
- [x] 复制
- [ ] 导出为JSON
- [x] 删除

---

### 14. 快捷键支持

#### 14.1 快捷键配置
- [x] 配置快捷键系统（shortcuts.js）
- [x] 常用快捷键：
  - [x] `Ctrl/Cmd+Shift+S` - 快速保存当前窗口
  - [x] `Ctrl/Cmd+Shift+O` - 打开扩展页面
  - [x] `Ctrl/Cmd+F` - 聚焦搜索框
  - [x] `ESC` - 关闭弹窗/取消操作
  - [x] `Ctrl/Cmd+1/2/3` - 切换Tab标签
  - [x] `Ctrl/Cmd+,` - 打开设置

#### 14.2 快捷键提示
- [ ] 在相关按钮上显示快捷键提示
- [x] 添加快捷键帮助页面（ShortcutsHelp.vue）

---

### 15. 性能优化

#### 15.1 虚拟滚动
- [ ] 当会话/标签页组数量 > 50 时启用
- [ ] 使用 vue-virtual-scroller 或自实现
- [ ] 只渲染可见区域的DOM
- [ ] 减少内存占用

#### 15.2 图标缓存
- [ ] 缓存favicon到本地
- [ ] 使用IndexedDB或chrome.storage
- [ ] 避免重复请求
- [x] 默认图标fallback

#### 15.3 懒加载
- [x] 会话内容默认折叠，点击展开时才渲染
- [x] 标签页组同理
- [x] 减少首屏渲染时间

#### 15.4 防抖和节流
- [x] 搜索输入防抖（300ms）
- [ ] 拖拽事件节流
- [ ] 窗口大小变化节流

---

### 16. UI/UX优化

#### 16.1 动画效果
- [x] 列表项添加/删除的过渡动画
- [x] 展开/折叠的过渡动画
- [x] 拖拽的视觉反馈动画
- [x] Toast提示的淡入淡出

#### 16.2 响应式设计
- [x] 适配不同窗口宽度
- [x] 侧边栏可折叠（拖拽手柄实现）
- [x] 卡片式布局自适应

#### 16.3 无障碍支持
- [ ] 键盘导航（Tab键）
- [ ] ARIA标签
- [ ] 高对比度模式支持

#### 16.4 空状态设计
- [x] 无会话时的友好提示
- [x] 无标签页组时的引导
- [ ] 首次使用的新手引导

---

### 17. 错误处理与日志

#### 17.1 错误处理
- [x] 全局错误捕获
- [x] Chrome API调用失败处理
- [x] Storage读写失败处理
- [x] 网络错误处理（favicon加载失败）

#### 17.2 错误提示
- [x] 友好的错误提示信息
- [ ] 提供解决建议
- [x] 避免技术术语

#### 17.3 日志系统（可选）
- [x] 记录关键操作日志
- [x] 记录错误日志
- [x] 在设置页面查看日志
- [x] 支持导出日志用于调试

---

## 🌟 P3 - 未来规划

### 18. 主题自定义

#### 18.1 主题切换
- [x] 亮色主题（默认）
- [x] 暗色主题
- [x] 跟随系统
- [ ] 自动切换（时间段）

#### 18.2 自定义颜色
- [ ] 主题色选择器
- [ ] 预设配色方案
- [ ] 导入/导出主题配置

---

### 19. 云同步（V3.0）

#### 19.1 账号系统
- [ ] 用户注册/登录
- [ ] OAuth第三方登录
- [ ] 账号管理

#### 19.2 数据同步
- [ ] 使用chrome.storage.sync
- [ ] 或自建服务器同步
- [ ] 冲突解决策略
- [ ] 增量同步
- [ ] 离线缓存

#### 19.3 跨设备支持
- [ ] 多设备数据同步
- [ ] 设备管理
- [ ] 选择性同步

---

### 20. 团队协作（V3.0）

#### 20.1 共享功能
- [ ] 标签页组共享
- [ ] 窗口模板共享
- [ ] 分享链接生成

#### 20.2 团队工作空间
- [ ] 创建团队
- [ ] 邀请成员
- [ ] 权限管理
- [ ] 协作编辑

---

### 21. AI智能功能（V3.1）

#### 21.1 智能分组
- [ ] 自动分析标签页内容
- [ ] 智能分类建议
- [ ] 自动生成组名

#### 21.2 智能推荐
- [ ] 根据使用习惯推荐标签页组
- [ ] 工作场景识别
- [ ] 相关标签页推荐

#### 21.3 重复检测
- [ ] 检测重复标签页
- [ ] 一键清理重复项
- [ ] 合并建议

---

### 22. 统计分析

#### 22.1 使用统计
- [ ] 标签页保存次数
- [ ] 最常用的标签页组
- [ ] 使用时长统计
- [ ] 数据可视化图表

#### 22.2 数据报告
- [ ] 每周/每月使用报告
- [ ] 效率提升统计
- [ ] 导出报告

---

## 📝 开发规范

### 代码规范
- [ ] 使用ESLint + Prettier
- [ ] 遵循Vue3组合式API最佳实践
- [ ] 组件命名规范
- [ ] 使用TypeScript（可选）

### 提交规范
- [ ] 使用约定式提交（Conventional Commits）
- [ ] feat: 新功能
- [ ] fix: 修复bug
- [ ] docs: 文档更新
- [ ] style: 代码格式
- [ ] refactor: 重构
- [ ] test: 测试
- [ ] chore: 构建/工具

### 测试
- [ ] 单元测试（Vitest）
- [ ] E2E测试（Playwright）
- [ ] 测试覆盖率 > 80%

---

## 🎯 里程碑检查点

### Milestone 1: MVP发布 (P0完成) ✅
- [x] 会话收纳功能完整可用
- [x] 基础UI和导航
- [x] 设置功能
- [x] 通过基本功能测试
- [x] 可在Chrome中加载运行

### Milestone 2: 核心功能完成 (P0+P1) ✅
- [x] 标签页组管理完整
- [x] 窗口模板管理完整
- [x] 基础拖拽功能
- [x] 通过完整功能测试
- [x] 性能达标

### Milestone 3: 正式版本发布 (P0+P1+P2核心) 🚧
- [ ] 高级拖拽功能
- [x] 搜索功能
- [x] 数据导入导出
- [ ] 性能优化完成
- [ ] 通过完整测试（27个测试用例）
- [ ] 准备发布到Chrome Web Store

### Milestone 4: 持续优化 (P2全部+P3)
- [ ] 所有P2功能完成
- [ ] 用户反馈收集
- [ ] 迭代优化
- [ ] 规划V3.0功能

---

## 📅 预估时间线

| 阶段 | 功能范围 | 预估时间 | 状态 |
|-----|---------|---------|------|
| Sprint 1 | P0核心功能 | 2-3周 | ✅ 已完成 |
| Sprint 2 | P1标签页组管理 | 2周 | ✅ 已完成 |
| Sprint 3 | P1窗口模板+基础拖拽 | 2-3周 | ✅ 已完成 |
| Sprint 4 | P2优化+测试 | 1-2周 | 🚧 进行中 |
| **总计** | **MVP到正式版** | **7-10周** | |

---

## 🔄 更新日志

### 2026-01-26
- 更新开发进度：P0、P1功能已全部完成
- Milestone 1 & 2 已达成
- 正在进行 P2 优化功能开发
- 已完成：搜索、右键菜单、快捷键、主题切换、数据导入导出、错误日志等
