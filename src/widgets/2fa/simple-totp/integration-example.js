/**
 * 集成示例：在实际项目中使用
 */

// ========== 示例 1：前端验证场景 ==========
import { generateTOTP, verifyTOTP, getRemainingSeconds } from './totp.js'

// 用户场景：用户输入密钥和验证码，本地验证
function localVerification() {
  const userSecret = 'YH23545V2Q44CX7P'  // 用户的密钥
  const userInput = '123456'              // 用户输入的验证码

  const isValid = verifyTOTP(userInput, userSecret)

  if (isValid) {
    console.log('✅ 验证通过！')
    return true
  } else {
    console.log('❌ 验证失败！')
    return false
  }
}

// ========== 示例 2：实时显示验证码（前端倒计时） ==========
function realtimeDisplay() {
  const secret = 'YH23545V2Q44CX7P'

  console.log('\n⏰ 实时验证码（按 Ctrl+C 退出）:')
  console.log('-'.repeat(40))

  let lastCode = ''

  const timer = setInterval(() => {
    const code = generateTOTP(secret)
    const remaining = getRemainingSeconds()

    if (code !== lastCode) {
      console.log(`\n🔄 验证码更新: ${code} (${remaining} 秒)`)
      lastCode = code
    } else {
      process.stdout.write(`\r🔑 ${code} | ⏱️  ${remaining.toString().padStart(2, '0')} 秒  `)
    }
  }, 1000)

  // 10 秒后自动停止
  setTimeout(() => {
    clearInterval(timer)
    console.log('\n\n✅ 演示结束')
  }, 10000)
}

// ========== 示例 3：Express API 接口 ==========
// 如果你有 Express 后端，可以这样用：

/*
import express from 'express'
import { verifyTOTP } from './totp.js'

const app = express()
app.use(express.json())

// API：验证 2FA 验证码
app.post('/api/verify-2fa', (req, res) => {
  const { secret, token } = req.body

  if (!secret || !token) {
    return res.status(400).json({
      success: false,
      message: '缺少参数'
    })
  }

  const isValid = verifyTOTP(token, secret)

  res.json({
    success: isValid,
    message: isValid ? '验证通过' : '验证失败'
  })
})

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000')
})
*/

// ========== 示例 4：CLI 工具 ==========
function cliTool() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('用法:')
    console.log('  node integration-example.js <密钥>              # 生成验证码')
    console.log('  node integration-example.js <密钥> <验证码>    # 验证验证码')
    console.log('\n示例:')
    console.log('  node integration-example.js YH23545V2Q44CX7P')
    console.log('  node integration-example.js YH23545V2Q44CX7P 123456')
    return
  }

  const secret = args[0]

  if (args.length === 1) {
    // 生成验证码
    const code = generateTOTP(secret)
    const remaining = getRemainingSeconds()
    console.log(`\n🔑 验证码: ${code}`)
    console.log(`⏱️  剩余: ${remaining} 秒\n`)
  } else {
    // 验证验证码
    const token = args[1]
    const isValid = verifyTOTP(token, secret)
    console.log(`\n${isValid ? '✅ 验证通过' : '❌ 验证失败'}\n`)
  }
}

// ========== 运行示例 ==========
console.log('='.repeat(50))
console.log('TOTP 集成示例')
console.log('='.repeat(50))

// 1. 本地验证
console.log('\n【示例 1：本地验证】')
localVerification()

// 2. 实时显示（自动运行 10 秒）
console.log('\n【示例 2：实时显示验证码】')
realtimeDisplay()

// 如果提供了命令行参数，运行 CLI 工具
if (process.argv.length > 2) {
  console.log('\n【命令行工具模式】')
  cliTool()
}
