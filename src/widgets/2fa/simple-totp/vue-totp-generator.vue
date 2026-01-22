<template>
  <div class="totp-generator">
    <el-card class="generator-card">
      <template #header>
        <div class="card-header">
          <h2>🔐 TOTP 验证码生成器</h2>
          <p class="subtitle">输入密钥，实时生成验证码</p>
        </div>
      </template>

      <!-- 密钥输入 -->
      <div class="input-section">
        <label class="input-label">密钥 (Base32)</label>
        <el-input
          v-model="secret"
          placeholder="请输入密钥，如：YH23545V2Q44CX7P"
          size="large"
          clearable
          @input="handleSecretChange"
        >
          <template #prefix>
            <el-icon>
              <Key />
            </el-icon>
          </template>
        </el-input>
        <p class="hint">支持 Base32 编码的密钥（A-Z, 2-7）</p>
      </div>

      <!-- 验证码显示区域 -->
      <div v-if="secret" class="code-display">
        <div class="code-container">
          <div class="code-label">当前验证码</div>
          <div class="code">{{ currentCode || '------' }}</div>
          <div class="timer-container">
            <el-progress
              :percentage="timerPercentage"
              :color="timerColor"
              :stroke-width="8"
              :show-text="false"
            />
            <div class="timer-text">
              <el-icon :size="20" color="#409eff">
                <Clock />
              </el-icon>
              <span class="remaining-time">{{ remainingSeconds }}</span>
              <span class="time-unit">秒</span>
            </div>
          </div>
        </div>

        <!-- 验证区域 -->
        <el-divider>
          <el-icon>
            <Check />
          </el-icon>
          验证
        </el-divider>

        <div class="verify-section">
          <el-input
            v-model="inputCode"
            placeholder="输入验证码进行验证"
            maxlength="6"
            size="large"
            @keyup.enter="handleVerify"
          >
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
            <template #append>
              <el-button
                type="primary"
                :icon="Check"
                @click="handleVerify"
              >
                验证
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 验证结果 -->
        <transition name="el-fade-in">
          <el-alert
            v-if="verifyResult !== null"
            :type="verifyResult ? 'success' : 'error'"
            :closable="false"
            show-icon
            class="verify-result"
          >
            <template #title>
              {{ verifyResult ? '验证通过' : '验证失败' }}
            </template>
          </el-alert>
        </transition>
      </div>

      <!-- 空状态提示 -->
      <el-empty
        v-else
        description="请输入密钥开始生成验证码"
        :image-size="120"
      >
        <template #image>
          <el-icon :size="100" color="#909399">
            <Key />
          </el-icon>
        </template>
      </el-empty>
    </el-card>

    <!-- 说明卡片 -->
    <el-card class="info-card">
      <template #header>
        <div class="info-header">
          <el-icon :size="20" color="#409eff">
            <InfoFilled />
          </el-icon>
          <span>使用说明</span>
        </div>
      </template>

      <div class="info-content">
        <ul>
          <li>
            <strong>密钥格式：</strong>Base32 编码（A-Z, 2-7），如
            <code>YH23545V2Q44CX7P</code>
          </li>
          <li><strong>验证码：</strong>每 30 秒自动刷新一次</li>
          <li><strong>时间窗口：</strong>允许前后 30 秒误差</li>
          <li>
            <strong>兼容性：</strong>和 Google Authenticator 完全一致
          </li>
        </ul>

        <div class="example-section">
          <p class="example-title">示例密钥（可直接使用）：</p>
          <div class="example-keys">
            <el-button
              v-for="key in exampleKeys"
              :key="key"
              size="small"
              @click="useExampleKey(key)"
            >
              {{ key }}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Key,
  Lock,
  Clock,
  Check,
  InfoFilled,
} from '@element-plus/icons-vue'

defineOptions({ name: 'TOTPGenerator' })

// ========== TOTP 算法实现 ==========
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bits = []

  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32[i].toUpperCase())
    if (val === -1) continue
    bits.push(val.toString(2).padStart(5, '0'))
  }

  const bitString = bits.join('')
  const bytes = []
  for (let i = 0; i + 8 <= bitString.length; i += 8) {
    bytes.push(parseInt(bitString.substr(i, 8), 2))
  }

  return new Uint8Array(bytes)
}

async function generateTOTP(secret, window = 0) {
  const epoch = Math.floor(Date.now() / 1000)
  const timeCounter = Math.floor(epoch / 30) + window

  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setUint32(4, timeCounter, false)

  const key = base32Decode(secret)

  // 使用 Web Crypto API 的 HMAC-SHA1
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer)
  const digest = new Uint8Array(signature)

  const offset = digest[19] & 0x0f
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  const otp = (binary % 1000000).toString().padStart(6, '0')
  return otp
}

async function verifyTOTP(token, secret, windowSize = 1) {
  for (let i = -windowSize; i <= windowSize; i++) {
    const generatedToken = await generateTOTP(secret, i)
    if (generatedToken === token) {
      return true
    }
  }
  return false
}

function getRemainingSeconds() {
  return 30 - (Math.floor(Date.now() / 1000) % 30)
}

// ========== 响应式数据 ==========
const secret = ref('YH23545V2Q44CX7P')
const currentCode = ref('')
const remainingSeconds = ref(30)
const inputCode = ref('')
const verifyResult = ref(null)

// 示例密钥
const exampleKeys = [
  'JBSWY3DPEHPK3PXP',
  'YH23545V2Q44CX7P',
  'MFRGGZDFMZTWQ2LK',
]

// 定时器
let timer = null

// ========== 计算属性 ==========
// 进度条百分比
const timerPercentage = computed(() => {
  return (remainingSeconds.value / 30) * 100
})

// 进度条颜色
const timerColor = computed(() => {
  if (remainingSeconds.value > 20) return '#67c23a'
  if (remainingSeconds.value > 10) return '#e6a23c'
  return '#f56c6c'
})

// ========== 方法 ==========
// 更新验证码
const updateCode = async () => {
  if (secret.value && secret.value.length >= 16) {
    try {
      currentCode.value = await generateTOTP(secret.value)
      remainingSeconds.value = getRemainingSeconds()
    } catch (error) {
      console.error('生成验证码失败:', error)
      currentCode.value = '------'
      ElMessage.error('密钥格式错误，请检查是否为 Base32 格式')
    }
  } else {
    currentCode.value = ''
  }
}

// 密钥输入变化
const handleSecretChange = () => {
  verifyResult.value = null
  inputCode.value = ''
  updateCode()
}

// 验证验证码
const handleVerify = async () => {
  if (!inputCode.value) {
    ElMessage.warning('请输入验证码')
    return
  }

  if (inputCode.value.length !== 6) {
    ElMessage.warning('验证码必须是 6 位数字')
    return
  }

  try {
    const isValid = await verifyTOTP(inputCode.value, secret.value)
    verifyResult.value = isValid

    if (isValid) {
      ElMessage.success('✅ 验证通过！')
    } else {
      ElMessage.error('❌ 验证失败！')
    }

    // 3 秒后清除结果
    setTimeout(() => {
      verifyResult.value = null
    }, 3000)
  } catch (error) {
    ElMessage.error('验证失败：' + error.message)
  }
}

// 使用示例密钥
const useExampleKey = (key) => {
  secret.value = key
  handleSecretChange()
  ElMessage.success('已切换密钥')
}

// ========== 生命周期 ==========
onMounted(() => {
  updateCode()
  timer = setInterval(updateCode, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.totp-generator {
  max-width: 600px;
  margin: 40px auto;
  padding: 0 20px;
}

.generator-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

/* 输入区域 */
.input-section {
  margin-bottom: 32px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #909399;
}

/* 验证码显示区域 */
.code-display {
  margin-top: 24px;
}

.code-container {
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.code-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.code {
  font-size: 56px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  letter-spacing: 12px;
  margin: 20px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.timer-container {
  margin-top: 24px;
}

.timer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 18px;
  font-weight: 600;
}

.remaining-time {
  font-size: 32px;
  font-weight: bold;
}

.time-unit {
  font-size: 14px;
  opacity: 0.9;
}

/* 验证区域 */
.verify-section {
  margin-top: 20px;
}

.verify-result {
  margin-top: 16px;
}

/* 信息卡片 */
.info-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.info-content ul {
  margin: 0;
  padding-left: 20px;
  line-height: 2;
}

.info-content li {
  color: #606266;
  font-size: 14px;
}

.info-content code {
  padding: 2px 6px;
  background: #f5f7fa;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #e74c3c;
  font-size: 13px;
}

.example-section {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.example-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.example-keys {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.example-keys .el-button {
  font-family: 'Courier New', monospace;
}

/* 空状态 */
.el-empty {
  padding: 60px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .totp-generator {
    padding: 0 16px;
  }

  .code {
    font-size: 40px;
    letter-spacing: 8px;
  }

  .code-container {
    padding: 24px 16px;
  }

  .example-keys {
    flex-direction: column;
  }

  .example-keys .el-button {
    width: 100%;
  }
}

/* 动画 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.code {
  animation: pulse 2s ease-in-out infinite;
}
</style>
