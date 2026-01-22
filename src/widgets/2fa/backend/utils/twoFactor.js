/**
 * 双因素认证工具类
 * 基于 TOTP (Time-based One-Time Password) 算法
 */
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'

class TwoFactorAuth {
  /**
   * 生成密钥
   * @param {string} userName - 用户名或邮箱
   * @param {string} appName - 应用名称
   * @returns {Object} { secret, otpauthUrl }
   */
  static generateSecret(userName, appName = 'Cloud Team') {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userName})`,
      issuer: appName,
      length: 20, // 密钥长度
    })

    return {
      secret: secret.base32, // Base32 编码的密钥
      otpauthUrl: secret.otpauth_url, // otpauth:// URL
    }
  }

  /**
   * 生成二维码（Data URL）
   * @param {string} otpauthUrl - otpauth:// URL
   * @returns {Promise<string>} 二维码 Data URL
   */
  static async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
      return qrCodeDataUrl
    } catch (error) {
      throw new Error('生成二维码失败: ' + error.message)
    }
  }

  /**
   * 验证 TOTP 验证码
   * @param {string} token - 用户输入的 6 位验证码
   * @param {string} secret - Base32 编码的密钥
   * @param {number} window - 时间窗口（允许前后 N 个 30 秒周期）
   * @returns {boolean} 是否验证通过
   */
  static verifyToken(token, secret, window = 1) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window, // 允许前后 30 秒的误差
    })
  }

  /**
   * 生成备用验证码
   * @param {number} count - 生成数量（默认 10 个）
   * @returns {Array<string>} 备用验证码数组
   */
  static generateBackupCodes(count = 10) {
    const codes = []
    for (let i = 0; i < count; i++) {
      // 生成 8 位随机数字
      const code = crypto.randomInt(10000000, 99999999).toString()
      codes.push(code)
    }
    return codes
  }

  /**
   * 加密密钥（用于数据库存储）
   * @param {string} text - 明文密钥
   * @param {string} encryptionKey - 加密密钥（32 字节）
   * @returns {string} 加密后的字符串
   */
  static encrypt(text, encryptionKey) {
    const IV_LENGTH = 16
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(encryptionKey),
      iv
    )

    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])

    return iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  /**
   * 解密密钥
   * @param {string} text - 加密后的字符串
   * @param {string} encryptionKey - 加密密钥（32 字节）
   * @returns {string} 明文密钥
   */
  static decrypt(text, encryptionKey) {
    const parts = text.split(':')
    const iv = Buffer.from(parts.shift(), 'hex')
    const encrypted = Buffer.from(parts.join(':'), 'hex')

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(encryptionKey),
      iv
    )

    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString()
  }

  /**
   * 生成当前时间的 TOTP 验证码（用于测试）
   * @param {string} secret - Base32 密钥
   * @returns {string} 6 位验证码
   */
  static generateToken(secret) {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    })
  }
}

export default TwoFactorAuth
