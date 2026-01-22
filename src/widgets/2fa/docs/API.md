# 2FA API 接口文档

## 基础信息

**Base URL**: `http://localhost:3000/api/auth`

**认证方式**: Bearer Token (JWT)

**Content-Type**: `application/json`

---

## 接口列表

### 1. 启用 2FA - 获取密钥和二维码

**接口**: `POST /2fa/enable`

**认证**: 需要

**描述**: 生成 2FA 密钥和二维码，用于用户扫描绑定

#### 请求

```http
POST /api/auth/2fa/enable
Authorization: Bearer <jwt_token>
```

#### 响应

```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| secret | String | Base32 编码的密钥（用于手动输入） |
| qrCode | String | 二维码 Data URL（用于扫描） |

---

### 2. 验证并正式启用 2FA

**接口**: `POST /2fa/verify`

**认证**: 需要

**描述**: 验证用户输入的验证码，验证通过后正式启用 2FA

#### 请求

```http
POST /api/auth/2fa/verify
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | String | 是 | 6 位 TOTP 验证码 |

#### 响应

```json
{
  "success": true,
  "message": "双因素认证已启用",
  "data": {
    "backupCodes": [
      "12345678",
      "87654321",
      "11112222",
      ...
    ]
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "message": "验证码错误"
}
```

---

### 3. 登录时验证 2FA

**接口**: `POST /login/2fa`

**认证**: 不需要

**描述**: 用户登录时验证 TOTP 验证码

**速率限制**: 5 次/5 分钟

#### 请求

```http
POST /api/auth/login/2fa
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "token": "123456"
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | String | 是 | 用户 ID（由登录接口返回） |
| token | String | 是 | 6 位 TOTP 验证码 |

#### 响应

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "message": "验证码错误"
}
```

```json
{
  "success": false,
  "message": "验证次数过多，请 300 秒后重试"
}
```

---

### 4. 使用备用验证码登录

**接口**: `POST /2fa/backup-code`

**认证**: 不需要

**描述**: 当用户无法使用认证器 APP 时，可以使用备用验证码登录

**速率限制**: 5 次/5 分钟

#### 请求

```http
POST /api/auth/2fa/backup-code
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "backupCode": "12345678"
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | String | 是 | 用户 ID |
| backupCode | String | 是 | 8 位备用验证码 |

#### 响应

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "User Name"
    },
    "remainingBackupCodes": 9
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "message": "备用验证码错误或已使用"
}
```

---

### 5. 禁用 2FA

**接口**: `POST /2fa/disable`

**认证**: 需要

**描述**: 禁用双因素认证，需要验证当前验证码

#### 请求

```http
POST /api/auth/2fa/disable
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | String | 是 | 6 位 TOTP 验证码 |

#### 响应

```json
{
  "success": true,
  "message": "双因素认证已禁用"
}
```

#### 错误响应

```json
{
  "success": false,
  "message": "验证码错误"
}
```

```json
{
  "success": false,
  "message": "2FA 未启用"
}
```

---

### 6. 获取 2FA 状态

**接口**: `GET /2fa/status`

**认证**: 需要

**描述**: 获取当前用户的 2FA 启用状态

#### 请求

```http
GET /api/auth/2fa/status
Authorization: Bearer <jwt_token>
```

#### 响应

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "backupCodesCount": 8
  }
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| enabled | Boolean | 是否已启用 2FA |
| backupCodesCount | Number | 剩余备用验证码数量 |

---

### 7. 重新生成备用验证码

**接口**: `POST /2fa/regenerate-backup-codes`

**认证**: 需要

**描述**: 重新生成备用验证码，旧的备用验证码全部失效

#### 请求

```http
POST /api/auth/2fa/regenerate-backup-codes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | String | 是 | 6 位 TOTP 验证码 |

#### 响应

```json
{
  "success": true,
  "message": "备用验证码已重新生成",
  "data": {
    "backupCodes": [
      "99887766",
      "55443322",
      ...
    ]
  }
}
```

---

## 错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token 无效或过期） |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（速率限制） |
| 500 | 服务器内部错误 |

## 通用错误响应格式

```json
{
  "success": false,
  "message": "错误描述"
}
```

## 使用示例

### JavaScript (Fetch)

```javascript
// 启用 2FA
const response = await fetch('http://localhost:3000/api/auth/2fa/enable', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})

const data = await response.json()
console.log(data.data.qrCode) // 二维码
```

### Axios

```javascript
import axios from 'axios'

// 验证并启用
const { data } = await axios.post(
  'http://localhost:3000/api/auth/2fa/verify',
  { token: '123456' },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
)

console.log(data.data.backupCodes) // 备用验证码
```

---

**文档版本**: 1.0
**最后更新**: 2025-10-29
