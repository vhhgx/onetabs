# 双因素认证 (2FA) 完整实现

基于 **TOTP (Time-based One-Time Password)** 算法的双因素认证系统完整实现。

## 📋 目录结构

```
2fa/
├── frontend/              # 前端 Vue 3 实现
│   ├── api/              # API 请求封装
│   │   ├── auth.js       # 2FA 认证 API
│   │   └── request.js    # Axios 请求配置
│   ├── views/            # 页面组件
│   │   ├── TwoFactorSetup.vue       # 启用 2FA 页面
│   │   ├── TwoFactorVerify.vue      # 登录验证页面
│   │   └── SecuritySettings.vue     # 安全设置页面
│   └── components/       # 可复用组件
├── backend/              # 后端 Node.js 实现
│   ├── routes/          # API 路由
│   │   └── auth.js      # 2FA 认证路由
│   ├── models/          # 数据模型
│   │   ├── User.js      # Mongoose 用户模型
│   │   └── User.sql     # SQL 表结构
│   ├── middleware/      # 中间件
│   │   ├── auth.js      # JWT 认证中间件
│   │   └── rateLimit.js # 速率限制中间件
│   ├── utils/           # 工具函数
│   │   └── twoFactor.js # 2FA 核心工具类
│   ├── server.js        # 服务器入口
│   ├── package.json     # 依赖配置
│   └── .env.example     # 环境变量示例
└── docs/                # 文档
    ├── README.md        # 本文件
    ├── API.md           # API 文档
    └── FLOW.md          # 流程说明
```

## ✨ 功能特性

### 核心功能
- ✅ **启用 2FA**：生成密钥、二维码，用户扫码绑定
- ✅ **验证登录**：使用 TOTP 验证码二次验证
- ✅ **备用验证码**：10 个一次性备用验证码
- ✅ **禁用 2FA**：验证后可禁用
- ✅ **重新生成备用码**：旧备用码全部失效

### 安全特性
- 🔒 **密钥加密存储**：AES-256-CBC 加密
- 🔒 **备用码哈希**：bcrypt 哈希存储
- 🔒 **速率限制**：防暴力破解（5 次/5 分钟）
- 🔒 **JWT 认证**：Token 过期验证
- 🔒 **时间窗口容错**：前后 30 秒误差

### 用户体验
- 📱 二维码扫描绑定
- 🔑 手动输入密钥支持
- 💾 备用验证码下载/复制
- ⚡ 实时验证反馈
- 📊 剩余备用码数量显示

## 🚀 快速开始

### 1. 安装依赖

#### 前端

```bash
cd frontend
npm install qrcode
```

#### 后端

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 生成 JWT 密钥
JWT_SECRET=$(openssl rand -hex 32)

# 生成加密密钥（32 字节）
ENCRYPTION_KEY=$(openssl rand -hex 32)

# MongoDB 连接
MONGODB_URI=mongodb://localhost:27017/your-db-name
```

### 3. 启动服务

#### 后端

```bash
cd backend
npm run dev
```

#### 前端

将 Vue 组件集成到你的前端项目中，配置路由：

```javascript
// router/index.js
import TwoFactorSetup from '@/views/TwoFactorSetup.vue'
import TwoFactorVerify from '@/views/TwoFactorVerify.vue'
import SecuritySettings from '@/views/SecuritySettings.vue'

const routes = [
  {
    path: '/settings/2fa/setup',
    component: TwoFactorSetup,
    meta: { requiresAuth: true },
  },
  {
    path: '/login/2fa',
    component: TwoFactorVerify,
  },
  {
    path: '/settings/security',
    component: SecuritySettings,
    meta: { requiresAuth: true },
  },
]
```

## 📖 使用流程

### 启用 2FA

1. 用户进入安全设置页面
2. 点击"启用双因素认证"
3. 后端生成密钥并返回二维码
4. 用户使用认证器 APP 扫描二维码
5. 用户输入验证码确认绑定
6. 后端验证通过，生成 10 个备用验证码
7. 用户保存备用验证码

### 登录验证

1. 用户输入账号密码登录
2. 后端验证通过，检测到已启用 2FA
3. 返回临时 userId，跳转到 2FA 验证页面
4. 用户输入 TOTP 验证码
5. 后端验证通过，返回 JWT Token
6. 登录成功

### 备用验证码

当用户无法使用认证器 APP 时：

1. 点击"使用备用验证码"
2. 输入 8 位备用验证码
3. 后端验证通过，该备用码失效
4. 登录成功

## 🔧 技术实现

### TOTP 算法原理

```
TOTP = HOTP(Secret, TimeCounter)

TimeCounter = floor(CurrentTime / 30)
```

- **Secret**: 共享密钥（Base32 编码）
- **TimeCounter**: 时间计数器（30 秒为一个周期）
- **HOTP**: HMAC-based One-Time Password

### 核心代码

#### 生成密钥

```javascript
import speakeasy from 'speakeasy'

const { secret, otpauthUrl } = speakeasy.generateSecret({
  name: 'Cloud Team (user@example.com)',
  issuer: 'Cloud Team',
  length: 20,
})
```

#### 验证 TOTP

```javascript
const isValid = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: 'base32',
  token: '123456',
  window: 1, // 允许前后 30 秒误差
})
```

#### 生成二维码

```javascript
import QRCode from 'qrcode'

const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
// 返回: data:image/png;base64,...
```

## 🔐 安全最佳实践

### 1. 密钥加密存储

```javascript
// ❌ 错误：明文存储
user.two_factor_secret = 'JBSWY3DPEHPK3PXP'

// ✅ 正确：加密存储
const encrypted = TwoFactorAuth.encrypt(secret, ENCRYPTION_KEY)
user.two_factor_secret = encrypted
```

### 2. 备用码哈希存储

```javascript
// ✅ 正确：使用 bcrypt 哈希
const hashedCodes = await Promise.all(
  backupCodes.map(code => bcrypt.hash(code, 10))
)
```

### 3. 速率限制

```javascript
// 防止暴力破解：5 次/5 分钟
router.post('/login/2fa', twoFactorRateLimit(5, 5 * 60 * 1000), handler)
```

### 4. HTTPS 传输

生产环境必须使用 HTTPS 协议传输数据。

## 📱 推荐的认证器 APP

| APP | 平台 | 特点 |
|-----|------|------|
| Google Authenticator | iOS / Android | 最流行，简单易用 |
| Microsoft Authenticator | iOS / Android | 功能丰富，支持云备份 |
| Authy | iOS / Android / Desktop | 多设备同步，云备份 |
| 1Password | iOS / Android / Desktop | 密码管理器内置 2FA |
| FreeOTP | iOS / Android | 开源免费 |

## 🌐 API 接口

### 启用 2FA

```http
POST /api/auth/2fa/enable
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,..."
  }
}
```

### 验证并启用

```http
POST /api/auth/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}

Response:
{
  "success": true,
  "message": "双因素认证已启用",
  "data": {
    "backupCodes": ["12345678", "87654321", ...]
  }
}
```

### 登录验证

```http
POST /api/auth/login/2fa
Content-Type: application/json

{
  "userId": "user_id",
  "token": "123456"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

更多 API 文档请查看 [API.md](./docs/API.md)

## 🛠️ 开发工具

### 测试 TOTP 生成

```javascript
import TwoFactorAuth from './backend/utils/twoFactor.js'

const secret = 'JBSWY3DPEHPK3PXP'
const token = TwoFactorAuth.generateToken(secret)
console.log('当前验证码:', token) // 123456
```

### 验证码在线工具

- [TOTP 生成器](https://totp.danhersam.com/)
- [Base32 编解码](https://cryptii.com/pipes/base32)

## 📊 数据库表结构

### MongoDB (Mongoose)

```javascript
{
  email: String,
  two_factor_enabled: Boolean,
  two_factor_secret: String,      // 加密后的密钥
  two_factor_secret_temp: String, // 临时密钥
  backup_codes: String,           // JSON 数组（哈希后）
}
```

### SQL

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  backup_codes TEXT,
  ...
);
```

## 🐛 故障排查

### 验证码总是错误

1. 检查服务器时间是否准确
2. 确认密钥正确传输
3. 增加时间窗口 `window: 2`

### Redis 连接失败

如果没有 Redis，会自动降级为内存存储，不影响功能。

### 二维码无法识别

1. 检查 otpauthUrl 格式
2. 确认二维码清晰度
3. 尝试手动输入密钥

## 📚 相关资源

- [RFC 6238 - TOTP 规范](https://datatracker.ietf.org/doc/html/rfc6238)
- [RFC 4226 - HOTP 规范](https://datatracker.ietf.org/doc/html/rfc4226)
- [Google Authenticator PAM](https://github.com/google/google-authenticator-libpam)
- [Speakeasy 文档](https://github.com/speakeasyjs/speakeasy)

## 📄 许可证

MIT License

---

**作者**: Cloud Team
**最后更新**: 2025-10-29
