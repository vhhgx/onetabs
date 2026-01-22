/**
 * 2FA 认证相关 API
 */
import request from './request'

/**
 * 启用 2FA - 获取密钥和二维码
 * @returns {Promise}
 */
export function enable2FA() {
  return request({
    url: '/api/auth/2fa/enable',
    method: 'POST',
  })
}

/**
 * 验证并正式启用 2FA
 * @param {Object} data - { token: string }
 * @returns {Promise}
 */
export function verify2FA(data) {
  return request({
    url: '/api/auth/2fa/verify',
    method: 'POST',
    data,
  })
}

/**
 * 登录时验证 2FA
 * @param {Object} data - { userId: string, token: string }
 * @returns {Promise}
 */
export function verifyLogin2FA(data) {
  return request({
    url: '/api/auth/login/2fa',
    method: 'POST',
    data,
  })
}

/**
 * 禁用 2FA
 * @param {Object} data - { token: string }
 * @returns {Promise}
 */
export function disable2FA(data) {
  return request({
    url: '/api/auth/2fa/disable',
    method: 'POST',
    data,
  })
}

/**
 * 获取 2FA 状态
 * @returns {Promise}
 */
export function get2FAStatus() {
  return request({
    url: '/api/auth/2fa/status',
    method: 'GET',
  })
}

/**
 * 使用备用验证码登录
 * @param {Object} data - { userId: string, backupCode: string }
 * @returns {Promise}
 */
export function verifyBackupCode(data) {
  return request({
    url: '/api/auth/2fa/backup-code',
    method: 'POST',
    data,
  })
}

/**
 * 重新生成备用验证码
 * @param {Object} data - { token: string }
 * @returns {Promise}
 */
export function regenerateBackupCodes(data) {
  return request({
    url: '/api/auth/2fa/regenerate-backup-codes',
    method: 'POST',
    data,
  })
}
