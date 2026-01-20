# Mock 数据功能使用指南

## 功能概述

已为 SessionsView 添加了测试数据生成功能，方便开发和测试时快速创建示例会话。

---

## 功能详情

### 1. 添加测试数据按钮

**位置**：会话收纳页面顶部右侧

**功能**：点击后自动生成 1-2 个随机测试会话

**按钮样式**：
- 蓝色主题按钮
- 带有 ➕ 图标
- 文字："添加测试数据"

---

### 2. Mock 数据类型

#### 2.1 未分组会话 (40% 概率)
**包含的网站**：
- Google (https://www.google.com)
- YouTube (https://www.youtube.com)
- Twitter (https://twitter.com)
- Reddit (https://www.reddit.com)
- Hacker News (https://news.ycombinator.com)

**特点**：
- 类型：`ungrouped`
- 标题：未分组标签
- 包含 5 个随机标签页

#### 2.2 分组会话 (60% 概率)
**包含的网站**：
- GitHub (https://github.com)
- Stack Overflow (https://stackoverflow.com)
- MDN Web Docs (https://developer.mozilla.org)
- Vue.js (https://vuejs.org)

**分组信息**：
- 随机组名：工作、学习、娱乐、购物、开发、设计、阅读
- 随机颜色：blue, red, yellow, green, pink, purple, cyan, orange, grey
- 包含 4 个标签页

---

## 使用方法

### 开发环境测试

1. **启动开发服务器**
   ```bash
   pnpm run dev
   ```

2. **打开扩展页面**
   - 在浏览器中访问 `http://localhost:5173`
   - 或者加载打包后的扩展

3. **添加测试数据**
   - 点击页面顶部的"添加测试数据"按钮
   - 系统会随机生成 1-2 个会话
   - Toast 通知会显示添加的会话数量

4. **查看结果**
   - 新会话会立即显示在列表中
   - 可以展开查看详细的标签页信息
   - 测试置顶、恢复、删除等功能

---

## Mock 数据结构

### 未分组会话示例
```javascript
{
  date: 1737349200000,        // 时间戳
  type: 'ungrouped',          // 类型
  title: '未分组标签',         // 标题
  isPinned: false,            // 是否置顶
  tabs: [
    {
      url: 'https://www.google.com',
      title: 'Google',
      favIconUrl: 'https://www.google.com/favicon.ico',
      groupId: -1
    },
    // ... 更多标签页
  ]
}
```

### 分组会话示例
```javascript
{
  date: 1737349200000,
  type: 'grouped',
  title: '工作',
  isPinned: false,
  groupInfo: {
    id: 1234,
    title: '工作',
    color: 'blue',
    collapsed: false
  },
  tabs: [
    {
      url: 'https://github.com',
      title: 'GitHub - Where the world builds software',
      favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
      groupId: 1
    },
    // ... 更多标签页
  ]
}
```

---

## 技术实现

### 代码位置
- **文件**：`src/views/SessionsView.vue`
- **函数**：`generateMockSession(type)` - 生成 mock 数据
- **函数**：`addMockData()` - 添加 mock 数据到 store

### 核心逻辑

1. **随机生成**
   - 每次点击生成 1-2 个会话
   - 60% 概率生成分组会话，40% 概率生成未分组会话

2. **时间戳处理**
   - 使用当前时间减去随机偏移
   - 确保每个会话的时间不同

3. **数据保存**
   - 调用 `sessionsStore.saveSession()` 保存到 Storage
   - 调用 `sessionsStore.loadSessions()` 刷新列表
   - 显示 Toast 成功提示

---

## 注意事项

### 开发建议
- ✅ 仅用于开发和测试环境
- ✅ 生产环境可以隐藏此按钮
- ✅ Mock 数据使用真实网站的 URL 和图标

### 数据限制
- Mock 会话会占用 chrome.storage.local 空间
- 建议定期清理测试数据
- 可以使用设置页面的"清除所有数据"功能

### 扩展建议
如需添加更多 mock 数据类型，可以修改 `generateMockSession()` 函数：
```javascript
// 添加更多网站
const websites = {
  tech: [
    { url: 'https://example.com', title: '...', icon: '...' }
  ],
  social: [...],
  news: [...]
}

// 添加更多分组主题
const themes = ['编程', '新闻', '社交', '音乐', '视频']
```

---

## 快速测试流程

1. 首次进入页面（空状态）
2. 点击"添加测试数据"按钮 3-5 次
3. 测试以下功能：
   - ✅ 展开/折叠会话
   - ✅ 置顶会话
   - ✅ 恢复会话
   - ✅ 删除会话
   - ✅ 点击单个标签页

---

## 未来改进

- [ ] 添加批量生成功能（一次生成 10 个）
- [ ] 添加更多网站类型（新闻、音乐、视频等）
- [ ] 支持自定义 mock 数据模板
- [ ] 添加"重置为默认数据"功能
- [ ] 保存常用的测试场景

---

## 相关文件

- `src/views/SessionsView.vue` - 主视图文件
- `src/stores/sessionsStore.js` - 会话数据管理
- `src/components/SessionCard.vue` - 会话卡片组件
- `src/components/TabItem.vue` - 标签页组件
