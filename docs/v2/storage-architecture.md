# OneTabs 数据存储架构

> 文档版本：1.0  
> 最后更新：2026-01-20

---

## 📦 存储概览

OneTabs 使用 **Chrome Storage API** 作为主要存储方式，在非扩展环境下回退到 **localStorage**。

### 存储层次结构

```
Chrome Extension
│
├─ Chrome Storage (主要存储)
│  ├─ chrome.storage.local (本地存储，5MB限制)
│  └─ chrome.storage.sync (云同步存储，100KB限制)
│
└─ localStorage (开发环境回退)
   └─ 键名前缀: onetabs_*
```

---

## 🗄️ 当前使用的存储键

### 1. `tabGroups` (Background Service Worker)
**用途**：存储会话收纳数据  
**位置**：background.js 直接写入  
**数据结构**：
```javascript
[
  {
    date: 1705843200000,           // 保存时间戳
    type: 'grouped',                // 类型：'grouped' | 'ungrouped'
    title: '工作相关',              // 组标题
    isPinned: false,                // 是否置顶
    groupInfo: {                    // 标签页组信息（仅grouped类型）
      id: 123,
      title: '工作相关',
      color: 'blue',
      collapsed: false
    },
    tabs: [                         // 标签页列表
      {
        url: 'https://example.com',
        title: '示例页面',
        favIconUrl: 'https://...',
        groupId: 123
      }
    ]
  }
]
```

### 2. `onetabs_data` (tabsStore)
**用途**：存储标签页临时数据（当前较少使用）  
**位置**：stores/tabsStore.js  
**数据结构**：
```javascript
{
  tabs: [                           // 标签页数组
    {
      id: 'tab-xxx',
      url: 'https://example.com',
      title: '示例页面',
      favIconUrl: 'https://...'
    }
  ],
  tabGroups: []                     // 标签页组数组（预留）
}
```

### 3. `onetabs_groups` (groupsStore)
**用途**：存储标签页组和窗口模板（P1功能）  
**位置**：stores/groupsStore.js  
**数据结构**：
```javascript
{
  tabGroups: [                      // 标签页组（Collections）
    {
      id: 'group-1705843200000',
      name: '工作文档',
      color: '#3B82F6',
      icon: '',                     // 可选图标
      createdAt: '2026-01-20T...',
      updatedAt: '2026-01-20T...',
      pinned: false,                // 是否固定在顶部
      tabs: [
        {
          title: '项目需求文档',
          url: 'https://...',
          favIconUrl: 'https://...',
          order: 0
        }
      ]
    }
  ],
  windows: [                        // 窗口模板（Templates）
    {
      id: 'window-xxx',
      name: '工作环境',
      description: '日常工作使用',
      icon: '',
      createdAt: '2026-01-20T...',
      updatedAt: '2026-01-20T...',
      collections: [                // 包含的标签页组
        {
          collectionId: 'group-xxx', // 引用的Collection ID
          name: '工作文档',
          color: '#3B82F6',
          createGroup: true,         // 是否创建Tab Group
          isReference: true,         // true=引用模式, false=快照模式
          tabs: []                   // 快照模式下的标签页
        }
      ],
      standaloneTabs: [              // 独立标签页
        {
          title: 'GitHub',
          url: 'https://github.com',
          favIconUrl: 'https://...',
          pinned: false
        }
      ]
    }
  ]
}
```

---

## 🔧 存储工具函数

### chrome-storage.js

位于 `src/utils/chrome-storage.js`，提供了封装的存储API：

#### 本地存储（Local Storage）

```javascript
// 获取数据
chromeStorageGet(key)
// 示例：const data = await chromeStorageGet('onetabs_data')

// 保存数据
chromeStorageSet(key, data)
// 示例：await chromeStorageSet('onetabs_data', { tabs: [] })

// 高级API（处理嵌套对象）
getFromStorage(key, defaultValue)
setToStorage(key, value)
```

#### 同步存储（Sync Storage - P3功能）

```javascript
// 获取同步数据
chromeSyncStorageGet(key)

// 保存同步数据
chromeSyncStorageSet(key, data)
```

**注意**：
- Local Storage：容量大（约5MB），仅本地存储
- Sync Storage：容量小（约100KB），跨设备同步
- 非扩展环境自动回退到 localStorage

---

## 🔄 数据流转流程

### 1. 保存会话流程

```
用户点击扩展图标
    ↓
background.js - saveTabs()
    ↓
获取当前窗口标签页 (chrome.tabs.query)
获取标签页组信息 (chrome.tabGroups.query)
    ↓
组织数据结构：
  - 分离置顶组和非置顶组
  - 创建未分组标签的组
  - 为每个标签页组创建单独组
    ↓
chrome.storage.local.set({ tabGroups: savedTabGroups })
    ↓
关闭所有标签页（除扩展页面）
打开/刷新扩展页面
```

### 2. 加载会话流程

```
扩展页面打开
    ↓
TabGroups.vue - onMounted()
    ↓
loadTabGroups()
    ↓
chrome.storage.local.get(['tabGroups'])
    ↓
解析数据并渲染UI
  - 置顶组在顶部
  - 非置顶组按时间倒序
```

### 3. Store 数据流（Pinia）

```
组件挂载
    ↓
调用 store.loadXxx()
    ↓
chromeStorageGet('storage_key')
    ↓
更新 store state
    ↓
UI 自动响应更新

用户操作
    ↓
调用 store.saveXxx() / updateXxx()
    ↓
修改 store state
    ↓
chromeStorageSet('storage_key', data)
    ↓
持久化到 Chrome Storage
```

---

## 📊 存储容量管理

### Chrome Storage Local 限制
- **单个扩展总容量**：约 5MB
- **单个键值对大小**：无明确限制，但建议 < 1MB
- **超出限制**：触发 QUOTA_BYTES_PER_ITEM 错误

### 优化策略

#### 1. 数据清理机制（待实现）
```
设置最大会话数量（默认50）
  ↓
超出限制时自动删除最旧的会话
  ↓
保留置顶的会话
```

#### 2. 数据压缩（可选 - P2）
```javascript
// 使用 LZ-string 或类似库压缩
import LZString from 'lz-string'

const compressed = LZString.compress(JSON.stringify(data))
await chromeStorageSet('key', compressed)

const data = JSON.parse(LZString.decompress(compressed))
```

#### 3. 大数据分块存储（已实现 - storage-manager.js）
```javascript
// 自动分块保存大对象
import { saveLargeData, loadLargeData } from '@/utils/storage-manager'

// 保存（自动分块）
await saveLargeData('large_key', largeObject)

// 加载（自动合并）
const data = await loadLargeData('large_key')
```

---

## 🔐 数据安全

### 当前策略
- ✅ 本地存储，不上传服务器
- ✅ Chrome 用户配置文件隔离
- ✅ 仅扩展自身可访问
- ❌ 无加密（URL和标题明文存储）

### 未来改进（P3）
- [ ] 敏感数据加密
- [ ] 云同步数据端到端加密
- [ ] 用户可选的本地加密选项

---

## 🧹 数据清理

### 手动清理（Settings页面）
```javascript
// 清空会话收纳
chrome.storage.local.remove(['tabGroups'])

// 清空所有数据
chrome.storage.local.clear()
```

### 自动清理（待实现）
- 超过最大会话数量时自动删除旧会话
- 超过存储容量限制时提示用户
- 定期清理无效数据（如已删除的收藏夹）

---

## 🐛 常见问题

### Q1: 数据存储在哪里？
**A**: Chrome扩展数据存储在用户配置文件目录下：
- Windows: `%LocalAppData%\Google\Chrome\User Data\Default\Local Extension Settings\`
- Mac: `~/Library/Application Support/Google/Chrome/Default/Local Extension Settings/`
- Linux: `~/.config/google-chrome/Default/Local Extension Settings/`

### Q2: 卸载扩展后数据会丢失吗？
**A**: 是的。卸载扩展会清除所有 chrome.storage 数据。建议实现导出功能（P2）。

### Q3: 可以在不同Chrome实例间共享数据吗？
**A**: 默认不行。需要使用 chrome.storage.sync 或实现云同步功能（P3）。

### Q4: 如何调试存储数据？
**A**: 
1. 打开 `chrome://extensions/`
2. 点击扩展的"详情"
3. 点击"检查视图：服务工作进程"
4. Console中执行：
```javascript
chrome.storage.local.get(null, (data) => console.log(data))
```

---

## 📝 开发建议

### 数据访问原则
1. **统一入口**：所有数据访问通过 Pinia Store
2. **错误处理**：所有 storage 操作要有 try-catch
3. **数据验证**：读取数据后验证结构完整性
4. **及时保存**：重要操作后立即持久化

### 示例代码模式

```javascript
// ✅ 推荐：通过Store访问
import { useSessionsStore } from '@/stores/sessionsStore'
const sessionsStore = useSessionsStore()
await sessionsStore.loadSessions()

// ❌ 不推荐：直接调用chrome.storage
chrome.storage.local.get(['tabGroups'], (data) => {
  // 容易出错，难以维护
})
```

---

## 🚀 未来规划

### P0 - MVP阶段
- [x] 基础 chrome.storage.local 存储
- [x] background.js 直接写入会话数据
- [ ] 创建统一的 sessionsStore

### P1 - 核心功能
- [ ] collectionsStore 完整实现
- [ ] templatesStore 完整实现
- [ ] 数据结构标准化

### P2 - 优化功能
- [ ] 数据导入/导出（JSON）
- [ ] 数据清理策略
- [ ] 存储容量监控
- [ ] 大数据分块存储优化

### P3 - 高级功能
- [ ] chrome.storage.sync 云同步
- [ ] 自建服务器同步
- [ ] 数据加密
- [ ] 版本迁移机制

---

## 📚 相关文档

- [Chrome Storage API 文档](https://developer.chrome.com/docs/extensions/reference/storage/)
- [P0.md - 核心功能规划](./P0.md)
- [architecture-note.md - 架构说明](./architecture-note.md)
