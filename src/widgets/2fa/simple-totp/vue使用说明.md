# Vue TOTP 生成器 - 使用说明

## 📁 文件说明

`vue-totp-generator.vue` - 完整的 Vue 3 单文件组件，可以直接使用

## ✨ 功能特性

- ✅ 实时生成 TOTP 验证码（每 30 秒自动刷新）
- ✅ 可视化倒计时（进度条 + 秒数显示）
- ✅ 验证码验证功能
- ✅ 支持 Base32 密钥输入
- ✅ 示例密钥快速切换
- ✅ 完全兼容浏览器（使用 Web Crypto API）
- ✅ 响应式设计（支持移动端）

## 🚀 使用方法

### 方式 1：直接复制到你的 Vue 项目

```bash
# 复制文件到你的项目
cp vue-totp-generator.vue your-project/src/views/TOTPGenerator.vue
```

### 方式 2：在路由中注册

```javascript
// router/index.js
import TOTPGenerator from '@/views/TOTPGenerator.vue'

const routes = [
  {
    path: '/totp',
    name: 'TOTPGenerator',
    component: TOTPGenerator,
  },
]
```

### 方式 3：作为组件使用

```vue
<template>
  <div>
    <TOTPGenerator />
  </div>
</template>

<script setup>
import TOTPGenerator from './components/TOTPGenerator.vue'
</script>
```

## 📦 依赖要求

### 必需依赖

```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "element-plus": "^2.4.0"
  }
}
```

### Element Plus 图标

确保安装了 Element Plus 图标：

```bash
npm install @element-plus/icons-vue
```

## 🎨 界面预览

### 主界面

```
┌──────────────────────────────────────┐
│  🔐 TOTP 验证码生成器                │
│  输入密钥，实时生成验证码              │
├──────────────────────────────────────┤
│                                      │
│  密钥 (Base32)                       │
│  🔑 [YH23545V2Q44CX7P        ] [×]  │
│  支持 Base32 编码的密钥（A-Z, 2-7）  │
│                                      │
│  ┌────────────────────────────────┐ │
│  │     当前验证码                  │ │
│  │                                │ │
│  │       1 2 3 4 5 6              │ │
│  │                                │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  🕐 25 秒                      │ │
│  └────────────────────────────────┘ │
│                                      │
│  ────────── ✓ 验证 ──────────       │
│                                      │
│  🔒 [输入验证码] [验证]              │
│                                      │
│  ✅ 验证通过                         │
└──────────────────────────────────────┘
```

## 💻 代码说明

### 核心算法

组件内置了完整的 TOTP 算法实现，**使用浏览器原生 Web Crypto API**，无需 Node.js：

```javascript
// Base32 解码
function base32Decode(base32) { ... }

// 生成 TOTP 验证码
async function generateTOTP(secret, window = 0) { ... }

// 验证 TOTP 验证码
async function verifyTOTP(token, secret, windowSize = 1) { ... }

// 获取剩余秒数
function getRemainingSeconds() { ... }
```

### 响应式数据

```javascript
const secret = ref('YH23545V2Q44CX7P')      // 密钥
const currentCode = ref('')                  // 当前验证码
const remainingSeconds = ref(30)             // 剩余秒数
const inputCode = ref('')                    // 用户输入的验证码
const verifyResult = ref(null)               // 验证结果
```

### 自动刷新

```javascript
// 每秒更新一次
onMounted(() => {
  updateCode()
  timer = setInterval(updateCode, 1000)
})

// 清理定时器
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
```

## 🎯 使用示例

### 示例 1：基本使用

1. 打开页面
2. 输入密钥：`YH23545V2Q44CX7P`
3. 自动显示验证码和倒计时
4. 每 30 秒验证码自动刷新

### 示例 2：验证功能

1. 查看当前验证码（如 `123456`）
2. 在验证输入框输入：`123456`
3. 点击"验证"按钮
4. 显示 ✅ 验证通过

### 示例 3：快速切换密钥

1. 点击说明卡片中的示例密钥按钮
2. 自动填充密钥并生成验证码

## 🔧 自定义样式

### 修改主题色

```css
/* 修改渐变背景色 */
.code-container {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### 修改验证码字体

```css
.code {
  font-size: 56px;           /* 字体大小 */
  letter-spacing: 12px;       /* 字符间距 */
  font-family: 'Your Font';   /* 字体 */
}
```

### 修改进度条颜色

```javascript
const timerColor = computed(() => {
  if (remainingSeconds.value > 20) return '#your-green'
  if (remainingSeconds.value > 10) return '#your-yellow'
  return '#your-red'
})
```

## 📱 响应式设计

组件已适配移动端：

```css
@media (max-width: 768px) {
  .code {
    font-size: 40px;        /* 移动端更小的字体 */
    letter-spacing: 8px;
  }

  .code-container {
    padding: 24px 16px;     /* 移动端更小的内边距 */
  }
}
```

## 🌐 浏览器兼容性

使用 Web Crypto API，支持：

- ✅ Chrome 37+
- ✅ Firefox 34+
- ✅ Safari 11+
- ✅ Edge 79+

## ⚠️ 注意事项

### 1. HTTPS 要求

Web Crypto API 要求 HTTPS 环境（开发环境的 localhost 除外）：

```
✅ https://example.com  - 可用
✅ http://localhost     - 可用
❌ http://example.com   - 不可用
```

### 2. 密钥格式

只支持 **Base32** 格式密钥：

```
✅ JBSWY3DPEHPK3PXP  - 正确（Base32）
❌ abc123           - 错误（不是 Base32）
```

### 3. 时间同步

确保系统时间准确，误差不超过 30 秒。

## 🎓 扩展功能

### 添加二维码生成

```bash
npm install qrcode
```

```vue
<script setup>
import QRCode from 'qrcode'

const generateQRCode = async () => {
  const otpauthUrl = `otpauth://totp/MyApp:user@example.com?secret=${secret.value}&issuer=MyApp`
  const qrCode = await QRCode.toDataURL(otpauthUrl)
  // 显示二维码
}
</script>
```

### 添加历史记录

```javascript
const history = ref([])

watch(currentCode, (newCode) => {
  if (newCode) {
    history.value.unshift({
      code: newCode,
      time: new Date().toLocaleTimeString(),
    })
  }
})
```

### 添加多密钥管理

```javascript
const secrets = ref([
  { name: 'Gmail', secret: 'SECRET1' },
  { name: 'GitHub', secret: 'SECRET2' },
])

const activeSecret = ref(0)

const currentSecret = computed(() => {
  return secrets.value[activeSecret.value]?.secret
})
```

## 📚 相关文档

- [RFC 6238 - TOTP 规范](https://datatracker.ietf.org/doc/html/rfc6238)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Element Plus 文档](https://element-plus.org/)

## 🐛 故障排查

### Q: 验证码不刷新？

检查浏览器控制台是否有错误，确保定时器正常运行。

### Q: 验证总是失败？

1. 检查密钥格式是否正确（Base32）
2. 检查系统时间是否准确
3. 确保在 HTTPS 环境下运行

### Q: 样式显示不正常？

确保已正确引入 Element Plus 样式：

```javascript
// main.js
import 'element-plus/dist/index.css'
```

---

**完成时间**: 2025-10-29
**Vue 版本**: 3.3+
**Element Plus 版本**: 2.4+
