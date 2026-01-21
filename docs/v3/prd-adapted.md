# OneTabs - 书签管理系统 产品需求文档 (PRD)

## 1. 项目概述

### 1.1 项目名称

OneTabs - Chrome新标签页扩展（书签管理模块）

### 1.2 项目描述

一个功能完善的Chrome新标签页扩展程序，本文档专注于**书签管理系统**的产品需求。该系统与已实现的标签页管理系统（会话、收藏集、模板、标签分组）共同构成完整的浏览器导航与管理解决方案。

书签管理系统支持三级分类结构来组织书签、Chrome书签导入、固定链接栏、书签搜索等功能，并与标签页管理系统共享统一的设置页面和主题系统。

### 1.3 核心价值

**书签管理系统（本文档重点）**：
- 提供清晰的三级分类结构来组织大量书签
- 支持从Chrome浏览器一键导入现有书签（HTML文件 + chrome.bookmarks API）
- 提供固定链接栏功能，快速访问常用网站
- 完善的书签数据管理：备份、恢复、导入导出
- 书签全文搜索、标签过滤、智能推荐
- 书签与标签页系统互通：可将书签转换为收藏集/模板

**已实现的标签页管理系统（背景）**：
- ✅ 会话管理（Session）：保存和恢复标签页快照
- ✅ 收藏集管理（Collection）：手动整理标签页集合
- ✅ 模板系统（Template）：快速恢复工作场景
- ✅ 标签分组（Tab Groups）：Chrome原生分组集成

**统一特性（共用模块）**：
- 暗色/亮色主题支持，跟随系统自动切换（已实现）
- 统一的设置页面：包含书签和标签页管理的所有配置项
- 完善的数据管理：备份、恢复、导入导出
- 右键菜单系统：全局单例模式（已实现）

---

## 2. 技术栈

### 2.1 前端框架

- **Vue 3.3.4** (Composition API with script setup)
- **Vue Router 4.5.0** (路由管理，Hash模式)
- **Pinia 2.1.0** (状态管理)
- **PrimeVue 4.3.3** (UI组件库：Dialog, Toast, ConfirmDialog等)
- **Tailwind CSS 4.1.5** (@tailwindcss/vite 样式框架)
- **PrimeIcons 7.0.0** (图标库)

### 2.2 构建工具

- **Vite 6.3.4** (开发服务器和构建工具)
- **@vitejs/plugin-vue 5.0.0** (Vue 3 SFC支持)
- **unplugin-vue-components 28.5.0** (PrimeVue组件自动导入)
- **@primevue/auto-import-resolver 4.3.3** (自动导入解析器)
- **archiver 5.3.1** (扩展打包工具)

### 2.3 代码质量工具

- **ESLint 9.25.1** (代码检查)
- **Prettier 3.5.3** (代码格式化)
- **eslint-plugin-vue 10.1.0** (Vue专用规则)
- **sass-embedded 1.93.2** (SCSS支持)

### 2.4 数据存储

- **chrome.storage.local** (Chrome扩展本地存储，主要存储)
- **chrome.storage.sync** (跨设备同步，可选)
- **JSON文件** (数据导入导出格式)
- **DOMParser** (解析Chrome书签HTML)

### 2.5 Chrome Extension APIs

- **chrome.tabs** (标签页操作)
- **chrome.tabGroups** (标签分组管理)
- **chrome.storage** (数据持久化)
- **chrome.action** (扩展图标点击)
- **chrome.bookmarks** (书签API，可选)

---

## 3. 数据结构设计

### 3.1 书签数据结构 (Bookmarks) - 核心

```json
{
  "bookmarks": [
    {
      "id": "cat-1",
      "name": "一级分类名称",
      "icon": "pi-folder",
      "color": "#3b82f6",
      "children": [
        {
          "id": "cat-1-1",
          "name": "二级分类名称",
          "icon": "pi-folder-open",
          "children": [
            {
              "id": "cat-1-1-1",
              "name": "三级分类名称",
              "bookmarks": [
                {
                  "id": "bookmark-1",
                  "name": "网站名称",
                  "url": "https://example.com",
                  "description": "网站描述（可选）",
                  "favIconUrl": "https://example.com/favicon.ico",
                  "tags": ["开发", "工具"],
                  "sourceGroup": "Chrome导入",
                  "createdAt": 1737446400000,
                  "visitCount": 0
                }
              ]
            }
          ],
          "bookmarks": []
        }
      ]
    }
  ],
  "pinnedBookmarks": [
    {
      "id": "bookmark-1",
      "name": "固定的网站",
      "url": "https://example.com",
      "favIconUrl": "https://example.com/favicon.ico"
    }
  ]
}
```

### 3.2 标签页系统数据结构（已实现，仅供参考）

**会话 (Sessions)**、**收藏集 (Collections)**、**模板 (Templates)** 的数据结构已在现有系统中实现，详见相应Store文件。这些数据结构与书签系统保持独立，但通过转换功能可以互通。

### 3.3 书签数据字段说明

#### 书签分类对象 (BookmarkCategory)

| 字段      | 类型   | 必填 | 说明                             |
| --------- | ------ | ---- | -------------------------------- |
| id        | String | 是   | 唯一标识符，建议使用时间戳       |
| name      | String | 是   | 分类名称                         |
| icon      | String | 否   | PrimeIcons图标类名               |
| color     | String | 否   | 分类颜色标识                     |
| children  | Array  | 否   | 子分类数组                       |
| bookmarks | Array  | 否   | 书签数组（二级或三级分类可包含） |

#### 书签对象 (Bookmark)

| 字段        | 类型   | 必填 | 说明                 |
| ----------- | ------ | ---- | -------------------- |
| id          | String | 是   | 唯一标识符           |
| name        | String | 是   | 书签名称             |
| url         | String | 是   | 网址链接             |
| description | String | 否   | 书签描述             |
| favIconUrl  | String | 否   | 网站图标URL          |
| tags        | Array  | 否   | 标签数组             |
| sourceGroup | String | 否   | 来源分组标识         |
| createdAt   | Number | 否   | 创建时间戳           |
| visitCount  | Number | 否   | 访问次数（统计用）   |

---

## 4. 功能需求详细说明

### 4.1 书签管理系统（本文档重点）

#### 4.1.1 主界面导航 (MainView)

**功能描述**：
提供统一的新标签页入口，用户可以快速访问书签导航和标签页管理（已实现）两大功能模块。

**路由结构**：

- `/` 或 `/bookmarks` - 书签导航系统（默认页面）
- `/sessions` - 会话管理（已实现）
- `/collections` - 收藏集管理（已实现）
- `/templates` - 模板管理（已实现）
- `/groups` - 标签分组管理（已实现）
- `/settings` - 设置页面（共用模块）

#### 4.1.2 书签浏览导航 (BookmarksView)

**功能描述**：
提供三级导航结构，用户可以浏览和访问书签。作为新标签页的主要展示内容。

**UI布局**：

```
┌─────────────────────────────────────────────┐
│          固定链接栏 (横向滚动)              │
├─────────────────────────────────────────────┤
│  [一级1] [一级2] [一级3] [一级4] ...       │
├──────────┬──────────────────────────────────┤
│二级分类  │                                  │
│侧边栏    │     书签卡片网格展示区           │
│          │                                  │
│ • 二级1  │  ┌──────┐ ┌──────┐ ┌──────┐    │
│ • 二级2  │  │书签1 │ │书签2 │ │书签3 │    │
│ • 二级3  │  └──────┘ └──────┘ └──────┘    │
│          │                                  │
│  › 三级1 │  ┌──────┐ ┌──────┐              │
│  › 三级2 │  │书签4 │ │书签5 │              │
│          │  └──────┘ └──────┘              │
└──────────┴──────────────────────────────────┘
```

**交互行为**：

1. 点击一级分类标签，切换到对应分类
2. 点击二级分类，显示该分类下的书签
3. 点击三级分类，显示三级分类下的书签
4. 点击书签卡片，在新标签页打开对应网址
5. 点击书签上的📌图标，固定/取消固定书签
6. 右键菜单：编辑、删除、添加到收藏集、转换为模板等操作

**状态管理**：

使用 **bookmarksStore** (新增)：

```javascript
状态(state):
  - bookmarks: []              // 主书签数据数组
  - pinnedBookmarks: []        // 固定的书签数组
  - currentFirstLevel: null    // 当前选中的一级分类
  - currentSecondLevel: null   // 当前选中的二级分类
  - currentThirdLevel: null    // 当前选中的三级分类

计算属性(getters):
  - getFirstLevelCategories    // 返回所有一级分类
  - getSecondLevelCategories(firstLevelId) // 返回指定一级分类下的二级分类
  - getBookmarks(path)         // 返回指定分类路径下的书签
  - getPinnedBookmarks         // 返回所有固定书签
  - searchBookmarks(keyword)   // 搜索书签

方法(actions):
  - loadBookmarks()            // 从chrome.storage加载
  - saveBookmarks()            // 保存到chrome.storage
  - addCategory(level, category) // 添加分类
  - updateCategory(id, updates) // 更新分类
  - deleteCategory(id)         // 删除分类
  - addBookmark(categoryPath, bookmark) // 添加书签
  - updateBookmark(id, updates) // 更新书签
  - deleteBookmark(id)         // 删除书签
  - pinBookmark(bookmark)      // 固定书签
  - unpinBookmark(id)          // 取消固定
```

#### 4.1.3 书签管理功能

**主要功能**：

##### A. 分类管理

- **添加分类**：
  - 一级分类：在标签栏末尾显示"+"按钮
  - 二级分类：在侧边栏标题处显示"+"按钮
  - 三级分类：在二级分类下显示"+"按钮
  - 使用PrimeVue Dialog组件弹出表单
  - 表单字段：名称、图标（PrimeIcons选择器）、颜色

- **编辑分类**：
  - 点击分类旁的编辑图标
  - Dialog预填充当前信息
  - 确认后更新分类

- **删除分类**：
  - 点击分类旁的删除图标
  - 使用PrimeVue ConfirmDialog确认
  - 确认后删除分类及其下所有子分类和书签

##### B. 书签管理

- **添加书签**：
  - 选择目标分类后，点击"添加书签"按钮
  - Dialog表单：名称、URL、描述、标签
  - 自动获取favIconUrl
  - 验证URL格式
  - 保存到对应分类

- **编辑书签**：
  - 点击书签卡片上的编辑图标
  - Dialog预填充当前信息
  - 支持修改所有字段
  - 确认后更新书签

- **删除书签**：
  - 点击书签卡片上的删除图标
  - ConfirmDialog确认后删除

- **批量操作**：
  - 多选模式：选择多个书签
  - 批量删除、批量移动到其他分类
  - 批量添加到收藏集/模板

##### C. 固定书签管理

- 显示所有已固定的书签列表（横向滚动栏）
- 提供取消固定功能
- 显示网站图标和名称
- 点击直接在新标签页打开
- 支持拖拽排序

**UI组件**：

- `BookmarkCard.vue` - 书签卡片组件（新增）
- `BookmarksView.vue` - 书签浏览页面（新增）
- `CategoryManager.vue` - 分类管理组件（新增）
- `PinnedBookmarksBar.vue` - 固定书签栏组件（新增）
- `BookmarkDialog.vue` - 书签编辑对话框（新增）

#### 4.1.4 Chrome书签导入

**功能描述**：
支持导入Chrome浏览器导出的HTML格式书签文件，或直接使用chrome.bookmarks API读取。

**导入方式一：HTML文件导入**

```
导入流程：
  1. 用户点击"导入书签"按钮
  2. 显示导入Dialog（PrimeVue Dialog）
  3. 提供操作指引和文件选择
  4. 选择导入模式：
     - 合并模式：保留现有书签，追加新书签
     - 替换模式：清空现有书签，导入新书签
  5. 点击"导入"，开始解析和导入
  6. 显示进度条（PrimeVue ProgressBar）
  7. 显示导入结果（Toast提示）
```

**导入方式二：chrome.bookmarks API**

```javascript
// 使用Chrome原生API直接读取书签
async function importFromChromeBookmarks() {
  const tree = await chrome.bookmarks.getTree()
  const bookmarks = parseBookmarkTree(tree[0])
  // 转换为本系统的数据结构
  return convertToOurFormat(bookmarks)
}
```

**解析算法**：详见工具函数库 → bookmarkImporter.js

**UI组件**：

- `ImportBookmarks.vue` - 书签导入组件（新增）
- 使用PrimeVue: Dialog, ProgressBar, FileUpload, Toast

#### 4.1.5 书签搜索和过滤

**功能描述**：
全局搜索书签名称、URL、描述、标签。

**搜索范围**：
- 书签名称
- 书签URL
- 书签描述
- 书签标签

**UI实现**：
- 顶部搜索框（PrimeVue InputText + Icon）
- 实时搜索（防抖500ms）
- 搜索结果分类显示
- 高亮匹配关键词

**过滤功能**：
- 按标签过滤
- 按日期范围过滤
- 按访问次数排序
- 按来源分组过滤（Chrome导入、手动添加等）

#### 4.1.6 书签与标签页系统互通

**功能描述**：
书签可以与已实现的标签页管理系统进行数据转换。

**转换功能**：

1. **书签 → 收藏集**：
   - 右键菜单选择"添加到收藏集"
   - 选择目标收藏集或创建新收藏集
   - 书签的URL和名称转换为标签页格式

2. **书签 → 模板**：
   - 右键菜单选择"创建为模板"
   - 将选中的多个书签转换为模板
   - 可快速打开所有书签

3. **书签分类 → 收藏集/模板**：
   - 右键点击分类
   - 选择"转换为收藏集"或"转换为模板"
   - 该分类下所有书签批量转换

4. **会话/收藏集/模板 → 书签**（已在标签页系统实现）：
   - 右键菜单选择"保存为书签"
   - 选择目标书签分类
   - 标签页批量转换为书签

---

### 4.2 设置页面（共用模块）

#### 4.2.1 功能描述

设置页面为书签管理和标签页管理系统共用，包含两个模块的所有配置项、数据管理、主题切换、错误日志等功能。

#### 4.2.2 主要功能

##### A. 主题设置（已实现）

- **亮色主题**：默认亮色模式
- **暗色主题**：深色背景模式
- **跟随系统**：自动检测系统主题偏好

使用 **themeStore.js**（已实现）

##### B. 书签系统设置（新增）

```
配置项：
  - 书签默认视图：网格视图 / 列表视图
  - 固定栏最大显示数量：5 / 10 / 15 / 20
  - 书签图标获取方式：Google Favicon / 本地缓存
  - 是否显示书签描述：开启 / 关闭
  - 是否显示访问次数：开启 / 关闭
  - 新建书签默认分类：选择默认分类
  - 书签排序方式：按名称 / 按创建时间 / 按访问次数 / 手动排序
```

##### C. 标签页系统设置（已实现）

```
配置项：
  - 保存会话时是否关闭标签页
  - 恢复会话时是否创建新窗口
  - 是否启用拖拽排序
  - 数据保留天数
```

##### D. 数据管理（共用）

- **备份数据**：备份书签和标签页系统所有数据到chrome.storage
- **恢复数据**：从备份恢复
- **导出JSON**：下载所有数据为JSON文件（包括书签、会话、收藏集、模板）
- **导入JSON**：从JSON文件导入数据（自动识别数据类型）
- **清空数据**：
  - 仅清空书签数据
  - 仅清空标签页数据
  - 清空所有数据（ConfirmDialog二次确认）
- **数据诊断**：
  - 显示书签总数、分类数、固定书签数
  - 显示会话数、收藏集数、模板数
  - 显示存储空间使用情况
  - 检查数据完整性

##### E. 错误日志（共用，已实现）

- **日志查看**：显示应用错误日志
- **日志级别**：ERROR, WARNING, INFO
- **日志来源**：区分书签系统和标签页系统的日志
- **日志导出**：下载日志文件
- **清空日志**：删除所有日志

**UI组件**：

- `Settings.vue` - 设置页面（已实现，需扩展书签设置项）
- 使用PrimeVue: Button, InputNumber, InputSwitch, Dropdown, etc.

**状态管理**：

使用 **settingsStore.js**（已实现，需扩展书签相关配置）

**功能描述**：
提供三级导航结构，用户可以浏览和访问书签。作为新标签页的主要展示内容。

**UI布局**：

```
┌─────────────────────────────────────────────┐
│          固定链接栏 (横向滚动)              │
├─────────────────────────────────────────────┤
│  [一级1] [一级2] [一级3] [一级4] ...       │
├──────────┬──────────────────────────────────┤
│二级分类  │                                  │
│侧边栏    │     书签卡片网格展示区           │
│          │                                  │
│ • 二级1  │  ┌──────┐ ┌──────┐ ┌──────┐    │
│ • 二级2  │  │书签1 │ │书签2 │ │书签3 │    │
│ • 二级3  │  └──────┘ └──────┘ └──────┘    │
│          │                                  │
│  › 三级1 │  ┌──────┐ ┌──────┐              │
│  › 三级2 │  │书签4 │ │书签5 │              │
│          │  └──────┘ └──────┘              │
└──────────┴──────────────────────────────────┘
```

**交互行为**：

1. 点击一级分类标签，切换到对应分类
2. 点击二级分类，显示该分类下的书签
3. 点击三级分类，显示三级分类下的书签
4. 点击书签卡片，在新标签页打开对应网址
5. 点击书签上的📌图标，固定/取消固定书签
6. 右键菜单：编辑、删除、添加到收藏集等操作

**状态管理**：

使用 **bookmarksStore** (新增)：

```javascript
状态(state):
  - bookmarks: []              // 主书签数据数组
  - pinnedBookmarks: []        // 固定的书签数组
  - currentFirstLevel: null    // 当前选中的一级分类
  - currentSecondLevel: null   // 当前选中的二级分类
  - currentThirdLevel: null    // 当前选中的三级分类

计算属性(getters):
  - getFirstLevelCategories    // 返回所有一级分类
  - getSecondLevelCategories(firstLevelId) // 返回指定一级分类下的二级分类
  - getBookmarks(path)         // 返回指定分类路径下的书签
  - getPinnedBookmarks         // 返回所有固定书签
  - searchBookmarks(keyword)   // 搜索书签

方法(actions):
  - loadBookmarks()            // 从chrome.storage加载
  - saveBookmarks()            // 保存到chrome.storage
  - addCategory(level, category) // 添加分类
  - updateCategory(id, updates) // 更新分类
  - deleteCategory(id)         // 删除分类
  - addBookmark(categoryPath, bookmark) // 添加书签
  - updateBookmark(id, updates) // 更新书签
  - deleteBookmark(id)         // 删除书签
  - pinBookmark(bookmark)      // 固定书签
  - unpinBookmark(id)          // 取消固定
```

#### 4.2.2 书签管理功能 (Bookmarks Management)

**功能描述**：
提供完整的书签CRUD（创建、读取、更新、删除）功能。

**主要功能**：

##### A. 分类管理

- **添加分类**：

  - 一级分类：在标签栏末尾显示"+"按钮
  - 二级分类：在侧边栏标题处显示"+"按钮
  - 三级分类：在二级分类下显示"+"按钮
  - 使用PrimeVue Dialog组件弹出表单
  - 表单字段：名称、图标（PrimeIcons选择器）、颜色

- **编辑分类**：

  - 点击分类旁的编辑图标
  - Dialog预填充当前信息
  - 确认后更新分类

- **删除分类**：
  - 点击分类旁的删除图标
  - 使用PrimeVue ConfirmDialog确认
  - 确认后删除分类及其下所有子分类和书签

##### B. 书签管理

- **添加书签**：

  - 选择目标分类后，点击"添加书签"按钮
  - Dialog表单：名称、URL、描述、标签
  - 自动获取favIconUrl
  - 验证URL格式
  - 保存到对应分类

- **编辑书签**：

  - 点击书签卡片上的编辑图标
  - Dialog预填充当前信息
  - 支持修改所有字段
  - 确认后更新书签

- **删除书签**：

  - 点击书签卡片上的删除图标
  - ConfirmDialog确认后删除

- **批量操作**：
  - 多选模式：选择多个书签
  - 批量删除、批量移动到其他分类
  - 批量添加到收藏集

##### C. 固定书签管理

- 显示所有已固定的书签列表（横向滚动栏）
- 提供取消固定功能
- 显示网站图标和名称
- 点击直接在新标签页打开

**UI组件**：

- `BookmarkCard.vue` - 书签卡片组件
- `BookmarksView.vue` - 书签浏览页面
- `CategoryManager.vue` - 分类管理组件
- `PinnedBookmarksBar.vue` - 固定书签栏组件

#### 4.2.3 Chrome书签导入

**功能描述**：
支持导入Chrome浏览器导出的HTML格式书签文件，或直接使用chrome.bookmarks API读取。

**导入方式一：HTML文件导入**

```
导入流程：
  1. 用户点击"导入书签"按钮
  2. 显示导入Dialog（PrimeVue Dialog）
  3. 提供操作指引和文件选择
  4. 选择导入模式：
     - 合并模式：保留现有书签，追加新书签
     - 替换模式：清空现有书签，导入新书签
  5. 点击"导入"，开始解析和导入
  6. 显示进度条（PrimeVue ProgressBar）
  7. 显示导入结果（Toast提示）
```

**导入方式二：chrome.bookmarks API**

```javascript
// 使用Chrome原生API直接读取书签
async function importFromChromeBookmarks() {
  const tree = await chrome.bookmarks.getTree()
  const bookmarks = parseBookmarkTree(tree[0])
  // 转换为本系统的数据结构
  return convertToOurFormat(bookmarks)
}
```

**Chrome书签HTML格式**：

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>书签栏</H3>
    <DL><p>
        <DT><H3>分类1</H3>
        <DL><p>
            <DT><A HREF="https://example.com" ADD_DATE="1234567890" ICON="data:image/png;base64,...">网站名称</A>
        </DL><p>
    </DL><p>
</DL><p>
```

**解析算法**：

```javascript
函数: parseGoogleBookmarks(htmlContent)
  步骤1: 使用DOMParser解析HTML文本
  步骤2: 查找所有<DL>标签（代表文件夹）
  步骤3: 递归遍历文件夹结构
    - 识别<H3>标签为文件夹名称
    - 识别<A>标签为书签链接
    - 提取ADD_DATE作为createdAt
    - 提取ICON作为favIconUrl
    - 根据层级判断是一/二/三级分类
  步骤4: 提取书签信息（名称、URL、图标、日期）
  步骤5: 构建标准的三级分类JSON结构
  步骤6: 返回解析后的书签数据
```

**UI组件**：

- `ImportBookmarks.vue` - 书签导入组件
- 使用PrimeVue: Dialog, ProgressBar, FileUpload, Toast

---

#### 4.2.4 书签收藏功能

**功能概述**：
- 用户可以将常用书签标记为"收藏"
- 收藏的书签显示在列表上方的独立"收藏区域"
- 支持快速访问和管理高频使用的书签
- 收藏书签带有⭐图标标识

**交互流程**：

1. **收藏书签**：
   - 方式1：右键点击书签卡片 → 选择"收藏"
   - 方式2：点击书签卡片上的⭐图标（未收藏状态为空心，已收藏为实心）
   - 方式3：在编辑书签对话框中勾选"添加到收藏"
   - Toast提示："已添加到收藏"

2. **取消收藏**：
   - 方式1：右键点击已收藏的书签 → 选择"取消收藏"
   - 方式2：再次点击书签卡片上的⭐图标
   - Toast提示："已从收藏中移除"

3. **收藏区域展示**：
   ```
   ┌────────────────────────────────────────────────┐
   │  ⭐ 收藏的书签 (8)              [收起/展开]      │
   │  ┌─────────┬─────────┬─────────┬─────────┐     │
   │  │ ⭐ 书签1│ ⭐ 书签2│ ⭐ 书签3│ ⭐ 书签4│     │
   │  │ 描述    │ 描述    │ 描述    │ 描述    │     │
   │  └─────────┴─────────┴─────────┴─────────┘     │
   │  ┌─────────┬─────────┬─────────┬─────────┐     │
   │  │ ⭐ 书签5│ ⭐ 书签6│ ⭐ 书签7│ ⭐ 书签8│     │
   │  └─────────┴─────────┴─────────┴─────────┘     │
   │  [查看全部收藏]                                 │
   └────────────────────────────────────────────────┘
   ```
   - 位置：固定栏下方，分类列表上方
   - 显示数量：默认显示前8个，支持展开查看全部
   - 排序：支持拖拽排序
   - 折叠：支持收起/展开（状态保存到设置）

4. **收藏区域操作**：
   - 点击书签：在新标签页打开
   - 右键菜单：
     - 在新标签页打开
     - 编辑
     - 取消收藏
     - 添加到收藏集
     - 添加到模板
     - 复制链接
     - 删除
   - 拖拽排序：调整收藏书签的显示顺序

5. **数据持久化**：
   - 收藏状态存储在bookmark对象的favorite字段
   - favoriteBookmarks数组单独维护收藏书签列表
   - 同步保存到chrome.storage.local['onetabs_bookmarks']

**UI组件**：
- `FavoriteBookmarksSection.vue`：收藏区域容器组件
- `FavoriteBookmarkCard.vue`：收藏书签卡片（带⭐图标）
- 使用PrimeVue的Accordion组件实现折叠功能
- 使用Sortable.js实现拖拽排序

**设置选项**（Settings页面 → 书签设置）：
- `showFavoriteSection`: Boolean - 是否显示收藏区域（默认true）
- `favoriteDefaultExpanded`: Boolean - 收藏区域默认展开（默认true）
- `favoriteMaxDisplay`: Number - 收藏区域最大显示数量（默认8，范围4-20）
- `favoriteViewMode`: String - 收藏展示模式（'grid' | 'list'，默认'grid'）

**bookmarksStore扩展**：
```javascript
状态(state):
  - favoriteBookmarks: []      // 收藏的书签数组

计算属性(getters):
  - getFavoriteBookmarks: 返回所有收藏书签
  - getFavoriteBookmarksByCategory(): 按分类分组返回收藏书签

方法(actions):
  - favoriteBookmark(bookmark): 收藏书签
  - unfavoriteBookmark(bookmarkId): 取消收藏
  - reorderFavoriteBookmarks(newOrder): 重新排序收藏书签
```

---

#### 4.2.5 浏览器书签整理与同步

**功能概述**：
- 从Chrome浏览器原生书签系统获取书签
- 在插件中进行整理和分类管理
- 整理完成后同步回Chrome浏览器
- 支持双向同步和冲突处理

**使用场景**：
1. 用户在Chrome中积累了大量无序书签
2. 希望使用OneTabs的三级分类系统整理
3. 整理后将结果同步回Chrome
4. 保持插件与浏览器书签一致性

---

**子功能1：从浏览器获取书签**

**入口**：
- 位置：BookmarksView右上角 → "浏览器同步"按钮
- 图标：使用PrimeIcon的`pi-sync`

**交互流程**：

1. **触发获取**：
   - 点击"浏览器同步"→"从浏览器获取书签"
   - 弹出Dialog："浏览器书签获取"

2. **获取选项**：
   ```
   ┌───────────────────────────────────────────┐
   │  从浏览器获取书签                         │
   │                                           │
   │  📊 检测到浏览器书签数量：256个           │
   │  📁 书签文件夹：18个                      │
   │                                           │
   │  获取模式：                               │
   │  ○ 全部导入                               │
   │  ● 选择文件夹导入                         │
   │                                           │
   │  [树形结构]                               │
   │  ☑ 书签栏                                 │
   │    ☑ 开发工具                             │
   │    ☐ 新闻网站                             │
   │  ☑ 其他书签                               │
   │    ☑ 学习资料                             │
   │                                           │
   │  合并策略：                               │
   │  ○ 覆盖现有书签（清空后重新导入）         │
   │  ● 合并到现有分类                         │
   │  ○ 创建新的一级分类"浏览器书签"         │
   │                                           │
   │  ⚠️ 警告：覆盖模式将清空所有现有书签     │
   │                                           │
   │  [取消]  [开始获取]                       │
   └───────────────────────────────────────────┘
   ```

3. **获取过程**：
   - 使用chrome.bookmarks.getTree() API获取浏览器书签树
   - 显示进度条："正在获取书签... 32/256"
   - 解析书签文件夹结构和书签项
   - 转换为插件的三级分类数据结构

4. **分类映射规则**：
   - 浏览器文件夹 → 插件分类：
     - 顶层文件夹（书签栏/其他书签）→ 一级分类
     - 第二层文件夹 → 二级分类
     - 第三层文件夹 → 三级分类
     - 超过三层的扁平化处理
   - 示例：
     ```
     浏览器结构：
     书签栏/
       开发工具/
         前端框架/
           Vue相关/  ← 第4层
             书签1
     
     转换后：
     一级分类：开发工具
       二级分类：前端框架
         三级分类：Vue相关  ← 合并第3、4层
           书签1
     ```

5. **完成反馈**：
   - Toast通知："成功获取256个书签，18个文件夹"
   - 显示对比报告：
     ```
     ✅ 新增书签：128个
     🔄 已存在书签：100个
     📁 新增分类：12个
     ⚠️ 重复书签：28个（已跳过）
     ```

---

**子功能2：在插件中整理书签**

整理操作（已在4.2.2章节描述）：
- 三级分类CRUD
- 书签CRUD
- 拖拽排序
- 批量操作
- 搜索和过滤

整理完成后，书签数据保存在插件本地存储中。

---

**子功能3：同步回浏览器**

**入口**：
- 位置：BookmarksView右上角 → "浏览器同步"→"同步到浏览器"
- 快捷键：Ctrl/Cmd + Shift + B

**交互流程**：

1. **触发同步**：
   - 点击"同步到浏览器"按钮
   - 弹出ConfirmDialog：
     ```
     ⚠️ 同步确认
     
     即将把插件中的书签同步到Chrome浏览器。
     
     同步模式：
     ○ 完全覆盖（清空浏览器书签后重新创建）
     ● 增量同步（只同步新增和修改的书签）
     
     同步范围：
     ☑ 书签数据（352个）
     ☑ 分类结构（28个）
     ☐ 书签收藏状态（保存到书签名称前缀⭐）
     
     ⚠️ 此操作将修改浏览器书签，建议先备份！
     
     [取消]  [开始同步]
     ```

2. **同步前检查**：
   - 对比插件书签与浏览器书签差异
   - 生成同步计划：
     ```
     同步计划：
     ➕ 新增书签：82个
     ✏️ 更新书签：15个
     🗑️ 删除书签：0个
     📁 新增文件夹：5个
     ```
   - 用户确认后执行

3. **同步执行**：
   - 显示进度Dialog：
     ```
     正在同步到浏览器...
     
     [进度条 ████████░░░░ 65%]
     
     当前任务：创建文件夹"前端框架"
     已完成：230/352
     
     [取消同步]
     ```

4. **同步逻辑**（chrome.bookmarks API）：
   
   **完全覆盖模式**：
   ```javascript
   async function fullSync() {
     // 1. 备份浏览器现有书签（可选）
     const backup = await chrome.bookmarks.getTree()
     
     // 2. 清空浏览器书签（保留根节点）
     const bookmarkBar = await chrome.bookmarks.getChildren('1') // 书签栏
     const otherBookmarks = await chrome.bookmarks.getChildren('2') // 其他书签
     for (const item of [...bookmarkBar, ...otherBookmarks]) {
       await chrome.bookmarks.removeTree(item.id)
     }
     
     // 3. 根据三级分类创建文件夹结构
     for (const firstLevel of bookmarksStore.bookmarks) {
       const folder1 = await chrome.bookmarks.create({
         parentId: '1', // 书签栏
         title: firstLevel.name,
       })
       
       for (const secondLevel of firstLevel.children || []) {
         const folder2 = await chrome.bookmarks.create({
           parentId: folder1.id,
           title: secondLevel.name,
         })
         
         for (const thirdLevel of secondLevel.children || []) {
           const folder3 = await chrome.bookmarks.create({
             parentId: folder2.id,
             title: thirdLevel.name,
           })
           
           // 4. 添加书签到三级文件夹
           for (const bookmark of thirdLevel.bookmarks || []) {
             await chrome.bookmarks.create({
               parentId: folder3.id,
               title: bookmark.name,
               url: bookmark.url,
             })
           }
         }
       }
     }
   }
   ```
   
   **增量同步模式**：
   ```javascript
   async function incrementalSync() {
     // 1. 获取浏览器现有书签
     const browserTree = await chrome.bookmarks.getTree()
     
     // 2. 对比差异
     const diff = compareBrowserBookmarks(bookmarksStore.bookmarks, browserTree)
     
     // 3. 只同步新增和修改的项
     for (const item of diff.toAdd) {
       await chrome.bookmarks.create(item)
     }
     for (const item of diff.toUpdate) {
       await chrome.bookmarks.update(item.id, item.changes)
     }
     for (const item of diff.toDelete) {
       await chrome.bookmarks.remove(item.id)
     }
   }
   ```

5. **同步完成**：
   - Toast通知："同步成功！已同步352个书签到浏览器"
   - 显示同步报告：
     ```
     ✅ 同步完成
     
     ➕ 新增：82个书签，5个文件夹
     ✏️ 更新：15个书签
     ⏱️ 耗时：3.2秒
     
     [查看浏览器书签]  [关闭]
     ```

6. **错误处理**：
   - API权限不足：提示用户授权bookmarks权限
   - 网络错误：显示重试按钮
   - 部分失败：显示失败列表，支持单独重试

---

**子功能4：自动同步（可选）**

**设置选项**（Settings → 书签设置 → 浏览器同步）：
- `enableBrowserSync`: Boolean - 启用浏览器同步（默认false）
- `autoSyncInterval`: Number - 自动同步间隔（分钟，0=禁用，默认0）
- `syncOnBookmarkChange`: Boolean - 书签修改时自动同步（默认false）
- `syncDirection`: String - 同步方向（'to-browser' | 'from-browser' | 'bidirectional'）
- `conflictResolution`: String - 冲突解决策略（'keep-plugin' | 'keep-browser' | 'newer-wins'）

**监听浏览器变化**：
```javascript
// 在background.js或bookmarksStore中
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  if (settingsStore.syncDirection === 'bidirectional') {
    // 将新书签同步到插件
    bookmarksStore.importBrowserBookmark(bookmark)
  }
})

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  // 更新插件中的对应书签
})

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  // 从插件中删除对应书签
})
```

---

**技术实现总结**：

**UI组件**：
- `BrowserSyncDialog.vue`：浏览器同步对话框
- `SyncProgressDialog.vue`：同步进度对话框
- `SyncReportDialog.vue`：同步报告对话框
- `BookmarkTreeSelector.vue`：书签树选择器（选择要导入的文件夹）

**工具函数**（bookmarkSyncManager.js）：
- `fetchBrowserBookmarks()`: 获取浏览器书签
- `syncToBrowser(mode, options)`: 同步到浏览器
- `compareBrowserBookmarks()`: 对比差异
- `mergeBrowserBookmarks()`: 合并冲突
- `convertBrowserTreeToPluginFormat()`: 浏览器格式转插件格式
- `convertPluginFormatToBrowserTree()`: 插件格式转浏览器格式

**权限要求**（manifest.json）：
```json
{
  "permissions": [
    "tabs",
    "storage",
    "tabGroups",
    "activeTab",
    "bookmarks"  // 新增：访问和修改浏览器书签
  ]
}
```

**存储键**：
- `onetabs_sync_status`: 同步状态记录
- `onetabs_last_sync_time`: 最后同步时间
- `onetabs_browser_bookmark_map`: 插件书签ID与浏览器书签ID映射表

---

### 4.3 标签页管理系统（已实现，简要说明）

标签页管理系统已基本实现完成，包括以下核心功能：

#### 4.3.1 已实现功能列表

- ✅ **会话管理 (Sessions)**：保存和恢复标签页快照，支持置顶、命名、删除
- ✅ **收藏集管理 (Collections)**：手动整理标签页集合，支持CRUD操作
- ✅ **模板管理 (Templates)**：可复用的标签页模板，快速恢复工作场景
- ✅ **标签分组 (Tab Groups)**：Chrome原生标签分组集成
- ✅ **右键菜单系统**：全局单例模式，统一的上下文菜单
- ✅ **拖拽排序**：支持拖拽调整顺序
- ✅ **数据导入导出**：JSON格式导入导出

#### 4.3.2 相关组件和Store

**UI组件（已实现）：**
- `SessionCard.vue` - 会话卡片
- `CollectionCard.vue` - 收藏集卡片
- `TemplateCard.vue` - 模板卡片
- `TabItem.vue` - 标签页项
- `ContextMenu.vue` - 右键菜单
- `Groups.vue`, `TabGroups.vue` - 标签分组页面

**状态管理（已实现）：**
- `sessionsStore.js` - 会话管理
- `collectionsStore.js` - 收藏集管理
- `templatesStore.js` - 模板管理
- `groupsStore.js` - 标签分组管理
- `tabsStore.js` - 标签页管理

详细的标签页管理系统文档请参考现有代码和P2.md文档。

---

**主要功能**：

##### A. 创建模板

```
创建方式：
  1. 从会话转换（右键菜单）
  2. 从收藏集创建（右键菜单）
  3. 手动创建新模板（Dialog表单）
  4. 从书签分类创建
```

##### B. 使用模板

```
使用流程：
  1. 点击"打开模板"
  2. 在新窗口批量打开所有URL
  3. 可选：创建Chrome标签分组
  4. Toast提示打开成功
```

##### C. 模板操作

- **打开模板**：批量打开所有标签页
- **编辑模板**：Dialog修改名称、描述、标签页
- **删除模板**：ConfirmDialog确认后删除
- **置顶/取消置顶**：修改`pinned`字段
- **导出为JSON**：下载模板数据
- **复制模板**：创建副本
- **添加到书签**：将模板转换为书签分类

**UI组件**：

- `TemplateCard.vue` - 模板卡片（已实现）
- `TemplatesView.vue` - 模板列表页面

**状态管理**：

使用 **templatesStore.js** (已实现)

#### 4.3.4 标签分组管理 (Tab Groups)

**功能描述**：
集成Chrome原生标签分组功能，管理当前窗口的标签分组。

**主要功能**：

##### A. 分组操作

```
Chrome API集成：
  - chrome.tabGroups.query() - 获取所有分组
  - chrome.tabGroups.update() - 更新分组（名称、颜色）
  - chrome.tabGroups.move() - 移动分组
  - chrome.tabs.group() - 创建分组
  - chrome.tabs.ungroup() - 解除分组
```

##### B. 功能列表

- **查看分组**：显示当前窗口所有标签分组
- **重命名分组**：Dialog修改分组名称
- **更改颜色**：ColorPicker选择分组颜色
- **折叠/展开**：控制分组显示状态
- **解散分组**：取消分组，保留标签页
- **保存分组**：将分组保存为会话/收藏集/书签分类

**UI组件**：

- `TabGroupSelector.vue` - 标签分组选择器（已实现）
- `Groups.vue` - 标签分组管理页面（已实现）

**状态管理**：

使用 **groupsStore.js** 和 **tabsStore.js** (已实现)

---

### 4.4 统一功能

#### 4.4.1 固定链接栏 (Pinned Bar)

**功能描述**：
在页面顶部显示用户固定的常用书签和标签页，提供快速访问入口。

**UI特征**：

- 横向排列，支持横向滚动
- 每个固定项显示网站图标(favicon)和名称
- 鼠标悬停时高亮显示
- 支持拖拽排序
- 右键菜单：取消固定、编辑、删除

**数据来源**：

- 书签系统的`pinnedBookmarks`
- 会话/收藏集中固定的常用标签页
- 统一显示在顶部固定栏

### 4.4 右键菜单系统（已实现，共用）

**功能描述**：
统一的右键菜单系统，支持书签、标签页、会话、收藏集、模板等所有项目的快捷操作。

**实现方式**：

- 使用 **useContextMenu** composable（已实现）
- 全局单例模式，确保同时只有一个菜单显示
- 菜单配置通过 **contextMenus.js** 统一管理

**书签右键菜单（需新增）**：

```javascript
export function getBookmarkContextMenu(bookmark) {
  return [
    { label: '在新标签页打开', icon: 'pi-external-link', command: () => openBookmark(bookmark) },
    { label: '编辑', icon: 'pi-pencil', command: () => editBookmark(bookmark) },
    { label: '固定/取消固定', icon: 'pi-bookmark', command: () => togglePin(bookmark) },
    { separator: true },
    { label: '添加到收藏集', icon: 'pi-folder-open', command: () => addToCollection(bookmark) },
    { label: '创建为模板', icon: 'pi-file', command: () => createTemplate(bookmark) },
    { label: '复制链接', icon: 'pi-copy', command: () => copyUrl(bookmark.url) },
    { separator: true },
    { label: '删除', icon: 'pi-trash', command: () => deleteBookmark(bookmark) },
  ]
}
```

**UI组件**：

- `ContextMenu.vue` - 右键菜单组件（已实现）
- `contextMenus.js` - 菜单配置（需扩展书签菜单）

---

使用 **themeStore.js**（已实现）

##### B. 应用设置

```
配置项：
  - 保存会话时是否关闭标签页
  - 恢复会话时是否创建新窗口
  - 是否启用拖拽排序
  - 自动备份间隔时间
  - 数据保留天数
  - 书签默认视图（网格/列表）
  - 固定栏显示数量
```

##### C. 数据管理

- **备份数据**：将所有数据备份到chrome.storage
- **恢复数据**：从备份恢复
- **导出JSON**：下载所有数据为JSON文件（包括书签、会话、收藏集、模板）
- **导入JSON**：从JSON文件导入数据
- **清空数据**：清除所有存储数据（ConfirmDialog二次确认）
- **数据诊断**：检查存储空间使用情况

##### D. 错误日志

- **日志查看**：显示应用错误日志
- **日志级别**：ERROR, WARNING, INFO
- **日志导出**：下载日志文件
- **清空日志**：删除所有日志

**UI组件**：

- `Settings.vue` - 设置页面（已实现）
- 使用PrimeVue: Button, InputNumber, InputSwitch, etc.

**状态管理**：

使用 **settingsStore.js**（已实现）

---

## 5. 状态管理 (Pinia Stores)

### 5.1 Store结构概览

本项目使用Pinia进行状态管理，共有7个Store模块：

1. **bookmarksStore.js** (新增) - 书签数据管理
2. **sessionsStore.js** (已实现) - 会话管理
3. **collectionsStore.js** (已实现) - 收藏集管理
4. **templatesStore.js** (已实现) - 模板管理
5. **groupsStore.js** (已实现) - 标签分组管理
6. **tabsStore.js** (已实现) - 标签页管理
7. **settingsStore.js** (已实现) - 应用设置管理
8. **themeStore.js** (已实现) - 主题管理

### 5.2 bookmarksStore (书签管理，新增)

```javascript
Pinia Store: useBookmarksStore

状态(state):
  - bookmarks: []              // 主书签数据数组（三级分类树）
  - pinnedBookmarks: []        // 固定的书签数组
  - favoriteBookmarks: []      // 收藏的书签数组
  - currentFirstLevel: null    // 当前选中的一级分类ID
  - currentSecondLevel: null   // 当前选中的二级分类ID
  - currentThirdLevel: null    // 当前选中的三级分类ID
  - isLoading: false           // 加载状态
  - lastLoaded: null           // 最后加载时间
  - syncStatus: null           // 浏览器同步状态 ('idle' | 'syncing' | 'success' | 'error')

计算属性(getters):
  - getFirstLevelCategories: 返回所有一级分类
  - getSecondLevelCategories(firstLevelId): 返回指定一级分类下的二级分类
  - getThirdLevelCategories(firstLevelId, secondLevelId): 返回三级分类
  - getBookmarks(categoryPath): 返回指定分类路径下的书签
    // categoryPath = { first, second, third }
  - getPinnedBookmarks: 返回所有固定书签
  - getFavoriteBookmarks: 返回所有收藏书签
  - searchBookmarks(keyword): 搜索书签（名称、URL、描述、标签）
  - getCategoryById(id): 根据ID获取分类（任意层级）
  - getTotalBookmarksCount: 返回所有书签总数
  - getBookmarksByTag(tag): 根据标签筛选书签

方法(actions):
  初始化:
    - loadBookmarks(): 从chrome.storage.local['onetabs_bookmarks']加载
    - saveBookmarks(): 保存到chrome.storage.local
    - initializeWithDefaults(): 初始化默认书签数据

  分类操作:
    - addFirstLevelCategory(category): 添加一级分类
    - addSecondLevelCategory(firstLevelId, category): 添加二级分类
    - addThirdLevelCategory(firstLevelId, secondLevelId, category): 添加三级分类
    - updateCategory(categoryId, updates): 更新分类（名称、图标、颜色）
    - deleteCategory(categoryId): 删除分类及其下所有内容
    - moveCategory(categoryId, targetParentId): 移动分类到新父级

  书签操作:
    - addBookmark(categoryPath, bookmark): 添加书签到指定分类
    - updateBookmark(bookmarkId, updates): 更新书签信息
    - deleteBookmark(bookmarkId): 删除书签
    - moveBookmark(bookmarkId, targetCategoryPath): 移动书签到新分类
    - batchDeleteBookmarks(bookmarkIds): 批量删除
    - batchMoveBookmarks(bookmarkIds, targetCategoryPath): 批量移动

  固定功能:
    - pinBookmark(bookmark): 固定书签
    - unpinBookmark(bookmarkId): 取消固定
    - reorderPinnedBookmarks(newOrder): 重新排序固定书签

  收藏功能:
    - favoriteBookmark(bookmark): 收藏书签
    - unfavoriteBookmark(bookmarkId): 取消收藏
    - reorderFavoriteBookmarks(newOrder): 重新排序收藏书签
    - getFavoriteBookmarksByCategory(): 按分类分组返回收藏书签

  浏览器书签同步:
    - fetchBrowserBookmarks(): 从chrome.bookmarks API获取浏览器书签树
    - syncToBrowser(): 将插件中的书签同步回浏览器
      // 1. 清空浏览器原有书签（可选，需用户确认）
      // 2. 根据三级分类创建文件夹结构
      // 3. 将书签添加到对应文件夹
      // 4. 保持书签顺序
    - compareBrowserBookmarks(): 对比插件与浏览器书签差异
    - mergeBrowserBookmarks(strategy): 合并冲突
      // strategy: 'keep-plugin' | 'keep-browser' | 'merge-both'
    - watchBrowserChanges(): 监听浏览器书签变化（chrome.bookmarks.onCreated等）
    - enableAutoSync(enabled): 启用/禁用自动同步

  导入导出:
    - exportToJson(filename): 导出书签为JSON文件
    - importFromJson(file, mergeMode): 从JSON导入（合并/替换）
    - importFromChromeHtml(htmlFile, mergeMode): 从Chrome HTML导入
    - importFromChromeApi(): 使用chrome.bookmarks API导入
    - mergeBookmarks(newBookmarks): 合并书签数据

  数据管理:
    - backupBookmarks(): 创建备份
    - restoreFromBackup(): 从备份恢复
    - validateBookmarksData(data): 验证数据格式
    - cleanupOldBookmarks(retentionDays): 清理旧书签（根据设置）
```

### 5.3 sessionsStore (会话管理，已实现)

```javascript
Pinia Store: useSessionsStore

状态(state):
  - sessions: []               // 所有会话列表（按时间倒序）
  - currentSession: null       // 当前查看的会话
  - isLoading: false           // 加载状态
  - lastLoaded: null           // 最后加载时间

计算属性(getters):
  - getSessions: 获取所有会话
  - getPinnedSessions: 获取置顶会话
  - getUnpinnedSessions: 获取非置顶会话
  - getSessionById(id): 根据ID获取会话
  - getTotalCount: 会话总数
  - getTotalTabsCount: 所有标签页总数

方法(actions):
  - loadSessions(): 从chrome.storage.local['tabGroups']加载
  - addSession(session): 添加会话
  - updateSession(id, updates): 更新会话
  - deleteSession(id): 删除会话
  - togglePin(id): 切换置顶
  - restoreSession(id, options): 恢复会话到浏览器
    // options: { inNewWindow, deleteAfterRestore }
  - exportToJson(filename): 导出为JSON
  - saveToBookmarks(sessionId): 将会话保存为书签分类
  - saveToCollection(sessionId, collectionId): 保存到收藏集
  - saveToTemplate(sessionId): 将会话转换为模板
```

### 5.4 collectionsStore (收藏集管理，已实现)

```javascript
Pinia Store: useCollectionsStore

状态(state):
  - collections: []            // 所有收藏集列表
  - isLoading: false
  - lastLoaded: null

计算属性(getters):
  - getCollections: 获取所有收藏集
  - getPinnedCollections: 获取置顶收藏集
  - getUnpinnedCollections: 获取非置顶收藏集
  - getCollectionById(id): 根据ID获取收藏集
  - getTotalCount: 收藏集总数
  - getTotalTabsCount: 所有标签页总数

方法(actions):
  - loadCollections(): 从chrome.storage.local['onetabs_collections']加载
  - addCollection(collection): 添加收藏集
  - updateCollection(id, updates): 更新收藏集
  - deleteCollection(id): 删除收藏集
  - togglePin(id): 切换置顶
  - addTabToCollection(collectionId, tab): 添加标签页
  - removeTabFromCollection(collectionId, tabId): 移除标签页
  - openCollection(id, options): 打开收藏集所有标签页
  - duplicateCollection(id): 复制收藏集
  - exportToJson(filename): 导出为JSON
  - saveToBookmarks(collectionId): 转换为书签分类
  - saveToTemplate(collectionId): 转换为模板
```

### 5.5 templatesStore (模板管理，已实现)

```javascript
Pinia Store: useTemplatesStore

状态(state):
  - templates: []              // 所有模板列表
  - isLoading: false
  - lastLoaded: null

计算属性(getters):
  - getTemplates: 获取所有模板
  - getPinnedTemplates: 获取置顶模板
  - getUnpinnedTemplates: 获取非置顶模板
  - getTemplateById(id): 根据ID获取模板
  - getTotalCount: 模板总数

方法(actions):
  - loadTemplates(): 从chrome.storage.local['onetabs_templates']加载
  - addTemplate(template): 添加模板
  - updateTemplate(id, updates): 更新模板
  - deleteTemplate(id): 删除模板
  - togglePin(id): 切换置顶
  - openTemplate(id, options): 打开模板所有标签页
  - duplicateTemplate(id): 复制模板
  - exportToJson(filename): 导出为JSON
  - saveToBookmarks(templateId): 转换为书签分类
```

### 5.6 themeStore (主题管理，已实现)

```javascript
Pinia Store: useThemeStore

状态(state):
  - currentTheme: 'light'      // 当前主题：'light' | 'dark'
  - followSystem: false        // 是否跟随系统
  - systemPreference: 'light'  // 系统主题偏好

计算属性(getters):
  - activeTheme: 激活的主题（考虑followSystem）
  - isDark: 是否暗色主题

方法(actions):
  - loadTheme(): 从chrome.storage.local['onetabs_theme']加载
  - setTheme(theme): 设置主题（'light' | 'dark'）
  - setFollowSystem(follow): 设置是否跟随系统
  - toggleTheme(): 切换主题
  - applyTheme(): 应用主题到DOM（添加.theme-light或.theme-dark类）
  - detectSystemTheme(): 检测系统主题偏好
  - watchSystemTheme(): 监听系统主题变化（window.matchMedia）
```

### 5.7 settingsStore (设置管理，已实现)

```javascript
Pinia Store: useSettingsStore

状态(state):
  - closeTabsOnSave: true      // 保存会话时关闭标签页
  - restoreInNewWindow: false  // 新窗口恢复
  - enableDragSort: true       // 启用拖拽排序
  - autoBackupInterval: 60     // 自动备份间隔（分钟）
  - dataRetentionDays: 30      // 数据保留天数
  - bookmarkDefaultView: 'grid' // 书签默认视图：'grid' | 'list'
  - pinnedBarMaxItems: 10      // 固定栏最大显示数量
  - errorLogs: []              // 错误日志数组

计算属性(getters):
  - getAllSettings: 获取所有设置
  - getErrorLogs: 获取错误日志
  - getRecentErrors: 获取最近的错误（最多50条）

方法(actions):
  - loadSettings(): 从chrome.storage.local['onetabs_settings']加载
  - saveSettings(): 保存设置到chrome.storage.local
  - updateSettings(updates): 批量更新设置
  - resetToDefaults(): 重置为默认设置
  
  日志管理:
    - addErrorLog(log): 添加错误日志
      // log: { level, context, message, stack, timestamp }
    - clearErrorLogs(): 清空日志
    - exportLogs(filename): 导出日志为JSON
    - getLogsByLevel(level): 按级别筛选日志

  数据管理:
    - backupAllData(): 备份所有Store数据
    - restoreAllData(backupData): 恢复所有数据
    - exportAllData(filename): 导出所有数据为JSON
    - importAllData(file): 从JSON导入所有数据
    - clearAllData(): 清空所有数据（需二次确认）
    - diagnoseStorage(): 诊断存储空间使用情况
```

### 5.8 groupsStore & tabsStore (已实现)

```javascript
// groupsStore: 管理Chrome标签分组
// tabsStore: 管理当前窗口标签页

// 主要用于Tab Groups功能模块
// 与Chrome API直接交互
```

---

## 6. 路由配置

### 6.1 路由表

```javascript
路由配置:
  基础路径: '/'
  历史模式: createWebHashHistory (Chrome扩展要求)

路由列表:
  1. 主界面
     - 路径: '/'
     - 名称: 'Main'
     - 组件: MainView
     - 元信息: { title: 'OneTabs', keepAlive: true }
     - 说明: 默认重定向到书签导航或上次访问的页面

  2. 书签导航（新增）
     - 路径: '/bookmarks'
     - 名称: 'Bookmarks'
     - 组件: BookmarksView
     - 元信息: { title: 'OneTabs - 书签导航' }
     - 说明: 三级分类书签浏览和管理

  3. 会话管理（已实现）
     - 路径: '/sessions'
     - 名称: 'Sessions'
     - 组件: SessionsView
     - 元信息: { title: 'OneTabs - 会话管理' }

  4. 收藏集管理（已实现）
     - 路径: '/collections'
     - 名称: 'Collections'
     - 组件: CollectionsView
     - 元信息: { title: 'OneTabs - 收藏集' }

  5. 模板管理（已实现）
     - 路径: '/templates'
     - 名称: 'Templates'
     - 组件: TemplatesView
     - 元信息: { title: 'OneTabs - 模板' }

  6. 标签分组（已实现）
     - 路径: '/groups'
     - 名称: 'Groups'
     - 组件: Groups
     - 元信息: { title: 'OneTabs - 标签分组' }

  7. 设置页面（已实现）
     - 路径: '/settings'
     - 名称: 'Settings'
     - 组件: Settings
     - 元信息: { title: 'OneTabs - 设置' }

  8. 重定向
     - 路径: '/:pathMatch(.*)*'
     - 重定向到: '/'

路由守卫:
  beforeEach: 根据meta.title更新页面标题
  afterEach: 保存当前路径到设置（记住上次访问页面）
```

---

## 7. 工具函数库

### 7.1 Chrome存储工具 (chrome-storage.js，已实现)

```javascript
/**
 * 封装chrome.storage.local API
 */

// 获取数据
export async function chromeStorageGet(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key])
    })
  })
}

// 保存数据
export async function chromeStorageSet(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve()
    })
  })
}

// 删除数据
export async function chromeStorageRemove(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => {
      resolve()
    })
  })
}

// 清空所有数据
export async function chromeStorageClear() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      resolve()
    })
  })
}

// 获取存储空间使用情况
export async function chromeStorageGetBytesInUse(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(keys, (bytes) => {
      resolve(bytes)
    })
  })
}
```

### 7.2 书签导入解析工具 (bookmarkImporter.js，新增)

```javascript
/**
 * 解析Chrome书签HTML文件
 */

export function parseGoogleBookmarks(htmlContent) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const bookmarks = []
  let categoryIdCounter = 1
  let bookmarkIdCounter = 1
  
  // 递归解析文件夹结构
  function parseFolder(dl, level) {
    const items = []
    const dtElements = dl.querySelectorAll(':scope > dt')
    
    dtElements.forEach(dt => {
      const h3 = dt.querySelector('h3')
      
      if (h3) {
        // 这是一个文件夹
        const folderName = h3.textContent
        const childDl = dt.querySelector('dl')
        
        const category = {
          id: `cat-${categoryIdCounter++}`,
          name: folderName,
          icon: level === 1 ? 'pi-folder' : 'pi-folder-open',
          color: getRandomColor(),
        }
        
        if (childDl && level < 3) {
          category.children = parseFolder(childDl, level + 1)
          category.bookmarks = []
        } else if (childDl && level === 3) {
          category.bookmarks = parseFolder(childDl, level + 1)
        }
        
        items.push(category)
      } else {
        // 这是一个书签
        const a = dt.querySelector('a')
        if (a) {
          const bookmark = {
            id: `bookmark-${bookmarkIdCounter++}`,
            name: a.textContent,
            url: a.getAttribute('href'),
            favIconUrl: a.getAttribute('icon') || '',
            description: '',
            tags: [],
            sourceGroup: 'Chrome导入',
            createdAt: parseInt(a.getAttribute('add_date')) * 1000 || Date.now(),
            visitCount: 0,
          }
          items.push(bookmark)
        }
      }
    })
    
    return items
  }
  
  const rootDl = doc.querySelector('dl')
  if (rootDl) {
    return parseFolder(rootDl, 1)
  }
  
  return []
}

/**
 * 使用chrome.bookmarks API导入
 */
export async function importFromChromeApi() {
  if (!chrome.bookmarks) {
    throw new Error('chrome.bookmarks API不可用')
  }
  
  const tree = await chrome.bookmarks.getTree()
  return convertBookmarkTree(tree[0].children)
}

function convertBookmarkTree(nodes, level = 1) {
  const items = []
  let categoryIdCounter = 1
  let bookmarkIdCounter = 1
  
  nodes.forEach(node => {
    if (node.children) {
      // 文件夹
      const category = {
        id: node.id || `cat-${categoryIdCounter++}`,
        name: node.title,
        icon: level === 1 ? 'pi-folder' : 'pi-folder-open',
        color: getRandomColor(),
      }
      
      if (level < 3 && node.children.length > 0) {
        category.children = convertBookmarkTree(node.children, level + 1)
        category.bookmarks = []
      } else if (level === 3) {
        category.bookmarks = convertBookmarkTree(node.children, level + 1)
      }
      
      items.push(category)
    } else {
      // 书签
      items.push({
        id: node.id || `bookmark-${bookmarkIdCounter++}`,
        name: node.title,
        url: node.url,
        favIconUrl: `https://www.google.com/s2/favicons?domain=${new URL(node.url).hostname}&sz=64`,
        description: '',
        tags: [],
        sourceGroup: 'Chrome API导入',
        createdAt: node.dateAdded || Date.now(),
        visitCount: 0,
      })
    }
  })
  
  return items
}

function getRandomColor() {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
```

### 7.3 标签页操作工具 (tabsApi.js，新增)

```javascript
/**
 * 封装chrome.tabs和chrome.tabGroups API
 */

// 获取当前窗口所有标签页
export async function getCurrentWindowTabs() {
  return chrome.tabs.query({ currentWindow: true })
}

// 获取所有窗口的标签页
export async function getAllTabs() {
  return chrome.tabs.query({})
}

// 打开新标签页
export async function createTab(url, options = {}) {
  return chrome.tabs.create({ url, ...options })
}

// 批量打开标签页
export async function createMultipleTabs(urls, options = {}) {
  const tabs = []
  for (const url of urls) {
    const tab = await createTab(url, options)
    tabs.push(tab)
    // 添加小延迟避免过快打开
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  return tabs
}

// 关闭标签页
export async function closeTab(tabId) {
  return chrome.tabs.remove(tabId)
}

// 批量关闭标签页
export async function closeTabs(tabIds) {
  return chrome.tabs.remove(tabIds)
}

// 更新标签页
export async function updateTab(tabId, updateProperties) {
  return chrome.tabs.update(tabId, updateProperties)
}

// 获取标签分组
export async function getTabGroups() {
  return chrome.tabGroups.query({})
}

// 创建标签分组
export async function createTabGroup(tabIds, options = {}) {
  const groupId = await chrome.tabs.group({ tabIds })
  if (options.title || options.color) {
    await chrome.tabGroups.update(groupId, options)
  }
  return groupId
}

// 更新标签分组
export async function updateTabGroup(groupId, updateProperties) {
  return chrome.tabGroups.update(groupId, updateProperties)
}

// 解散标签分组
export async function ungroupTabs(tabIds) {
  return chrome.tabs.ungroup(tabIds)
}

// 获取标签页的favIconUrl
export function getFavIconUrl(url) {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    return ''
  }
}
```

### 7.4 错误处理工具 (errorHandler.js，已实现)

```javascript
/**
 * 统一错误处理和日志记录
 */

import { useSettingsStore } from '../stores/settingsStore'

export function errorHandler(error, context = '') {
  const settingsStore = useSettingsStore()
  
  const errorLog = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    level: 'ERROR',
    context,
    message: error.message,
    stack: error.stack,
  }
  
  settingsStore.addErrorLog(errorLog)
  console.error(`[${context}]`, error)
}

export function warnHandler(message, context = '') {
  const settingsStore = useSettingsStore()
  
  const warnLog = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    level: 'WARNING',
    context,
    message,
  }
  
  settingsStore.addErrorLog(warnLog)
  console.warn(`[${context}]`, message)
}

export function infoHandler(message, context = '') {
  const settingsStore = useSettingsStore()
  
  const infoLog = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    level: 'INFO',
    context,
    message,
  }
  
  settingsStore.addErrorLog(infoLog)
  console.info(`[${context}]`, message)
}
```

### 7.5 数据导入导出工具 (dataExporter.js，新增)

```javascript
/**
 * JSON数据导入导出
 */

// 导出数据为JSON文件
export function exportToJson(data, filename) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  
  URL.revokeObjectURL(url)
}

// 从JSON文件导入数据
export async function importFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (error) {
        reject(new Error('无效的JSON格式'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file)
  })
}

// 导出所有数据
export async function exportAllData(filename = `onetabs-backup-${Date.now()}.json`) {
  // 从chrome.storage读取所有数据
  const keys = [
    'onetabs_bookmarks',
    'tabGroups',
    'onetabs_collections',
    'onetabs_templates',
    'onetabs_settings',
    'onetabs_theme',
  ]
  
  const allData = {}
  
  for (const key of keys) {
    const data = await chromeStorageGet(key)
    if (data) {
      allData[key] = data
    }
  }
  
  allData.exportDate = Date.now()
  allData.version = '1.0.0'
  
  exportToJson(allData, filename)
}

// 导入所有数据
export async function importAllData(file) {
  const data = await importFromJson(file)
  
  // 验证数据格式
  if (!data.version) {
    throw new Error('无效的备份文件格式')
  }
  
  // 保存到chrome.storage
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'exportDate' && key !== 'version') {
      await chromeStorageSet(key, value)
    }
  }
  
  return data
}
```

### 7.6 URL验证工具 (urlValidator.js，新增)

```javascript
/**
 * URL验证和格式化
 */

// 验证URL是否有效
export function isValidUrl(url) {
  try {
    const urlObj = new URL(url)
    // 只允许http和https协议
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// 格式化URL（自动添加协议）
export function formatUrl(url) {
  if (!url) return ''
  
  // 如果已经有协议，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 自动添加https://
  return `https://${url}`
}

// 提取域名
export function extractDomain(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

// 获取网站名称（从域名提取）
export function getSiteName(url) {
  const domain = extractDomain(url)
  if (!domain) return '未知网站'
  
  // 移除www.和顶级域名
  const parts = domain.split('.')
  if (parts[0] === 'www') {
    parts.shift()
  }
  
  return parts.slice(0, -1).join('.') || domain
}
```

### 7.7 右键菜单配置 (contextMenus.js，已实现)

```javascript
/**
 * 统一的右键菜单配置
 */

// 书签右键菜单（新增）
export function getBookmarkContextMenu(bookmark) {
  return [
    { label: '在新标签页打开', icon: 'pi-external-link', command: () => openBookmark(bookmark) },
    { label: '编辑', icon: 'pi-pencil', command: () => editBookmark(bookmark) },
    { label: bookmark.pinned ? '取消固定' : '固定', icon: 'pi-bookmark', command: () => togglePinBookmark(bookmark) },
    { separator: true },
    { label: '添加到收藏集', icon: 'pi-folder-open', command: () => addBookmarkToCollection(bookmark) },
    { label: '添加到模板', icon: 'pi-file', command: () => addBookmarkToTemplate(bookmark) },
    { label: '复制链接', icon: 'pi-copy', command: () => copyUrl(bookmark.url) },
    { separator: true },
    { label: '删除', icon: 'pi-trash', command: () => deleteBookmark(bookmark), class: 'text-red-500' },
  ]
}

// 会话右键菜单（已实现）
export function getSessionContextMenu(session) {
  return [
    { label: '恢复会话', icon: 'pi-replay', command: () => restoreSession(session) },
    { label: session.isPinned ? '取消置顶' : '置顶', icon: 'pi-bookmark', command: () => togglePinSession(session) },
    { separator: true },
    { label: '转换为书签', icon: 'pi-star', command: () => sessionToBookmarks(session) },
    { label: '添加到收藏集', icon: 'pi-folder-open', command: () => sessionToCollection(session) },
    { label: '创建为模板', icon: 'pi-file', command: () => sessionToTemplate(session) },
    { separator: true },
    { label: '删除', icon: 'pi-trash', command: () => deleteSession(session), class: 'text-red-500' },
  ]
}

// 收藏集右键菜单（已实现）
export function getCollectionContextMenu(collection) {
  return [
    { label: '打开所有标签页', icon: 'pi-external-link', command: () => openCollection(collection) },
    { label: '编辑', icon: 'pi-pencil', command: () => editCollection(collection) },
    { label: collection.pinned ? '取消置顶' : '置顶', icon: 'pi-bookmark', command: () => togglePinCollection(collection) },
    { label: '复制', icon: 'pi-copy', command: () => duplicateCollection(collection) },
    { separator: true },
    { label: '转换为书签', icon: 'pi-star', command: () => collectionToBookmarks(collection) },
    { label: '创建为模板', icon: 'pi-file', command: () => collectionToTemplate(collection) },
    { label: '导出JSON', icon: 'pi-download', command: () => exportCollection(collection) },
    { separator: true },
    { label: '删除', icon: 'pi-trash', command: () => deleteCollection(collection), class: 'text-red-500' },
  ]
}

// 模板右键菜单（已实现）
export function getTemplateContextMenu(template) {
  return [
    { label: '打开模板', icon: 'pi-external-link', command: () => openTemplate(template) },
    { label: '编辑', icon: 'pi-pencil', command: () => editTemplate(template) },
    { label: template.pinned ? '取消置顶' : '置顶', icon: 'pi-bookmark', command: () => togglePinTemplate(template) },
    { label: '复制', icon: 'pi-copy', command: () => duplicateTemplate(template) },
    { separator: true },
    { label: '转换为书签', icon: 'pi-star', command: () => templateToBookmarks(template) },
    { label: '导出JSON', icon: 'pi-download', command: () => exportTemplate(template) },
    { separator: true },
    { label: '删除', icon: 'pi-trash', command: () => deleteTemplate(template), class: 'text-red-5500' },
  ]
}

// 标签页右键菜单（已实现）
export function getTabContextMenu(tab) {
  return [
    { label: '在新标签页打开', icon: 'pi-external-link', command: () => openTab(tab) },
    { label: '复制链接', icon: 'pi-copy', command: () => copyUrl(tab.url) },
    { separator: true },
    { label: '添加到收藏集', icon: 'pi-folder-open', command: () => addTabToCollection(tab) },
    { label: '添加到模板', icon: 'pi-file', command: () => addTabToTemplate(tab) },
    { label: '添加到书签', icon: 'pi-star', command: () => addTabToBookmarks(tab) },
    { separator: true },
    { label: '删除', icon: 'pi-trash', command: () => deleteTab(tab), class: 'text-red-500' },
  ]
}
```

---

## 8. UI/UX设计规范

### 8.1 色彩方案（CSS变量）

```css
/* 亮色主题 */
:root, .theme-light {
  /* 主色调 */
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  
  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  
  /* 文字色 */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  
  /* 边框色 */
  --border-primary: #e5e7eb;
  --border-secondary: #d1d5db;
  
  /* 状态色 */
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --info-color: #3b82f6;
}

/* 暗色主题 */
.theme-dark {
  /* 主色调 */
  --primary-color: #60a5fa;
  --primary-hover: #3b82f6;
  
  /* 背景色 */
  --bg-primary: #1f2937;
  --bg-secondary: #111827;
  --bg-tertiary: #374151;
  
  /* 文字色 */
  --text-primary: #f3f4f6;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
  
  /* 边框色 */
  --border-primary: #374151;
  --border-secondary: #4b5563;
  
  /* 状态色 */
  --success-color: #34d399;
  --warning-color: #fbbf24;
  --error-color: #f87171;
  --info-color: #60a5fa;
}
```

### 8.2 组件样式

#### 卡片样式 (Card)

```css
.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

#### 按钮样式 (Button)

```css
.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-hover);
}
```

---

## 9. Chrome扩展配置

### 9.1 manifest.json

```json
{
  "manifest_version": 3,
  "name": "OneTabs",
  "version": "0.0.4",
  "description": "保存并管理Chrome标签页及分组",
  
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "OneTabs"
  },
  
  "permissions": [
    "tabs",
    "storage",
    "tabGroups",
    "activeTab",
    "bookmarks"
  ],
  
  "background": {
    "service_worker": "background.js"
  },
  
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 9.2 background.js (Service Worker)

```javascript
/**
 * 后台脚本 - 监听扩展图标点击
 */

chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 获取当前窗口所有标签页
    const tabs = await chrome.tabs.query({ currentWindow: true })
    
    // 过滤掉扩展页面和chrome://页面
    const validTabs = tabs.filter(t => 
      !t.url.startsWith('chrome://') && 
      !t.url.startsWith('chrome-extension://')
    )
    
    if (validTabs.length === 0) {
      console.log('没有可保存的标签页')
      return
    }
    
    // 创建会话对象
    const session = {
      date: Date.now().toString(),
      timestamp: Date.now(),
      isPinned: false,
      tabs: validTabs.map(t => ({
        id: t.id.toString(),
        title: t.title,
        url: t.url,
        favIconUrl: t.favIconUrl || '',
        groupId: t.groupId || -1,
        index: t.index,
      })),
    }
    
    // 保存到storage
    const result = await chrome.storage.local.get('tabGroups')
    const sessions = result.tabGroups || []
    sessions.unshift(session)
    
    await chrome.storage.local.set({ tabGroups: sessions })
    
    // 可选：关闭已保存的标签页
    const settings = await chrome.storage.local.get('onetabs_settings')
    if (settings?.onetabs_settings?.closeTabsOnSave) {
      const tabIds = validTabs.map(t => t.id)
      await chrome.tabs.remove(tabIds)
    }
    
    console.log('会话已保存:', session)
  } catch (error) {
    console.error('保存会话失败:', error)
  }
})
```

---

## 10. 项目目录结构

```
onetabs/
├── public/
│   └── icons/                      # 扩展图标
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── src/
│   ├── assets/
│   │   ├── background.js           # Service Worker
│   │   ├── manifest.json           # 扩展配置文件
│   │   ├── fonts/                  # 字体文件
│   │   ├── icons/                  # 图标库
│   │   │   └── iconfont.css
│   │   └── style/
│   │       ├── index.css           # 全局样式
│   │       └── theme.css           # 主题样式
│   ├── components/
│   │   ├── ContextMenu.vue         # 右键菜单
│   │   ├── Icon.vue                # 图标组件
│   │   ├── IconTag.vue             # 图标标签
│   │   ├── SessionCard.vue         # 会话卡片
│   │   ├── CollectionCard.vue      # 收藏集卡片
│   │   ├── TemplateCard.vue        # 模板卡片
│   │   ├── TabItem.vue             # 标签页项
│   │   └── TabGroupSelector.vue    # 分组选择器
│   ├── composables/
│   │   └── useContextMenu.js       # 右键菜单组合式函数
│   ├── router/
│   │   └── index.js                # 路由配置
│   ├── stores/
│   │   ├── sessionsStore.js        # 会话状态管理
│   │   ├── collectionsStore.js     # 收藏集状态管理
│   │   ├── templatesStore.js       # 模板状态管理
│   │   ├── groupsStore.js          # 分组状态管理
│   │   ├── tabsStore.js            # 标签页状态管理
│   │   ├── settingsStore.js        # 设置状态管理
│   │   └── themeStore.js           # 主题状态管理
│   ├── utils/
│   │   ├── chrome-storage.js       # Chrome存储封装
│   │   ├── storage-manager.js      # 存储管理器
│   │   ├── errorHandler.js         # 错误处理
│   │   └── contextMenus.js         # 右键菜单配置
│   ├── views/
│   │   ├── MainView.vue            # 主界面
│   │   ├── SessionsView.vue        # 会话管理页
│   │   ├── CollectionsView.vue     # 收藏集管理页
│   │   ├── TemplatesView.vue       # 模板管理页
│   │   ├── Groups.vue              # 标签分组页
│   │   └── Settings.vue            # 设置页
│   ├── App.vue                     # 根组件
│   └── main.js                     # 入口文件
├── docs/                           # 文档目录
│   └── v3/
│       ├── P2.md                   # P2迭代文档
│       ├── P3.md                   # P3迭代文档
│       └── prd-adapted.md          # 本文档
├── scripts/                        # 构建脚本
├── package.json                    # 依赖配置
├── vite.config.js                  # Vite配置
├── eslint.config.js                # ESLint配置
└── README.md                       # 项目说明
```

---

## 11. 数据持久化策略

### 11.1 Chrome Storage键名规范

| 键名                   | 说明           | 数据类型    | Store              |
| ---------------------- | -------------- | ----------- | ------------------ |
| `onetabs_bookmarks`    | 书签数据（含收藏状态） | JSON Array  | bookmarksStore (新增) |
| `onetabs_sync_status`  | 浏览器同步状态 | JSON Object | bookmarksStore (新增) |
| `onetabs_last_sync_time` | 最后同步时间 | Timestamp   | bookmarksStore (新增) |
| `onetabs_browser_bookmark_map` | 书签ID映射表 | JSON Object | bookmarksStore (新增) |
| `tabGroups`            | 会话数据       | JSON Array  | sessionsStore (已实现) |
| `onetabs_collections`  | 收藏集数据     | JSON Array  | collectionsStore (已实现) |
| `onetabs_templates`    | 模板数据       | JSON Array  | templatesStore (已实现) |
| `onetabs_settings`     | 应用设置       | JSON Object | settingsStore (已实现) |
| `onetabs_theme`        | 主题设置       | JSON Object | themeStore (已实现) |
| `onetabs_backup`       | 备份数据       | JSON Object | 通用备份           |

### 11.2 数据同步策略

```
立即保存（实时持久化）：
  - 添加/编辑/删除书签
  - 添加/编辑/删除分类
  - 添加/编辑/删除会话、收藏集、模板
  - 修改设置
  - 切换主题
  - 固定/取消固定操作

自动备份（定时任务）：
  - 每小时自动备份到chrome.storage.local['onetabs_backup']
  - 生成带时间戳的备份键名
  - 可配置备份间隔（settingsStore.autoBackupInterval）

手动备份：
  - 用户在设置页面手动触发
  - 备份所有数据到JSON文件
  - 支持一键恢复
```

### 11.3 存储空间管理

```
Chrome存储限制：
  - chrome.storage.local: 无限制（受磁盘空间限制）
  - chrome.storage.sync: 100KB (可跨设备同步，可选功能)

数据结构优化：
  - 书签数据：嵌套三级结构，避免冗余
  - 会话数据：只存储必要字段（title, url, favIconUrl）
  - 图标缓存：使用Google Favicon服务，不存储base64

清理策略：
  - 定期清理旧会话（根据settingsStore.dataRetentionDays）
  - 清理无效的书签（404链接检测，可选）
  - 压缩JSON数据（移除空字段）

存储监控：
  - 实时监控存储空间使用情况
  - 超过阈值（例如80%）时显示警告
  - 提供数据诊断工具（Settings页面）
```

### 11.4 数据格式版本管理

```javascript
// 数据格式带版本号，便于未来迁移
const dataFormat = {
  version: '1.0.0',
  bookmarks: [],
  sessions: [],
  collections: [],
  templates: [],
  settings: {},
  theme: {},
}

// 版本迁移函数
function migrateData(data, fromVersion, toVersion) {
  // 根据版本号执行相应的迁移逻辑
  if (fromVersion === '0.9.0' && toVersion === '1.0.0') {
    // 迁移逻辑
  }
  return data
}
```

---

## 12. 核心功能实现逻辑

### 12.1 保存会话流程

```
用户点击扩展图标
  ↓
background.js监听action.onClicked
  ↓
chrome.tabs.query获取当前窗口标签页
  ↓
过滤有效标签页（排除chrome://和扩展页）
  ↓
创建会话对象（包含时间戳、tabs数组）
  ↓
读取现有会话数组
  ↓
新会话插入数组开头
  ↓
保存到chrome.storage.local['tabGroups']
  ↓
检查设置：是否关闭标签页
  ↓
如果是，批量关闭已保存的标签页
  ↓
完成，显示通知（可选）
```

### 12.2 恢复会话流程

```
用户点击"恢复会话"按钮
  ↓
获取会话对象
  ↓
检查设置：是否在新窗口打开
  ↓
如果是，创建新窗口
  ↓
遍历会话中的tabs数组
  ↓
对每个标签页调用chrome.tabs.create
  ↓
如果标签页有groupId：
  ├─ 收集同一分组的标签页ID
  └─ 调用chrome.tabs.group创建分组
  └─ 恢复分组名称和颜色
  ↓
检查设置：是否删除已恢复的会话
  ↓
如果是，从sessions数组移除该会话
  ↓
完成，更新UI
```

### 12.3 右键菜单流程

```
用户在标签页项上右键点击
  ↓
触发@contextmenu.prevent事件
  ↓
调用useContextMenu().showMenu(event)
  ↓
全局检查：是否有其他菜单打开
  ↓
如果有，先关闭旧菜单
  ↓
设置菜单位置（event.clientX, event.clientY）
  ↓
显示菜单（visible = true）
  ↓
添加全局点击监听器
  ↓
用户点击菜单外部
  ↓
触发handleClickOutside
  ↓
关闭菜单（visible = false）
  ↓
移除全局监听器
```

---

## 13. 性能优化

### 13.1 前端优化

1. **组件懒加载**：路由组件使用动态导入
2. **虚拟滚动**：大量数据列表使用虚拟滚动（PrimeVue VirtualScroller）
3. **防抖节流**：搜索、拖拽等操作使用防抖
4. **计算属性缓存**：利用Vue 3的计算属性自动缓存
5. **路由keep-alive**：主界面启用keep-alive保持状态

### 13.2 存储优化

1. **索引优化**：为常用查询建立Map索引
2. **增量更新**：只保存变更的数据
3. **定期清理**：根据dataRetentionDays清理旧数据
4. **压缩存储**：大数据使用JSON压缩

---

## 14. 扩展功能建议

### 14.1 已完成功能 (P2 + 现有实现)

**标签页管理系统：**
- ✅ 会话管理（保存、恢复、删除、置顶）
- ✅ 收藏集管理（创建、编辑、删除、置顶）
- ✅ 模板管理（创建、编辑、删除、置顶）
- ✅ 标签分组管理（Chrome原生集成）
- ✅ 右键菜单系统（全局单例模式）
- ✅ 数据导入导出（JSON格式）

**通用功能：**
- ✅ 主题切换（亮色/暗色/跟随系统）
- ✅ 设置页面（应用配置、数据管理、错误日志）
- ✅ 拖拽排序功能
- ✅ Toast通知系统
- ✅ ConfirmDialog确认对话框
- ✅ CSS变量主题系统

### 14.2 待实现功能 (书签管理系统)

**核心功能：**
- ⏳ 书签导航系统（三级分类结构）
- ⏳ 书签CRUD操作
- ⏳ 固定书签栏
- ⏳ 书签收藏功能（收藏区域展示）
- ⏳ Chrome书签导入（HTML文件 + API）
- ⏳ 浏览器书签整理与同步（双向同步）
- ⏳ 书签搜索和过滤
- ⏳ 书签标签系统
- ⏳ bookmarksStore状态管理
- ⏳ BookmarksView页面组件

**增强功能：**
- ⏳ 书签图标自动获取
- ⏳ 书签访问次数统计
- ⏳ 书签分类拖拽排序
- ⏳ 书签批量操作（移动、删除、导出、批量收藏）
- ⏳ 书签智能推荐（基于访问频率和收藏状态）
- ⏳ 收藏书签快速导出和分享
- ⏳ 浏览器同步冲突智能解决
- ⏳ 定时自动同步到浏览器
- ⏳ 同步历史记录和回滚

### 14.3 P3高级功能（未来规划）

**跨系统转换：**
1. **书签 ↔ 标签页互转**：
   - 书签转换为收藏集
   - 书签转换为模板
   - 会话保存为书签分类
   - 收藏集转换为书签分类
   - 模板转换为书签分类

2. **智能搜索功能**：
   - 全局搜索（书签、会话、收藏集、模板）
   - 模糊搜索和正则搜索
   - 搜索历史记录
   - 搜索结果高亮
   - 搜索快捷键（Ctrl/Cmd + K）

3. **标签系统**：
   - 为书签/会话/收藏集添加多标签
   - 标签云可视化
   - 按标签筛选和分组
   - 标签自动建议
   - 标签颜色标识

4. **统计分析**：
   - 书签访问频率统计
   - 最常访问的网站
   - 标签页使用习惯分析
   - 数据可视化图表（使用Chart.js）
   - 导出统计报告

5. **云同步**：
   - 使用chrome.storage.sync跨设备同步
   - 同步冲突解决策略
   - 选择性同步（只同步书签/只同步设置等）
   - 同步状态显示

6. **分享功能**：
   - 生成书签分类分享链接
   - 生成收藏集分享二维码
   - 导出为HTML网页
   - 分享到社交平台

7. **快捷键系统**：
   - 自定义快捷键
   - 快速保存会话（Ctrl/Cmd + Shift + S）
   - 快速搜索（Ctrl/Cmd + K）
   - 打开设置（Ctrl/Cmd + ,）
   - 切换主题（Ctrl/Cmd + Shift + T）

8. **AI智能功能**：
   - 自动分类书签（基于内容）
   - 智能推荐相似网站
   - 重复书签检测
   - 失效链接检测和清理
   - 网站内容摘要生成

9. **多语言支持**：
   - 中文（简体/繁体）
   - 英文
   - 日文
   - 韩文
   - 使用Vue I18n实现

10. **自定义主题**：
    - 颜色方案编辑器
    - 预设主题包
    - 社区主题分享
    - 背景图片自定义
    - 字体大小调整

11. **批量操作增强**：
    - 多选模式（Shift + 点击）
    - 全选/反选
    - 批量编辑属性
    - 批量添加标签
    - 批量移动到分类

12. **历史记录**：
    - 操作历史记录
    - 撤销/重做功能（Ctrl/Cmd + Z）
    - 历史记录可视化时间线
    - 历史数据导出

13. **通知系统**：
    - 浏览器通知（chrome.notifications）
    - 重要操作完成通知
    - 备份成功通知
    - 错误警告通知
    - 通知中心

14. **插件系统**：
    - 支持第三方插件扩展
    - 插件API文档
    - 插件市场（未来）
    - 插件开发模板

### 14.4 性能优化计划

1. **虚拟滚动**：
   - 书签列表使用虚拟滚动（PrimeVue VirtualScroller）
   - 大量数据（1000+）时提升性能

2. **懒加载优化**：
   - 图片懒加载
   - 组件懒加载
   - 路由懒加载

3. **缓存策略**：
   - favicon缓存
   - 搜索结果缓存
   - 计算属性优化

4. **Web Worker**：
   - 大数据解析使用Worker
   - 后台数据同步
   - 搜索索引构建

---

## 15. 测试要点

### 15.1 功能测试

- [ ] 会话CRUD操作正常
- [ ] 收藏集CRUD操作正常
- [ ] 模板CRUD操作正常
- [ ] 置顶/取消置顶功能正常
- [ ] 标签分组管理正常
- [ ] 恢复会话到浏览器成功
- [ ] 打开收藏集/模板成功
- [ ] 右键菜单显示和隐藏正常
- [ ] 主题切换功能正常
- [ ] 数据导入导出正常
- [ ] 设置保存和加载正常

### 15.2 边界测试

- [ ] 空数据状态显示
- [ ] 大量数据（1000+标签页）性能
- [ ] 特殊字符处理（URL、标题）
- [ ] 无效URL处理
- [ ] Chrome Storage空间不足处理
- [ ] 网络断开时的表现

### 15.3 兼容性测试

- [ ] Chrome 最新版本
- [ ] Chrome 稳定版本（3个月前）
- [ ] Edge浏览器（基于Chromium）
- [ ] 不同操作系统（Windows、macOS、Linux）

---

## 16. 部署说明

### 16.1 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:5173
```

### 16.2 构建扩展

```bash
# 构建生产版本
pnpm build-extension

# 输出目录：dist/
# 包含：manifest.json, index.html, assets/, background.js
```

### 16.3 Chrome扩展安装

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist/` 目录
6. 扩展安装完成

### 16.4 发布到Chrome Web Store

1. 注册Chrome开发者账号（一次性支付5美元）
2. 准备扩展资源：
   - 128x128图标
   - 1280x800宣传图
   - 440x280小图标
   - 详细描述
3. 上传扩展ZIP包
4. 填写商店信息
5. 提交审核（通常1-3个工作日）

---

## 17. 安全考虑

### 17.1 权限最小化

```json
// manifest.json只请求必要权限
{
  "permissions": [
    "tabs",        // 获取和操作标签页
    "storage",     // 本地数据存储
    "tabGroups",   // 标签分组管理
    "activeTab"    // 获取当前标签页
  ]
}
```

### 17.2 数据安全

```
1. 所有数据本地存储（chrome.storage.local）
2. 不收集用户隐私信息
3. 不发送数据到外部服务器
4. URL验证：防止javascript:、data:等危险协议
5. XSS防护：使用Vue 3自动转义
```

### 17.3 URL验证

```javascript
function isValidUrl(url) {
  try {
    const urlObj = new URL(url)
    // 只允许http和https协议
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}
```

---

## 18. 常见问题与解决方案

### Q1: 为什么会话保存后标签页没有关闭？

**A**: 检查设置页面 → "保存会话时关闭标签页" 选项是否开启。

### Q2: 恢复会话时部分标签页打不开？

**A**: 可能原因：
1. URL无效或网站不可访问
2. 需要登录的网站
3. 浏览器阻止了弹出窗口

### Q3: 数据丢失怎么办？

**A**: 
1. 检查设置页面 → 数据管理 → 数据诊断
2. 尝试从备份恢复
3. 导入之前导出的JSON文件

### Q4: 扩展图标点击没反应？

**A**: 
1. 检查background.js是否正常运行
2. 查看Chrome扩展管理页面是否有错误
3. 尝试重新加载扩展

### Q5: 主题切换后颜色显示异常？

**A**: 
1. 刷新页面
2. 检查theme.css是否正确加载
3. 清除浏览器缓存

---

## 19. 开发规范

### 19.1 代码风格

```javascript
// 使用ESLint + Prettier统一代码风格
// eslint.config.js已配置

// 命名规范：
// - 组件：PascalCase (SessionCard.vue)
// - 变量/函数：camelCase (loadSessions)
// - 常量：UPPER_SNAKE_CASE (MAX_SESSIONS)
// - CSS类：kebab-case (session-card)

// Vue 3 Composition API风格：
<script setup>
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubleCount = computed(() => count.value * 2)

onMounted(() => {
  console.log('Component mounted')
})
</script>
```

### 19.2 Git提交规范

```
格式：<type>: <subject>

type类型：
  - feat: 新功能
  - fix: 修复bug
  - docs: 文档更新
  - style: 代码格式调整
  - refactor: 代码重构
  - perf: 性能优化
  - test: 测试相关
  - chore: 构建工具或辅助工具的变动

示例：
  feat: 添加会话搜索功能
  fix: 修复主题切换后颜色异常
  docs: 更新PRD文档
```

### 19.3 注释规范

```javascript
/**
 * 函数说明
 * @param {Type} paramName - 参数说明
 * @returns {Type} 返回值说明
 */
function functionName(paramName) {
  // 实现逻辑
}

// 组件注释
/**
 * 会话卡片组件
 * 显示会话信息，支持恢复、置顶、删除等操作
 * 
 * @component
 * @props {Object} session - 会话对象
 * @emits {Event} restore - 恢复会话事件
 * @emits {Event} delete - 删除会话事件
 */
```

---

## 20. 更新日志

### v0.0.4 (2026-01-21)

- ✅ 完成P2所有功能
- ✅ 实现主题系统（亮色/暗色/跟随系统）
- ✅ 优化右键菜单（全局单例模式）
- ✅ 修复多个bug
- ✅ 完善设置页面

### v0.0.3

- ✅ 添加收藏集和模板功能
- ✅ 实现数据导入导出
- ✅ 优化UI交互

### v0.0.2

- ✅ 实现基础会话管理
- ✅ 添加标签分组功能
- ✅ 集成PrimeVue组件库

### v0.0.1

- ✅ 项目初始化
- ✅ 基础架构搭建

---

## 20. 附录A：项目定位与差异说明

### 原PRD vs 本项目

| 维度         | 原PRD (纯书签管理)              | 本项目 (OneTabs扩展)                     |
| ------------ | ------------------------------- | ---------------------------------------- |
| **核心定位** | 书签导航和分类管理系统          | Chrome新标签页扩展（书签管理为新增核心，标签页管理已实现） |
| **应用类型** | 独立Web应用/浏览器主页          | Chrome新标签页扩展                       |
| **PRD重点** | 书签三级分类浏览                | **书签管理系统**（待实现）               |
| **已有功能** | 无                              | 会话、收藏集、模板、分组管理（已实现）   |
| **数据来源** | Chrome书签HTML导入              | 书签导入 + Chrome标签页自动保存          |
| **数据结构** | 三级分类树形结构                | 树形书签（新增） + 扁平会话/收藏集/模板（已有） |
| **存储方式** | LocalStorage                    | chrome.storage.local                     |
| **触发方式** | 用户主动添加书签                | 书签手动管理 + 点击扩展图标自动保存会话  |
| **UI组件库** | 无指定                          | PrimeVue 4.3.3                           |
| **样式框架** | 原生CSS                         | Tailwind CSS 4.1.5                       |
| **主要场景** | 长期保存和组织收藏网址          | 书签导航（新增） + 标签页管理（已有）    |
| **主题系统** | 无                              | 亮色/暗色/跟随系统（已实现）             |
| **跨功能转换** | 无                            | 书签↔会话↔收藏集↔模板 互相转换（新增）  |

### 技术实现差异

| 维度         | 原PRD                           | 本项目实际实现                           |
| ------------ | ------------------------------- | ---------------------------------------- |
| **Vue版本**  | Vue 3（未指定版本）             | Vue 3.3.4 + Composition API              |
| **状态管理** | Pinia (基础描述)                | 7个独立Store模块，模块化管理             |
| **路由模式** | createWebHistory                | createWebHashHistory (扩展要求)          |
| **数据持久化** | LocalStorage直接操作          | chrome.storage API封装 + 自动备份        |
| **错误处理** | 无说明                          | errorHandler统一处理 + 日志系统          |
| **右键菜单** | 无说明                          | useContextMenu全局单例 + 配置化菜单      |
| **构建工具** | Vite 4.4.9                      | Vite 6.3.4 + 组件自动导入                |
| **图标系统** | 无说明                          | PrimeIcons 7.0.0                         |
| **代码质量** | 无说明                          | ESLint + Prettier + Vue专用规则          |

### 功能模块对照表

| 原PRD功能                 | 本项目对应实现                                    | 状态       |
| ------------------------- | ------------------------------------------------- | ---------- |
| **书签管理功能（PRD重点，待实现）** | - | - |
| 书签浏览导航              | BookmarksView + bookmarksStore                    | ⏳ 待实现  |
| 三级分类管理              | CategoryManager组件 + 树形数据结构                | ⏳ 待实现  |
| 固定链接栏                | PinnedBookmarksBar组件                            | ⏳ 待实现  |
| Chrome书签导入            | bookmarkImporter.js (HTML + API)                  | ⏳ 待实现  |
| 书签CRUD操作              | bookmarksStore actions                            | ⏳ 待实现  |
| 书签与其他系统互转        | 转换工具函数                                       | ⏳ 待实现  |
| **共用功能（PRD包含，已实现）** | - | - |
| 数据备份恢复              | settingsStore + chrome.storage                    | ✅ 已实现  |
| JSON导入导出              | dataExporter.js                                   | ✅ 已实现  |
| 设置页面                  | Settings + settingsStore (需扩展书签设置项)        | ✅ 已实现  |
| 主题系统                  | themeStore + theme.css                            | ✅ 已实现  |
| 右键菜单                  | ContextMenu + useContextMenu                      | ✅ 已实现  |
| **标签页管理功能（PRD不详述，已实现）** | - | - |
| 会话管理                  | SessionsView + sessionsStore                      | ✅ 已实现  |
| 收藏集管理                | CollectionsView + collectionsStore                | ✅ 已实现  |
| 模板管理                  | TemplatesView + templatesStore                    | ✅ 已实现  |
| 标签分组                  | Groups + groupsStore                              | ✅ 已实现  |

### 项目特点说明

1. **PRD重点：书签管理系统**
   - 本PRD文档主要描述待实现的书签管理功能
   - 包括三级分类结构、CRUD操作、Chrome导入、固定栏等
   - bookmarksStore需要完整实现

2. **标签页管理已实现**
   - 会话、收藏集、模板、分组功能已基本完成
   - PRD中简要提及，作为已有功能的参考
   - 与书签系统可以互相转换

3. **共用基础设施**
   - 设置页面：包含书签设置和标签页设置
   - 主题系统：CSS变量 + 暗色模式
   - 右键菜单：统一的ContextMenu组件
   - 数据管理：备份、导出、导入、诊断

4. **Chrome深度集成**
   - 使用chrome.tabs、chrome.tabGroups、chrome.bookmarks API
   - chrome.storage.local统一数据持久化
   - 新标签页扩展形式

5. **现代化技术栈**
   - Vue 3.3.4 + Composition API
   - Pinia 2.1.0 (模块化状态管理)
   - PrimeVue 4.3.3 (企业级UI组件)
   - Tailwind CSS 4.1.5 (实用样式框架)

6. **可扩展性强**
   - 模块化设计，易于添加新功能
   - 数据互通，书签与标签页系统可互相转换
   - 统一的错误处理和日志系统

---

## 21. 附录B：开发优先级规划

### Phase 1: 书签管理核心功能（高优先级）

**时间估算：2-3周**

1. **bookmarksStore实现**：
   - 状态定义和getters
   - CRUD actions
   - 数据持久化

2. **BookmarksView页面**：
   - 三级导航UI
   - 书签卡片展示
   - 侧边栏分类树

3. **书签CRUD功能**：
   - 添加/编辑/删除书签
   - 添加/编辑/删除分类
   - 拖拽排序

4. **固定书签栏**：
   - PinnedBookmarksBar组件
   - 固定/取消固定功能
   - 横向滚动展示

### Phase 2: Chrome书签导入（中优先级）

**时间估算：1-2周**

1. **bookmarkImporter.js**：
   - HTML文件解析
   - chrome.bookmarks API集成
   - 数据格式转换

2. **ImportBookmarks组件**：
   - 文件选择UI
   - 导入模式选择（合并/替换）
   - 进度条显示

3. **导入流程优化**：
   - 大文件处理
   - 错误处理
   - 导入结果反馈

### Phase 3: 跨系统转换功能（中优先级）

**时间估算：1周**

1. **书签 → 其他**：
   - 书签转收藏集
   - 书签转模板

2. **标签页 → 书签**：
   - 会话转书签分类
   - 收藏集转书签分类
   - 模板转书签分类

3. **右键菜单扩展**：
   - 添加转换选项
   - contextMenus.js更新

### Phase 4: 搜索和过滤（中优先级）

**时间估算：1周**

1. **全局搜索**：
   - 搜索框组件
   - 搜索算法实现
   - 搜索结果展示

2. **高级过滤**：
   - 按标签过滤
   - 按日期过滤
   - 按访问次数排序

### Phase 5: 高级功能（低优先级）

**时间估算：视需求而定**

1. **标签系统**
2. **统计分析**
3. **云同步**
4. **多语言**
5. **AI功能**

---

## 22. 附录C：关键技术决策

### 为什么选择Chrome Extension而不是纯Web应用？

1. **原生API访问**：直接使用chrome.tabs、chrome.tabGroups、chrome.bookmarks
2. **无需服务器**：所有数据本地存储，零运维成本
3. **性能优势**：直接操作浏览器，无需页面跳转
4. **用户体验**：新标签页自动打开，一键保存会话
5. **安全性**：Chrome扩展权限模型，用户可控

### 为什么同时包含书签和标签页管理？

1. **项目现状**：
   - 标签页管理功能（会话、收藏集、模板、分组）已基本实现
   - 书签管理功能是新增的核心模块
   - 本PRD重点描述书签管理的实现规范

2. **使用场景互补**：
   - **书签**：长期保存的常用网址，按分类组织
   - **会话**：临时保存的工作场景，自动保存
   - **收藏集**：手动整理的主题集合
   - **模板**：可复用的工作模式

3. **数据互通增值**：
   - 临时会话可永久保存为书签分类
   - 书签可快速转换为模板或收藏集
   - 统一的数据管理和备份策略
   - 共用设置页面，降低学习成本

4. **一站式解决方案**：
   - 替代Chrome原生书签 + 扩展OneTab的功能
   - 提供完整的浏览器导航和标签页管理体验

### 为什么选择PrimeVue而不是Element Plus?

1. **Vue 3原生支持**：为Vue 3优化
2. **组件丰富**：50+高质量组件，包括Dialog、Toast、ConfirmDialog
3. **主题系统**：内置主题切换，与本项目需求契合
4. **无样式冲突**：可与Tailwind CSS完美共存
5. **企业级质量**：稳定可靠，文档完善
6. **体积适中**：按需导入，打包体积可控

### 为什么使用createWebHashHistory而不是createWebHistory?

1. **Chrome扩展限制**：扩展页面的URL为chrome-extension://协议
2. **不需要服务器配置**：Hash模式无需服务器路由支持
3. **兼容性更好**：所有浏览器都支持Hash路由
4. **适合扩展场景**：扩展内部导航，不需要SEO

---

## 结语

本PRD根据OneTabs项目的实际情况进行了全面调整，明确定位为**Chrome新标签页扩展**，以**书签管理系统**为PRD核心内容，标签页管理功能作为已实现的背景说明。

### 核心要点

1. **PRD重点**：书签管理系统（待实现）
   - 三级分类结构
   - CRUD操作
   - Chrome书签导入
   - 固定栏功能
   - bookmarksStore实现规范

2. **已有功能**：标签页管理（已实现，简要说明）
   - 会话、收藏集、模板、分组
   - 作为PRD中的参考和背景
   - 与书签系统可互相转换

3. **共用模块**：设置、主题、右键菜单等
   - 设置页面包含两个系统的配置项
   - 统一的主题和UI风格
   - 共享的数据管理功能

4. **技术栈**：Vue 3.3.4 + Pinia 2.1.0 + PrimeVue 4.3.3 + Tailwind CSS 4.1.5

5. **数据存储**：chrome.storage.local统一持久化

### 下一步行动

**立即开始（Phase 1）：**
1. ✅ 实现bookmarksStore.js（状态、getter、actions）
2. ✅ 创建BookmarksView.vue页面组件
3. ✅ 实现书签三级分类导航UI
4. ✅ 实现书签CRUD功能（添加、编辑、删除）
5. ✅ 实现固定书签栏（PinnedBookmarksBar组件）

**Phase 2：**
6. ✅ 集成Chrome书签导入（HTML + API）
7. ✅ 实现书签搜索和过滤
8. ✅ 扩展设置页面（添加书签设置项）

**Phase 3：**
9. ✅ 实现跨系统转换（书签↔会话↔收藏集↔模板）
10. ✅ 优化性能和用户体验
11. ✅ 完善文档和测试

本文档为OneTabs项目的书签管理系统提供完整的产品需求和技术实现参考，是开发团队的权威指导文档。

**文档版本**: 3.0.0  
**最后更新**: 2026年1月21日  
**项目**: OneTabs  
**定位**: Chrome新标签页扩展（书签管理 + 标签页管理）  
**PRD重点**: 书签管理系统实现规范  
**基于**: 书签管理PRD + 现有标签页管理功能
