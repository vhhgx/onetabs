import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import css from '@eslint/css'
import { defineConfig } from 'eslint/config'
import prettierPlugin from 'eslint-plugin-prettier'
import fs from 'fs'
import path from 'path'

// 读取 .prettierrc 文件
const prettierConfigPath = path.resolve('.prettierrc')
let prettierOptions = {}

// 尝试读取 .prettierrc 文件
try {
  const configFileContent = fs.readFileSync(prettierConfigPath, 'utf8')
  prettierOptions = JSON.parse(configFileContent)
} catch (error) {
  console.warn('无法读取 .prettierrc 文件，使用默认配置')
}

export default defineConfig([
  ...pluginVue.configs['flat/essential'],
  { files: ['**/*.{js,mjs,cjs,vue}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,cjs,vue}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ['**/*.css'], plugins: { css }, language: 'css/css', extends: ['css/recommended'] },
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': ['error', prettierOptions],
      // 关闭可能与 Prettier 冲突的规则
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
    },
  },
])
