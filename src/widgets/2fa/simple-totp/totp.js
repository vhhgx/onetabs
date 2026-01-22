/**
 * 纯 TOTP 验证码计算工具
 * 输入密钥，输出 6 位验证码
 */
import crypto from 'crypto'

/**
 * Base32 解码
 */
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bits = []

  // 转换为二进制
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32[i].toUpperCase())
    if (val === -1) continue
    bits.push(val.toString(2).padStart(5, '0'))
  }

  // 转换为字节数组
  const bitString = bits.join('')
  const bytes = []
  for (let i = 0; i + 8 <= bitString.length; i += 8) {
    bytes.push(parseInt(bitString.substr(i, 8), 2))
  }

  return Buffer.from(bytes)
}

/**
 * 生成 TOTP 验证码
 * @param {string} secret - Base32 编码的密钥（如 "JBSWY3DPEHPK3PXP"）
 * @param {number} time - 时间戳（秒），默认为当前时间
 * @param {number} window - 时间窗口偏移（默认 0）
 * @returns {string} 6 位验证码
 */
export function generateTOTP(secret, time = null, window = 0) {
  // 1. 使用当前时间或指定时间
  const epoch = time || Math.floor(Date.now() / 1000)

  // 2. 计算时间计数器（30 秒为一个周期）
  const timeCounter = Math.floor(epoch / 30) + window

  // 3. 将时间计数器转为 8 字节大端序
  const buffer = Buffer.alloc(8)
  let counter = timeCounter
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff
    counter = counter >> 8
  }

  // 4. Base32 解码密钥
  const key = base32Decode(secret)

  // 5. HMAC-SHA1 签名
  const hmac = crypto.createHmac('sha1', key)
  hmac.update(buffer)
  const digest = hmac.digest()

  // 6. 动态截断（Dynamic Truncation）
  const offset = digest[19] & 0x0f
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  // 7. 取模得到 6 位数字
  const otp = (binary % 1000000).toString().padStart(6, '0')

  return otp
}

/**
 * 验证 TOTP 验证码
 * @param {string} token - 用户输入的 6 位验证码
 * @param {string} secret - Base32 密钥
 * @param {number} windowSize - 时间窗口大小（允许前后偏移）
 * @returns {boolean} 是否验证通过
 */
export function verifyTOTP(token, secret, windowSize = 1) {
  // 验证当前时间 ± windowSize 个时间窗口
  for (let i = -windowSize; i <= windowSize; i++) {
    const generatedToken = generateTOTP(secret, null, i)
    if (generatedToken === token) {
      return true
    }
  }
  return false
}

/**
 * 获取剩余秒数（距离下一个验证码生成）
 * @returns {number} 剩余秒数（0-30）
 */
export function getRemainingSeconds() {
  return 30 - (Math.floor(Date.now() / 1000) % 30)
}
