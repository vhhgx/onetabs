/**
 * 简单使用示例
 */
import { generateTOTP, verifyTOTP, getRemainingSeconds } from './totp.js'

// ========== 你的密钥 ==========
const mySecret = 'YH23545V2Q44CX7P'

console.log('='.repeat(50))
console.log('TOTP 验证码生成器')
console.log('='.repeat(50))
console.log()

// 生成当前验证码
const code = generateTOTP(mySecret)
const remaining = getRemainingSeconds()

console.log(`📱 密钥: ${mySecret}`)
console.log(`🔑 当前验证码: ${code}`)
console.log(`⏱️  剩余有效时间: ${remaining} 秒`)
console.log()

// 验证测试
console.log('--- 验证测试 ---')
const testCode = code  // 使用刚生成的验证码
const isValid = verifyTOTP(testCode, mySecret)
console.log(`输入验证码: ${testCode}`)
console.log(`验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`)
console.log()

// 模拟错误验证码
console.log('--- 错误验证码测试 ---')
const wrongCode = '000000'
const isWrong = verifyTOTP(wrongCode, mySecret)
console.log(`输入验证码: ${wrongCode}`)
console.log(`验证结果: ${isWrong ? '✅ 通过' : '❌ 失败'}`)
console.log()

console.log('='.repeat(50))
console.log('💡 提示：你可以在 Google Authenticator 中添加')
console.log('   这个密钥，然后对比验证码是否一致！')
console.log('='.repeat(50))
