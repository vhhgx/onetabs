# 纯 TOTP 验证码计算工具

**无需数据库，纯算法实现**

## 🎯 功能

输入密钥（如 `JBSWY3DPEHPK3PXP`），输出 6 位验证码（如 `123456`）

## 🚀 使用方法

### 1. 生成验证码

```javascript
import { generateTOTP } from './totp.js'

const secret = 'JBSWY3DPEHPK3PXP'  // Base32 编码的密钥
const code = generateTOTP(secret)

console.log(code)  // 输出: 123456
```

### 2. 验证验证码

```javascript
import { verifyTOTP } from './totp.js'

const secret = 'JBSWY3DPEHPK3PXP'
const userInput = '123456'

const isValid = verifyTOTP(userInput, secret)
console.log(isValid)  // true 或 false
```

### 3. 获取剩余时间

```javascript
import { getRemainingSeconds } from './totp.js'

const remaining = getRemainingSeconds()
console.log(`剩余 ${remaining} 秒`)  // 0-30 秒
```

## 🧪 测试

```bash
npm test
# 或
node test.js
```

输出示例：
```
========== 示例 1：生成验证码 ==========
密钥: JBSWY3DPEHPK3PXP
当前验证码: 123456
剩余有效时间: 25 秒

========== 示例 2：验证验证码 ==========
用户输入: 123456
验证结果: ✅ 通过

========== 示例 3：验证错误的验证码 ==========
用户输入: 000000
验证结果: ❌ 失败

========== 示例 4：实时监控验证码变化（按 Ctrl+C 退出）==========
🔄 验证码已更新: 789012 (有效期: 30 秒)
⏱️  当前验证码: 789012 | 剩余: 25 秒
```

## 📝 API 说明

### `generateTOTP(secret, time?, window?)`

生成 TOTP 验证码

- **secret**: `string` - Base32 编码的密钥（必填）
- **time**: `number` - 时间戳（秒），默认为当前时间
- **window**: `number` - 时间窗口偏移，默认 0
- **返回**: `string` - 6 位验证码

### `verifyTOTP(token, secret, windowSize?)`

验证 TOTP 验证码

- **token**: `string` - 用户输入的 6 位验证码（必填）
- **secret**: `string` - Base32 密钥（必填）
- **windowSize**: `number` - 时间窗口大小，默认 1（允许前后 30 秒误差）
- **返回**: `boolean` - 是否验证通过

### `getRemainingSeconds()`

获取当前验证码剩余有效时间

- **返回**: `number` - 剩余秒数（0-30）

## 🔧 核心原理

```
TOTP 算法 = HMAC-SHA1(Secret, TimeCounter)

1. TimeCounter = floor(CurrentTime / 30)  // 30 秒为一个周期
2. HMAC-SHA1 签名
3. 动态截断
4. 取模得到 6 位数字
```

## 💡 使用场景

### 场景 1：纯本地验证

```javascript
// 用户输入密钥和验证码
const secret = 'JBSWY3DPEHPK3PXP'
const userCode = '123456'

// 本地验证
if (verifyTOTP(userCode, secret)) {
  console.log('验证通过！')
}
```

### 场景 2：前端展示倒计时

```javascript
// 实时显示验证码和倒计时
setInterval(() => {
  const code = generateTOTP(secret)
  const remaining = getRemainingSeconds()

  updateUI(code, remaining)
}, 1000)
```

### 场景 3：兼容性测试

```javascript
// 测试你的实现是否和 Google Authenticator 一致
const secret = 'JBSWY3DPEHPK3PXP'
const myCode = generateTOTP(secret)

console.log('我的验证码:', myCode)
console.log('Google Authenticator 验证码:', '在 APP 中查看')
console.log('应该一致！')
```

## ❓ 常见问题

### Q: 为什么我的验证码和 Google Authenticator 不一样？

A: 检查以下几点：
1. 密钥是否完全一致（大小写敏感）
2. 系统时间是否准确（误差不超过 30 秒）
3. 密钥编码格式是否为 Base32

### Q: 验证码多久刷新一次？

A: 每 30 秒刷新一次。

### Q: 时间窗口是什么？

A: 允许前后时间偏移。例如 `windowSize=1` 表示：
- 验证当前时间的验证码
- 验证 30 秒前的验证码
- 验证 30 秒后的验证码

总共 3 个验证码，只要匹配其中一个就算通过。

## 📦 依赖

**0 依赖！** 只使用 Node.js 内置的 `crypto` 模块。

## 🎓 参考

- [RFC 6238 - TOTP 规范](https://datatracker.ietf.org/doc/html/rfc6238)
- [RFC 4226 - HOTP 规范](https://datatracker.ietf.org/doc/html/rfc4226)

---

**示例密钥**: `JBSWY3DPEHPK3PXP` (Hello!)

你可以用这个密钥在 Google Authenticator 中添加，然后和代码生成的验证码对比，应该完全一致！
