<template>
  <div class="two-factor-verify">
    <el-card class="verify-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="48" color="#409eff">
            <Lock />
          </el-icon>
          <h3>双因素认证</h3>
          <p class="subtitle">请输入认证器 APP 中的验证码</p>
        </div>
      </template>

      <el-form @submit.prevent="handleVerify">
        <el-form-item>
          <el-input
            v-model="code"
            placeholder="000000"
            maxlength="6"
            size="large"
            class="code-input"
            autofocus
            @keyup.enter="handleVerify"
          >
            <template #prefix>
              <el-icon>
                <Key />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleVerify"
            class="verify-btn"
          >
            验证
          </el-button>
        </el-form-item>
      </el-form>

      <div class="help-section">
        <el-divider>遇到问题？</el-divider>

        <div class="help-options">
          <el-button
            text
            :icon="Paperclip"
            @click="showBackupCodeDialog = true"
          >
            使用备用验证码
          </el-button>
        </div>

        <p class="back-link">
          <el-button text @click="$router.push('/login')">
            返回登录
          </el-button>
        </p>
      </div>
    </el-card>

    <!-- 备用验证码对话框 -->
    <el-dialog
      v-model="showBackupCodeDialog"
      title="使用备用验证码"
      width="400px"
    >
      <p class="dialog-desc">
        请输入您保存的备用验证码。每个备用验证码只能使用一次。
      </p>

      <el-input
        v-model="backupCode"
        placeholder="请输入 8 位备用验证码"
        maxlength="8"
        size="large"
        class="backup-input"
      >
        <template #prefix>
          <el-icon>
            <Tickets />
          </el-icon>
        </template>
      </el-input>

      <template #footer>
        <el-button @click="showBackupCodeDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="verifyingBackup"
          @click="handleVerifyBackupCode"
        >
          验证
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, Key, Paperclip, Tickets } from '@element-plus/icons-vue'
import { verifyLogin2FA, verifyBackupCode as verifyBackupCodeAPI } from '../api/auth'

defineOptions({ name: 'TwoFactorVerify' })

const router = useRouter()
const route = useRoute()

const code = ref('')
const loading = ref(false)
const showBackupCodeDialog = ref(false)
const backupCode = ref('')
const verifyingBackup = ref(false)

// 从路由参数获取 userId（由登录页面传递）
const userId = ref('')

onMounted(() => {
  // 从路由参数或 sessionStorage 获取 userId
  userId.value = route.query.userId || sessionStorage.getItem('pendingUserId')

  if (!userId.value) {
    ElMessage.error('缺少用户信息，请重新登录')
    router.push('/login')
  }
})

// 验证 TOTP 验证码
const handleVerify = async () => {
  if (!code.value || code.value.length !== 6) {
    ElMessage.warning('请输入 6 位验证码')
    return
  }

  loading.value = true
  try {
    const res = await verifyLogin2FA({
      userId: userId.value,
      token: code.value,
    })

    // 保存 token
    localStorage.setItem('token', res.data.token)

    // 清除临时存储的 userId
    sessionStorage.removeItem('pendingUserId')

    ElMessage.success('登录成功')

    // 跳转到首页或指定页面
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (error) {
    ElMessage.error(error.message || '验证码错误')
    code.value = ''
  } finally {
    loading.value = false
  }
}

// 验证备用验证码
const handleVerifyBackupCode = async () => {
  if (!backupCode.value || backupCode.value.length !== 8) {
    ElMessage.warning('请输入 8 位备用验证码')
    return
  }

  verifyingBackup.value = true
  try {
    const res = await verifyBackupCodeAPI({
      userId: userId.value,
      backupCode: backupCode.value,
    })

    // 保存 token
    localStorage.setItem('token', res.data.token)

    // 清除临时存储的 userId
    sessionStorage.removeItem('pendingUserId')

    ElMessage.success('登录成功')

    // 关闭对话框
    showBackupCodeDialog.value = false

    // 跳转到首页
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (error) {
    ElMessage.error(error.message || '备用验证码错误或已使用')
    backupCode.value = ''
  } finally {
    verifyingBackup.value = false
  }
}
</script>

<style scoped>
.two-factor-verify {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.verify-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.card-header {
  text-align: center;
  padding: 20px 0;
}

.card-header .el-icon {
  margin-bottom: 16px;
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

.el-form {
  padding: 20px 0;
}

.code-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 12px;
  padding: 16px 20px;
  height: 60px;
}

.verify-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.help-section {
  margin-top: 24px;
}

.el-divider {
  margin: 24px 0 16px 0;
}

.help-options {
  text-align: center;
}

.back-link {
  margin-top: 16px;
  text-align: center;
}

.back-link .el-button {
  color: #909399;
}

/* 对话框样式 */
.dialog-desc {
  margin: 0 0 20px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.backup-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 4px;
}

/* 响应式 */
@media (max-width: 480px) {
  .verify-card {
    margin: 0;
  }

  .code-input :deep(.el-input__inner) {
    font-size: 24px;
    letter-spacing: 8px;
  }
}
</style>
