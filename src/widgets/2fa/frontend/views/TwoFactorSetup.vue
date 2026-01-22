<template>
  <div class="two-factor-setup">
    <el-card class="setup-card">
      <template #header>
        <div class="card-header">
          <h3>启用双因素认证</h3>
          <p class="subtitle">增强您的账户安全性</p>
        </div>
      </template>

      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="扫描二维码" />
        <el-step title="输入验证码" />
        <el-step title="保存备用码" />
      </el-steps>

      <!-- 步骤 1: 显示二维码 -->
      <div v-if="activeStep === 0" class="step-content">
        <div class="step-title">
          <el-icon :size="24" color="#409eff">
            <Iphone />
          </el-icon>
          <h4>使用认证器 APP 扫描二维码</h4>
        </div>

        <div class="qr-section">
          <div v-loading="loading" class="qr-code-container">
            <img v-if="qrCode" :src="qrCode" alt="2FA QR Code" />
          </div>

          <div class="instructions">
            <p><strong>推荐的认证器 APP：</strong></p>
            <ul>
              <li>Google Authenticator</li>
              <li>Microsoft Authenticator</li>
              <li>Authy</li>
            </ul>
          </div>
        </div>

        <div class="secret-section">
          <p class="secret-label">无法扫描？手动输入密钥：</p>
          <div class="secret-key">
            <code>{{ secret }}</code>
            <el-button
              :icon="DocumentCopy"
              size="small"
              @click="copySecret"
              text
            >
              复制
            </el-button>
          </div>
        </div>

        <div class="step-actions">
          <el-button type="primary" size="large" @click="nextStep">
            下一步
          </el-button>
        </div>
      </div>

      <!-- 步骤 2: 验证码输入 -->
      <div v-if="activeStep === 1" class="step-content">
        <div class="step-title">
          <el-icon :size="24" color="#67c23a">
            <Key />
          </el-icon>
          <h4>验证认证器</h4>
        </div>

        <p class="step-desc">请输入认证器 APP 中显示的 6 位验证码：</p>

        <el-input
          v-model="verificationCode"
          placeholder="000000"
          maxlength="6"
          class="verification-input"
          size="large"
          @keyup.enter="verifyAndEnable"
        >
          <template #prefix>
            <el-icon>
              <Lock />
            </el-icon>
          </template>
        </el-input>

        <div class="step-actions">
          <el-button size="large" @click="prevStep">上一步</el-button>
          <el-button
            type="primary"
            size="large"
            :loading="verifying"
            @click="verifyAndEnable"
          >
            验证并启用
          </el-button>
        </div>
      </div>

      <!-- 步骤 3: 显示备用验证码 -->
      <div v-if="activeStep === 2" class="step-content">
        <div class="step-title">
          <el-icon :size="24" color="#67c23a">
            <CircleCheck />
          </el-icon>
          <h4>双因素认证已启用！</h4>
        </div>

        <el-alert
          type="warning"
          :closable="false"
          show-icon
          class="backup-alert"
        >
          <template #title>
            <strong>请保存以下备用验证码</strong>
          </template>
          <p>
            当您无法使用认证器 APP 时，可以使用这些备用验证码登录。每个验证码只能使用一次。
          </p>
        </el-alert>

        <div class="backup-codes">
          <div
            v-for="(code, index) in backupCodes"
            :key="index"
            class="backup-code-item"
          >
            <span class="code-number">{{ index + 1 }}.</span>
            <code class="backup-code">{{ code }}</code>
          </div>
        </div>

        <div class="backup-actions">
          <el-button :icon="DocumentCopy" @click="copyBackupCodes">
            复制所有验证码
          </el-button>
          <el-button :icon="Download" @click="downloadBackupCodes">
            下载为文本文件
          </el-button>
        </div>

        <div class="step-actions">
          <el-button type="primary" size="large" @click="finish">
            完成设置
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Iphone,
  Key,
  Lock,
  CircleCheck,
  DocumentCopy,
  Download,
} from '@element-plus/icons-vue'
import { enable2FA, verify2FA } from '../api/auth'

defineOptions({ name: 'TwoFactorSetup' })

const router = useRouter()

const activeStep = ref(0)
const loading = ref(false)
const qrCode = ref('')
const secret = ref('')
const verificationCode = ref('')
const verifying = ref(false)
const backupCodes = ref([])

// 获取二维码
onMounted(async () => {
  loading.value = true
  try {
    const res = await enable2FA()
    qrCode.value = res.data.qrCode
    secret.value = res.data.secret
  } catch (error) {
    ElMessage.error('获取二维码失败')
  } finally {
    loading.value = false
  }
})

// 复制密钥
const copySecret = () => {
  navigator.clipboard.writeText(secret.value)
  ElMessage.success('密钥已复制到剪贴板')
}

// 下一步
const nextStep = () => {
  if (activeStep.value === 0 && !qrCode.value) {
    ElMessage.warning('请等待二维码加载完成')
    return
  }
  activeStep.value++
}

// 上一步
const prevStep = () => {
  activeStep.value--
  verificationCode.value = ''
}

// 验证并启用
const verifyAndEnable = async () => {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    ElMessage.warning('请输入 6 位验证码')
    return
  }

  verifying.value = true
  try {
    const res = await verify2FA({
      token: verificationCode.value,
    })

    ElMessage.success('双因素认证已启用')
    backupCodes.value = res.data.backupCodes
    activeStep.value++
  } catch (error) {
    ElMessage.error(error.message || '验证码错误，请重试')
    verificationCode.value = ''
  } finally {
    verifying.value = false
  }
}

// 复制备用验证码
const copyBackupCodes = () => {
  const text = backupCodes.value
    .map((code, index) => `${index + 1}. ${code}`)
    .join('\n')
  navigator.clipboard.writeText(text)
  ElMessage.success('备用验证码已复制到剪贴板')
}

// 下载备用验证码
const downloadBackupCodes = () => {
  const text = `双因素认证备用验证码
生成时间: ${new Date().toLocaleString()}

重要提示：
- 每个验证码只能使用一次
- 请将此文件保存在安全的地方
- 不要与他人分享这些验证码

备用验证码：
${backupCodes.value.map((code, index) => `${index + 1}. ${code}`).join('\n')}
`

  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup-codes-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('备用验证码已下载')
}

// 完成
const finish = () => {
  router.push('/settings/security')
}
</script>

<style scoped>
.two-factor-setup {
  max-width: 700px;
  margin: 40px auto;
  padding: 0 20px;
}

.setup-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  text-align: center;
}

.card-header h3 {
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

.el-steps {
  margin: 30px 0 40px 0;
}

.step-content {
  min-height: 400px;
}

.step-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.step-title h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.step-desc {
  text-align: center;
  color: #606266;
  margin-bottom: 24px;
}

/* 二维码部分 */
.qr-section {
  display: flex;
  gap: 32px;
  margin: 32px 0;
  justify-content: center;
  align-items: flex-start;
}

.qr-code-container {
  flex-shrink: 0;
  padding: 16px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.qr-code-container img {
  display: block;
  width: 200px;
  height: 200px;
}

.instructions {
  flex: 1;
  padding: 16px;
  background: #f4f4f5;
  border-radius: 8px;
}

.instructions p {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #303133;
}

.instructions ul {
  margin: 0;
  padding-left: 20px;
}

.instructions li {
  margin: 8px 0;
  color: #606266;
}

/* 密钥部分 */
.secret-section {
  margin: 24px 0;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.secret-label {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.secret-key {
  display: flex;
  align-items: center;
  gap: 12px;
}

.secret-key code {
  flex: 1;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #e74c3c;
  letter-spacing: 2px;
}

/* 验证码输入 */
.verification-input {
  width: 280px;
  margin: 0 auto 32px auto;
  display: block;
}

.verification-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 8px;
  padding: 12px 20px;
}

/* 备用验证码 */
.backup-alert {
  margin-bottom: 24px;
}

.backup-alert p {
  margin: 8px 0 0 0;
  font-size: 14px;
}

.backup-codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 24px 0;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.backup-code-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.code-number {
  font-size: 14px;
  font-weight: 600;
  color: #909399;
}

.backup-code {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 1px;
}

.backup-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
}

/* 操作按钮 */
.step-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

/* 响应式 */
@media (max-width: 768px) {
  .qr-section {
    flex-direction: column;
  }

  .backup-codes {
    grid-template-columns: 1fr;
  }

  .step-actions {
    flex-direction: column;
  }

  .step-actions .el-button {
    width: 100%;
  }
}
</style>
