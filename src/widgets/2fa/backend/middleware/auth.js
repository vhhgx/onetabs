/**
 * 认证中间件
 */
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * 验证 JWT Token 中间件
 */
export function authenticate(req, res, next) {
  try {
    // 从请求头获取 Token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      })
    }

    const token = authHeader.substring(7) // 去掉 "Bearer " 前缀

    // 验证 Token
    const decoded = jwt.verify(token, JWT_SECRET)

    // 将用户 ID 添加到请求对象
    req.userId = decoded.userId

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期',
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的令牌',
      })
    }

    return res.status(500).json({
      success: false,
      message: '服务器错误',
    })
  }
}

/**
 * 生成 JWT Token
 * @param {string} userId - 用户 ID
 * @param {string} expiresIn - 过期时间（默认 7 天）
 * @returns {string} JWT Token
 */
export function generateJWT(userId, expiresIn = '7d') {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn })
}

/**
 * 验证 JWT Token（不通过中间件）
 * @param {string} token - JWT Token
 * @returns {Object|null} 解码后的数据或 null
 */
export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}
