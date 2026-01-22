/**
 * 2FA 认证路由
 */
import express from 'express'
import bcrypt from 'bcrypt'
import TwoFactorAuth from '../utils/twoFactor.js'
import { authenticate, generateJWT } from '../middleware/auth.js'
import {
  twoFactorRateLimit,
  clearRateLimit,
} from '../middleware/rateLimit.js'
import User from '../models/User.js'

const router = express.Router()

// 加密密钥（从环境变量读取）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')

/**
 * POST /api/auth/2fa/enable
 * 启用 2FA - 生成密钥和二维码
 */
router.post('/2fa/enable', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      })
    }

    // 生成密钥
    const { secret, otpauthUrl } = TwoFactorAuth.generateSecret(
      user.email,
      'Cloud Team'
    )

    // 生成二维码
    const qrCode = await TwoFactorAuth.generateQRCode(otpauthUrl)

    // 临时存储密钥（待验证后正式启用）
    user.two_factor_secret_temp = secret
    await user.save()

    res.json({
      success: true,
      data: {
        secret,
        qrCode,
      },
    })
  } catch (error) {
    console.error('启用 2FA 失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
    })
  }
})

/**
 * POST /api/auth/2fa/verify
 * 验证并正式启用 2FA
 */
router.post('/2fa/verify', authenticate, async (req, res) => {
  try {
    const { token } = req.body

    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        message: '验证码格式错误',
      })
    }

    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      })
    }

    const secret = user.two_factor_secret_temp

    if (!secret) {
      return res.status(400).json({
        success: false,
        message: '请先获取二维码',
      })
    }

    // 验证 TOTP
    const isValid = TwoFactorAuth.verifyToken(token, secret)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '验证码错误',
      })
    }

    // 生成备用验证码
    const backupCodes = TwoFactorAuth.generateBackupCodes()

    // 哈希存储备用验证码
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    )

    // 加密密钥后存储
    const encryptedSecret = TwoFactorAuth.encrypt(secret, ENCRYPTION_KEY)

    // 正式启用 2FA
    user.two_factor_secret = encryptedSecret
    user.two_factor_enabled = true
    user.backup_codes = JSON.stringify(hashedBackupCodes)
    user.two_factor_secret_temp = undefined
    await user.save()

    res.json({
      success: true,
      message: '双因素认证已启用',
      data: {
        backupCodes, // 返回明文备用验证码供用户保存
      },
    })
  } catch (error) {
    console.error('验证 2FA 失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
    })
  }
})

/**
 * POST /api/auth/login/2fa
 * 登录时验证 2FA
 */
router.post('/login/2fa', twoFactorRateLimit(), async (req, res) => {
  try {
    const { userId, token } = req.body

    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        message: '验证码格式错误',
      })
    }

    const user = await User.findById(userId)

    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: '用户不存在或未启用 2FA',
      })
    }

    // 解密密钥
    const secret = TwoFactorAuth.decrypt(
      user.two_factor_secret,
      ENCRYPTION_KEY
    )

    // 验证 TOTP
    const isValid = TwoFactorAuth.verifyToken(token, secret)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '验证码错误',
      })
    }

    // 清除速率限制
    await clearRateLimit(userId)

    // 生成 JWT Token
    const jwtToken = generateJWT(user._id)

    res.json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
    })
  } catch (error) {
    console.error('2FA 登录失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
    })
  }
})

/**
 * POST /api/auth/2fa/backup-code
 * 使用备用验证码登录
 */
router.post('/2fa/backup-code', twoFactorRateLimit(), async (req, res) => {
  try {
    const { userId, backupCode } = req.body

    if (!backupCode || backupCode.length !== 8) {
      return res.status(400).json({
        success: false,
        message: '备用验证码格式错误',
      })
    }

    const user = await User.findById(userId)

    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: '用户不存在或未启用 2FA',
      })
    }

    // 获取备用验证码
    const hashedBackupCodes = JSON.parse(user.backup_codes || '[]')

    // 验证备用验证码
    let isValid = false
    let usedIndex = -1

    for (let i = 0; i < hashedBackupCodes.length; i++) {
      const match = await bcrypt.compare(backupCode, hashedBackupCodes[i])
      if (match) {
        isValid = true
        usedIndex = i
        break
      }
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '备用验证码错误或已使用',
      })
    }

    // 移除已使用的备用验证码
    hashedBackupCodes.splice(usedIndex, 1)
    user.backup_codes = JSON.stringify(hashedBackupCodes)
    await user.save()

    // 清除速率限制
    await clearRateLimit(userId)

    // 生成 JWT Token
    const jwtToken = generateJWT(user._id)

    res.json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        remainingBackupCodes: hashedBackupCodes.length,
      },
    })
  } catch (error) {
    console.error('备用验证码登录失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
    })
  }
})

/**
 * POST /api/auth/2fa/disable
 * 禁用 2FA
 */
router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const { token } = req.body

    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        message: '验证码格式错误',
      })
    }

    const user = await User.findById(req.userId)

    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA 未启用',
      })
    }

    // 解密密钥
    const secret = TwoFactorAuth.decrypt(
      user.two_factor_secret,
      ENCRYPTION_KEY
    )

    // 验证后才能禁用
    const isValid = TwoFactorAuth.verifyToken(token, secret)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '验证码错误',
      })
    }

    // 禁用 2FA
    user.two_factor_enabled = false
    user.two_factor_secret = undefined
    user.backup_codes = undefined
    await user.save()

    res.json({
      success: true,
      message: '双因素认证已禁用',
    })
  } catch (error) {
    console.error('禁用 2FA 失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
    })
  }
})

/**
 * GET /api/auth/2fa/status
 * 获取 2FA 状态
 */
router.get('/2fa/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      })
    }

    const backupCodesCount = user.backup_codes
      ? JSON.parse(user.backup_codes).length
      : 0

    res.json({
      success: true,
      data: {
        enabled: user.two_factor_enabled || false,
        backupCodesCount,
      },
    })
  } catch (error) {
    console.error('获取 2FA 状态失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
    })
  }
})

/**
 * POST /api/auth/2fa/regenerate-backup-codes
 * 重新生成备用验证码
 */
router.post('/2fa/regenerate-backup-codes', authenticate, async (req, res) => {
  try {
    const { token } = req.body

    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        message: '验证码格式错误',
      })
    }

    const user = await User.findById(req.userId)

    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA 未启用',
      })
    }

    // 解密密钥
    const secret = TwoFactorAuth.decrypt(
      user.two_factor_secret,
      ENCRYPTION_KEY
    )

    // 验证后才能重新生成
    const isValid = TwoFactorAuth.verifyToken(token, secret)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '验证码错误',
      })
    }

    // 生成新的备用验证码
    const backupCodes = TwoFactorAuth.generateBackupCodes()

    // 哈希存储
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    )

    user.backup_codes = JSON.stringify(hashedBackupCodes)
    await user.save()

    res.json({
      success: true,
      message: '备用验证码已重新生成',
      data: {
        backupCodes, // 返回明文备用验证码
      },
    })
  } catch (error) {
    console.error('重新生成备用验证码失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
    })
  }
})

export default router
