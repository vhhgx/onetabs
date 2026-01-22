<template>
  <div class="security-settings">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h3>安全设置</h3>
          <p class="subtitle">管理您的账号安全选项</p>
        </div>
      </template>

      <!-- 2FA 设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <div class="section-info">
            <el-icon :size="24" color="#409eff">
              <Lock />
            </el-icon>
            <div>
              <h4>双因素认证 (2FA)</h4>
              <p class="section-desc">
                为您的账号添加额外的安全保护，即使密码泄露也能保护您的账号安全
              </p>
            </div>
          </div>

          <el-tag v-if="twoFactorEnabled" type="success" size="large">
            已启用
          </el-tag>
          <el-tag v-else type="info" size="large">未启用</el-tag>
        </div>

        <div class="section-content">
          <!-- 未启用状态 -->
          <div v-if="!twoFactorEnabled" class="action-area">
            <p class="hint-text">
              <el-icon color="#e6a23c">
                <Warning />
              </el-icon>
              您的账号尚未启用双因素认证，建议立即启用以提高安全性。
            </p>
            <el-button type="primary" :icon="Plus" @click="goToSetup">
              启用双因素认证
            </el-button>
          </div>

          <!-- 已启用状态 -->
          <div v-else class="action-area">
            <div class="enabled-info">
              <el-icon color="#67c23a" :size="20">
                <CircleCheck />
              </el-icon>
              <span>您的账号已受到双因素认证保护</span>
            </div>

            <div class="action-buttons">
              <el-button :icon="RefreshRight" @click="showRegenerateDialog = true">
                重新生成备用验证码
              </el-button>
              <el-button type="danger" :icon="Delete" @click="showDisableDialog = true">
                禁用双因素认证
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-divider />

      <!-- 其他安全设置 -->
      <div class="setting-section">
        <div class="section-header">
          <div class="section-info">
            <el-icon :size="24" color="#409eff">
              <Key />
            </el-icon>
            <div>
              <h4>修改密码</h4>
              <p class="section-desc">定期更换密码可以提高账号安全性</p>
            </div>
          </div>
        </div>

        <div class="section-content">
          <el-button :icon="Edit" @click="$router.push('/settings/password')">
            修改密码
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 禁用 2FA 确认对话框 -->
    <el-dialog
      v-model="showDisableDialog"
      title="禁用双因素认证"
      width="420px"
    >
      <el-alert type="warning" :closable="false" show-icon class="warning-alert">
        <template #title>
          <strong>警告</strong>
        </template>
        <p>
          禁用双因素认证将降低您的账号安全性。如果继续，请输入当前的验证码以确认操作。
        </p>
      </el-alert>

      <el-input
        v-model="disableCode"
        placeholder="请输入验证码"
        maxlength="6"
        size="large"
        class="verify-input"
        style="margin-top: 20px"
      >
        <template #prefix>
          <el-icon>
            <Lock />
          </el-icon>
        </template>
      </el-input>

      <template #footer>
        <el-button @click="showDisableDialog = false">取消</el-button>
        <el-button
          type="danger"
          :loading="disabling"
          @click="handleDisable2FA"
        >
          确认禁用
        </el-button>
      </template>
    </el-dialog>

    <!-- 重新生成备用验证码对话框 -->
    <el-dialog
      v-model="showRegenerateDialog"
      title="重新生成备用验证码"
      width="500px"
    >
      <el-alert type="info" :closable="false" show-icon class="info-alert">
        <p>重新生成备用验证码后，之前的备用验证码将全部失效。</p>
      </el-alert>

      <el-input
        v-model="regenerateCode"
        placeholder="请输入验证码以确认"
        maxlength="6"
        size="large"
        class="verify-input"
        style="margin-top: 20px"
      >
        <template #prefix>
          <el-icon>
            <Lock />
          </el-icon>
        </template>
      </el-input>

      <!-- 显示新生成的备用验证码 -->
      <div v-if="newBackupCodes.length > 0" class="new-backup-codes">
        <el-divider>新的备用验证码</el-divider>

        <div class="backup-codes-list">
          <div
            v-for="(code, index) in newBackupCodes"
            :key="index"
            class="backup-code-item"
          >
            <span class="code-number">{{ index + 1 }}.</span>
            <code>{{ code }}</code>
          </div>
        </div>

        <div class="backup-actions">
          <el-button :icon="DocumentCopy" size="small" @click="copyNewBackupCodes">
            复制所有
          </el-button>
          <el-button :icon="Download" size="small" @click="downloadNewBackupCodes">
            下载
          </el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeRegenerateDialog">
          {{ newBackupCodes.length > 0 ? '完成' : '取消' }}
        </el-button>
        <el-button
          v-if="newBackupCodes.length === 0"
          type="primary"
          :loading="regenerating"
          @click="handleRegenerateBackupCodes"
        >
          确认重新生成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Lock,
  Key,
  Plus,
  Delete,
  Edit,
  Warning,
  CircleCheck,
  RefreshRight,
  DocumentCopy,
  Download,
} from '@element-plus/icons-vue'
import {
  get2FAStatus,
  disable2FA,
  regenerateBackupCodes,
} from '../api/auth'

defineOptions({ name: 'SecuritySettings' })

const router = useRouter()

const twoFactorEnabled = ref(false)
const loading = ref(false)

const showDisableDialog = ref(false)
const disableCode = ref('')
const disabling = ref(false)

const showRegenerateDialog = ref(false)
const regenerateCode = ref('')
const regenerating = ref(false)
const newBackupCodes = ref([])

// 获取 2FA 状态
onMounted(async () => {
  loading.value = true
  try {
    const res = await get2FAStatus()
    twoFactorEnabled.value = res.data.enabled
  } catch (error) {
    ElMessage.error('获取 2FA 状态失败')
  } finally {
    loading.value = false
  }
})

// 前往设置页面
const goToSetup = () => {
  router.push('/settings/2fa/setup')
}

// 禁用 2FA
const handleDisable2FA = async () => {
  if (!disableCode.value || disableCode.value.length !== 6) {
    ElMessage.warning('请输入 6 位验证码')
    return
  }

  disabling.value = true
  try {
    await disable2FA({ token: disableCode.value })

    ElMessage.success('双因素认证已禁用')
    twoFactorEnabled.value = false
    showDisableDialog.value = false
    disableCode.value = ''
  } catch (error) {
    ElMessage.error(error.message || '验证码错误')
    disableCode.value = ''
  } finally {
    disabling.value = false
  }
}

// 重新生成备用验证码
const handleRegenerateBackupCodes = async () => {
  if (!regenerateCode.value || regenerateCode.value.length !== 6) {
    ElMessage.warning('请输入 6 位验证码')
    return
  }

  regenerating.value = true
  try {
    const res = await regenerateBackupCodes({
      token: regenerateCode.value,
    })

    ElMessage.success('备用验证码已重新生成')
    newBackupCodes.value = res.data.backupCodes
    regenerateCode.value = ''
  } catch (error) {
    ElMessage.error(error.message || '验证码错误')
    regenerateCode.value = ''
  } finally {
    regenerating.value = false
  }
}

// 关闭重新生成对话框
const closeRegenerateDialog = () => {
  showRegenerateDialog.value = false
  newBackupCodes.value = []
  regenerateCode.value = ''
}

// 复制新备用验证码
const copyNewBackupCodes = () => {
  const text = newBackupCodes.value
    .map((code, index) => `${index + 1}. ${code}`)
    .join('\n')
  navigator.clipboard.writeText(text)
  ElMessage.success('已复制到剪贴板')
}

// 下载新备用验证码
const downloadNewBackupCodes = () => {
  const text = `双因素认证备用验证码（重新生成）
生成时间: ${new Date().toLocaleString()}

${newBackupCodes.value.map((code, index) => `${index + 1}. ${code}`).join('\n')}
`

  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup-codes-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('已下载')
}
</script>

<style scoped>
.security-settings {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
}

.settings-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
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

/* 设置区块 */
.setting-section {
  padding: 24px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.section-info {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.section-info h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.section-desc {
  margin: 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
  max-width: 500px;
}

.section-content {
  padding-left: 40px;
}

/* 操作区域 */
.action-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 12px 16px;
  background: #fef0f0;
  border-radius: 6px;
  color: #e6a23c;
  font-size: 14px;
}

.enabled-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 6px;
  color: #67c23a;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 对话框样式 */
.warning-alert,
.info-alert {
  margin-bottom: 0;
}

.warning-alert p,
.info-alert p {
  margin: 8px 0 0 0;
  line-height: 1.6;
}

.verify-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 6px;
}

/* 新备用验证码 */
.new-backup-codes {
  margin-top: 20px;
}

.backup-codes-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 16px 0;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.backup-code-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.code-number {
  font-size: 12px;
  font-weight: 600;
  color: #909399;
}

.backup-code-item code {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.backup-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 响应式 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 16px;
  }

  .section-content {
    padding-left: 0;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .backup-codes-list {
    grid-template-columns: 1fr;
  }
}
</style>
