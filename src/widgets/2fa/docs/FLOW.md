# 2FA 业务流程说明

## 目录

1. [启用 2FA 流程](#启用-2fa-流程)
2. [登录验证流程](#登录验证流程)
3. [备用验证码使用流程](#备用验证码使用流程)
4. [禁用 2FA 流程](#禁用-2fa-流程)
5. [技术实现细节](#技术实现细节)

---

## 启用 2FA 流程

### 流程图

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│  用户   │         │  前端    │         │  后端    │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │ 1. 进入安全设置   │                     │
     │──────────────────>│                     │
     │                   │                     │
     │ 2. 点击启用 2FA   │                     │
     │──────────────────>│                     │
     │                   │                     │
     │                   │ 3. POST /2fa/enable │
     │                   │────────────────────>│
     │                   │                     │
     │                   │                     │ 4. 生成密钥
     │                   │                     │    generateSecret()
     │                   │                     │
     │                   │                     │ 5. 生成二维码
     │                   │                     │    generateQRCode()
     │                   │                     │
     │                   │                     │ 6. 临时存储密钥
     │                   │                     │    two_factor_secret_temp
     │                   │                     │
     │                   │ 7. 返回密钥 + 二维码 │
     │                   │<────────────────────│
     │                   │                     │
     │ 8. 显示二维码     │                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 9. 扫描二维码     │                     │
     │   (使用认证器APP) │                     │
     │                   │                     │
     │ 10. 输入验证码    │                     │
     │──────────────────>│                     │
     │                   │                     │
     │                   │ 11. POST /2fa/verify│
     │                   │     { token }       │
     │                   │────────────────────>│
     │                   │                     │
     │                   │                     │ 12. 验证 TOTP
     │                   │                     │     verifyToken()
     │                   │                     │
     │                   │                     │ 13. 生成备用验证码
     │                   │                     │     generateBackupCodes()
     │                   │                     │
     │                   │                     │ 14. 哈希备用验证码
     │                   │                     │     bcrypt.hash()
     │                   │                     │
     │                   │                     │ 15. 加密密钥
     │                   │                     │     encrypt()
     │                   │                     │
     │                   │                     │ 16. 正式启用
     │                   │                     │     two_factor_enabled = true
     │                   │                     │     two_factor_secret = encrypted
     │                   │                     │
     │                   │ 17. 返回备用验证码   │
     │                   │<────────────────────│
     │                   │                     │
     │ 18. 显示备用验证码 │                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 19. 保存备用验证码 │                     │
     │   (下载/复制)     │                     │
     │                   │                     │
     │ 20. 完成设置      │                     │
     │                   │                     │
```

### 详细步骤

#### 第一步：生成密钥 (后端)

```javascript
const { secret, otpauthUrl } = TwoFactorAuth.generateSecret(
  'user@example.com',
  'Cloud Team'
)

// secret: "JBSWY3DPEHPK3PXP" (Base32 编码)
// otpauthUrl: "otpauth://totp/Cloud%20Team:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Cloud%20Team"
```

#### 第二步：生成二维码 (后端)

```javascript
const qrCode = await TwoFactorAuth.generateQRCode(otpauthUrl)

// qrCode: "data:image/png;base64,iVBORw0KGg..."
```

#### 第三步：临时存储 (后端)

```javascript
user.two_factor_secret_temp = secret // 临时存储，待验证
await user.save()
```

#### 第四步：用户扫描二维码 (前端)

用户使用认证器 APP（如 Google Authenticator）扫描二维码，APP 会：

1. 解析 otpauth:// URL
2. 提取密钥 (secret)
3. 保存到本地
4. 每 30 秒生成一个 6 位验证码

#### 第五步：验证绑定 (后端)

```javascript
// 验证用户输入的验证码
const isValid = TwoFactorAuth.verifyToken(token, secret)

if (isValid) {
  // 生成备用验证码
  const backupCodes = TwoFactorAuth.generateBackupCodes(10)

  // 哈希存储备用验证码
  const hashedBackupCodes = await Promise.all(
    backupCodes.map(code => bcrypt.hash(code, 10))
  )

  // 加密密钥
  const encryptedSecret = TwoFactorAuth.encrypt(secret, ENCRYPTION_KEY)

  // 正式启用
  user.two_factor_enabled = true
  user.two_factor_secret = encryptedSecret
  user.backup_codes = JSON.stringify(hashedBackupCodes)
  user.two_factor_secret_temp = undefined
  await user.save()
}
```

---

## 登录验证流程

### 流程图

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│  用户   │         │  前端    │         │  后端    │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │ 1. 输入账号密码   │                     │
     │──────────────────>│                     │
     │                   │                     │
     │                   │ 2. POST /login      │
     │                   │────────────────────>│
     │                   │                     │
     │                   │                     │ 3. 验证账号密码
     │                   │                     │
     │                   │                     │ 4. 检查 2FA 状态
     │                   │                     │    two_factor_enabled?
     │                   │                     │
     │                   │ 5. 返回 userId      │
     │                   │    (不返回 token)   │
     │                   │<────────────────────│
     │                   │                     │
     │ 6. 跳转到 2FA 验证页│                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 7. 查看认证器 APP  │                     │
     │   获取 6 位验证码  │                     │
     │                   │                     │
     │ 8. 输入验证码     │                     │
     │──────────────────>│                     │
     │                   │                     │
     │                   │ 9. POST /login/2fa  │
     │                   │    { userId, token }│
     │                   │────────────────────>│
     │                   │                     │
     │                   │                     │ 10. 解密密钥
     │                   │                     │     decrypt()
     │                   │                     │
     │                   │                     │ 11. 验证 TOTP
     │                   │                     │     verifyToken()
     │                   │                     │
     │                   │                     │ 12. 清除速率限制
     │                   │                     │
     │                   │                     │ 13. 生成 JWT Token
     │                   │                     │
     │                   │ 14. 返回 Token      │
     │                   │<────────────────────│
     │                   │                     │
     │ 15. 保存 Token    │                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 16. 登录成功      │                     │
     │   跳转到首页      │                     │
     │                   │                     │
```

### 关键点

1. **第一次验证**：账号密码验证通过
2. **第二次验证**：TOTP 验证码验证通过
3. **速率限制**：5 次失败后锁定 5 分钟
4. **时间窗口**：允许前后 30 秒误差

---

## 备用验证码使用流程

### 使用场景

- 用户丢失手机
- 认证器 APP 无法使用
- 时间同步问题导致验证码不匹配

### 流程

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│  用户   │         │  前端    │         │  后端    │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │ 1. 点击"使用备用   │                     │
     │    验证码"        │                     │
     │──────────────────>│                     │
     │                   │                     │
     │ 2. 显示对话框     │                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 3. 输入备用验证码  │                     │
     │──────────────────>│                     │
     │                   │                     │
     │                   │ 4. POST /2fa/backup-code
     │                   │    { userId, backupCode }
     │                   │────────────────────>│
     │                   │                     │
     │                   │                     │ 5. 获取哈希后的
     │                   │                     │    备用验证码列表
     │                   │                     │
     │                   │                     │ 6. 逐个比对
     │                   │                     │    bcrypt.compare()
     │                   │                     │
     │                   │                     │ 7. 找到匹配的验证码
     │                   │                     │
     │                   │                     │ 8. 从列表中移除
     │                   │                     │    (一次性使用)
     │                   │                     │
     │                   │                     │ 9. 生成 JWT Token
     │                   │                     │
     │                   │ 10. 返回 Token +    │
     │                   │     剩余备用码数量   │
     │                   │<────────────────────│
     │                   │                     │
     │ 11. 登录成功      │                     │
     │<──────────────────│                     │
     │                   │                     │
```

### 重要提示

- 每个备用验证码只能使用一次
- 使用后立即从数据库中删除
- 建议用户在备用码用完前重新生成

---

## 禁用 2FA 流程

### 流程图

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│  用户   │         │  前端    │         │  后端    │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │ 1. 点击禁用 2FA   │                     │
     │──────────────────>│                     │
     │                   │                     │
     │ 2. 显示确认对话框  │                     │
     │<──────────────────│                     │
     │                   │                     │
     │ 3. 输入验证码确认  │                     │
     │──────────────────>│                     │
     │                   │                     │
     │                   │ 4. POST /2fa/disable│
     │                   │    { token }        │
     │                   │────────────────────>│
     │                   │                     │
     │                   │                     │ 5. 解密密钥
     │                   │                     │
     │                   │                     │ 6. 验证 TOTP
     │                   │                     │    (必须验证通过)
     │                   │                     │
     │                   │                     │ 7. 清除 2FA 数据
     │                   │                     │    - two_factor_enabled
     │                   │                     │    - two_factor_secret
     │                   │                     │    - backup_codes
     │                   │                     │
     │                   │ 8. 返回成功         │
     │                   │<────────────────────│
     │                   │                     │
     │ 9. 禁用成功       │                     │
     │<──────────────────│                     │
     │                   │                     │
```

---

## 技术实现细节

### TOTP 算法

```javascript
// 时间计数器
const timeCounter = Math.floor(Date.now() / 1000 / 30)

// HMAC-SHA1 签名
const hmac = crypto.createHmac('sha1', secret)
hmac.update(Buffer.from(timeCounter))
const digest = hmac.digest()

// 动态截断
const offset = digest[19] & 0x0f
const binary =
  ((digest[offset] & 0x7f) << 24) |
  ((digest[offset + 1] & 0xff) << 16) |
  ((digest[offset + 2] & 0xff) << 8) |
  (digest[offset + 3] & 0xff)

// 取模得到 6 位数字
const otp = (binary % 1000000).toString().padStart(6, '0')
```

### 加密存储

```javascript
// AES-256-CBC 加密
function encrypt(text, encryptionKey) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv)

  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])

  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

// 解密
function decrypt(text, encryptionKey) {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = Buffer.from(parts[1], 'hex')

  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString()
}
```

### 速率限制 (Redis)

```javascript
// 记录尝试次数
const attempts = await redis.incr(`2fa:attempts:${userId}`)

// 设置过期时间（5 分钟）
if (attempts === 1) {
  await redis.expire(`2fa:attempts:${userId}`, 300)
}

// 超过限制
if (attempts > 5) {
  throw new Error('验证次数过多，请 5 分钟后重试')
}

// 验证成功后清除
await redis.del(`2fa:attempts:${userId}`)
```

---

**文档版本**: 1.0
**最后更新**: 2025-10-29
