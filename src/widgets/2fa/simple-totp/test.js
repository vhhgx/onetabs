/**
 * TOTP 测试示例
 */
import { generateTOTP, verifyTOTP, getRemainingSeconds } from './totp.js'

// ========== 示例 1：生成验证码 ==========
console.log('========== 示例 1：生成验证码 ==========')
const secret = 'JBSWY3DPEHPK3PXP'
const code = generateTOTP(secret)
console.log(`密钥: ${secret}`)
console.log(`当前验证码: ${code}`)
console.log(`剩余有效时间: ${getRemainingSeconds()} 秒`)
console.log()

// ========== 示例 2：验证验证码 ==========
console.log('========== 示例 2：验证验证码 ==========')
const userInput = code // 模拟用户输入
const isValid = verifyTOTP(userInput, secret)
console.log(`用户输入: ${userInput}`)
console.log(`验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`)
console.log()

// ========== 示例 3：验证错误的验证码 ==========
console.log('========== 示例 3：验证错误的验证码 ==========')
const wrongCode = '000000'
const isWrong = verifyTOTP(wrongCode, secret)
console.log(`用户输入: ${wrongCode}`)
console.log(`验证结果: ${isWrong ? '✅ 通过' : '❌ 失败'}`)
console.log()

// ========== 示例 4：实时监控验证码变化 ==========
console.log('========== 示例 4：实时监控验证码变化（按 Ctrl+C 退出）==========')
let lastCode = ''
setInterval(() => {
  const currentCode = generateTOTP(secret)
  const remaining = getRemainingSeconds()

  if (currentCode !== lastCode) {
    console.log(`🔄 验证码已更新: ${currentCode} (有效期: ${remaining} 秒)`)
    lastCode = currentCode
  } else {
    process.stdout.write(`\r⏱️  当前验证码: ${currentCode} | 剩余: ${remaining} 秒  `)
  }
}, 1000)
