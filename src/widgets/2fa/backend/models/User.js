/**
 * 用户数据模型 (Mongoose)
 */
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    // 基本信息
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    // 2FA 相关字段
    two_factor_enabled: {
      type: Boolean,
      default: false,
    },
    two_factor_secret: {
      type: String, // 加密后的密钥
      select: false, // 默认查询不返回
    },
    two_factor_secret_temp: {
      type: String, // 临时密钥（启用过程中）
      select: false,
    },
    backup_codes: {
      type: String, // JSON 字符串数组（哈希后的备用验证码）
      select: false,
    },

    // 其他字段
    avatar: String,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active',
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
  }
)

// 索引
userSchema.index({ email: 1 })

// 虚拟字段：2FA 状态
userSchema.virtual('has2FA').get(function () {
  return this.two_factor_enabled
})

// 实例方法：验证密码
userSchema.methods.verifyPassword = async function (password) {
  const bcrypt = await import('bcrypt')
  return bcrypt.compare(password, this.password)
}

// 静态方法：根据 ID 查找用户（包含 2FA 字段）
userSchema.statics.findByIdWith2FA = function (id) {
  return this.findById(id).select(
    '+two_factor_secret +two_factor_secret_temp +backup_codes'
  )
}

const User = mongoose.model('User', userSchema)

export default User
