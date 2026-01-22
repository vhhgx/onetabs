/**
 * 速率限制中间件（防暴力破解）
 */
import Redis from 'ioredis'

// Redis 客户端（如果没有 Redis，使用内存存储）
let redis = null
const memoryStore = new Map()

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  })

  redis.on('error', (err) => {
    console.warn('Redis 连接失败，使用内存存储:', err.message)
    redis = null
  })
} catch (error) {
  console.warn('Redis 初始化失败，使用内存存储')
}

/**
 * 2FA 验证速率限制
 * @param {number} maxAttempts - 最大尝试次数（默认 5 次）
 * @param {number} windowMs - 时间窗口（毫秒，默认 5 分钟）
 */
export function twoFactorRateLimit(maxAttempts = 5, windowMs = 5 * 60 * 1000) {
  return async (req, res, next) => {
    const userId = req.body.userId || req.userId

    if (!userId) {
      return next()
    }

    const key = `2fa:attempts:${userId}`

    try {
      // 使用 Redis
      if (redis) {
        const attempts = await redis.incr(key)

        if (attempts === 1) {
          await redis.expire(key, Math.floor(windowMs / 1000))
        }

        if (attempts > maxAttempts) {
          const ttl = await redis.ttl(key)
          return res.status(429).json({
            success: false,
            message: `验证次数过多，请 ${ttl} 秒后重试`,
          })
        }
      }
      // 使用内存存储
      else {
        const now = Date.now()
        const record = memoryStore.get(key) || { count: 0, resetTime: now + windowMs }

        // 重置计数器
        if (now > record.resetTime) {
          record.count = 1
          record.resetTime = now + windowMs
        } else {
          record.count++
        }

        memoryStore.set(key, record)

        if (record.count > maxAttempts) {
          const remainingMs = record.resetTime - now
          return res.status(429).json({
            success: false,
            message: `验证次数过多，请 ${Math.ceil(remainingMs / 1000)} 秒后重试`,
          })
        }
      }

      next()
    } catch (error) {
      console.error('速率限制检查失败:', error)
      next() // 出错时继续执行
    }
  }
}

/**
 * 清除速率限制记录（验证成功后调用）
 * @param {string} userId - 用户 ID
 */
export async function clearRateLimit(userId) {
  const key = `2fa:attempts:${userId}`

  try {
    if (redis) {
      await redis.del(key)
    } else {
      memoryStore.delete(key)
    }
  } catch (error) {
    console.error('清除速率限制失败:', error)
  }
}
