/**
 * Express 服务器启动文件
 */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/auth', authRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
  })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
  })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
  })
})

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/2fa-demo'

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB 连接成功')

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`✓ 服务器运行在 http://localhost:${PORT}`)
      console.log(`✓ 健康检查: http://localhost:${PORT}/health`)
    })
  })
  .catch((error) => {
    console.error('✗ MongoDB 连接失败:', error.message)
    process.exit(1)
  })

// 优雅退出
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...')
  mongoose.connection.close(() => {
    console.log('数据库连接已关闭')
    process.exit(0)
  })
})
