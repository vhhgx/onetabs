import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

import { writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs'
import sharp from 'sharp' // 添加sharp依赖，用于处理图像调整大小

// 自定义插件，用于处理 Chrome 扩展程序的所需文件
function chromeExtensionPlugins() {
  return {
    name: 'chrome-extension',

    // 构建结束后的钩子
    closeBundle: async () => {
      console.log('📦 正在处理Chrome插件文件')

      const DIST = resolve(__dirname, 'dist') // 构建输出目录
      const LOGOIMG = resolve(__dirname, 'src/assets/logo.png') // 图标
      const ICONDIST = resolve(DIST, 'icons') // 图标输出目录
      const BACKGROUND = resolve(__dirname, 'src/assets/background.js') // 背景脚本源路径
      const BGDIST = resolve(DIST, 'background.js') // 背景脚本输出路径
      const MANIFEST = resolve(__dirname, 'src/assets/manifest.json') // manifest源路径
      const MFDIST = resolve(DIST, 'manifest.json') // manifest输出路径

      console.log('🚀 正在复制manifest')

      if (existsSync(MANIFEST)) {
        copyFileSync(MANIFEST, MFDIST)
        console.log('✅ manifest.json已复制')
      } else {
        console.error('❌ 源 manifest.json不存在')
      }

      console.log('🚀 正在生成图标文件')

      // 不存在时创建图标目录
      if (!existsSync(ICONDIST)) {
        mkdirSync(ICONDIST, { recursive: true })
      }

      if (existsSync(LOGOIMG)) {
        // 使用 sharp 库处理图标
        const iconSizes = [16, 48, 128]

        for (const size of iconSizes) {
          try {
            // 使用sharp调整图标大小
            const ICON = resolve(ICONDIST, `icon${size}.png`)
            await sharp(LOGOIMG).resize(size, size).toFile(ICON)

            console.log(`✅ 已生成 ${size} x ${size} 尺寸图标`)
          } catch (err) {
            console.error(`❌ 创建图标尺寸 ${size} 失败:`, err)
          }
        }
      } else {
        console.error(
          '❌ 源logo.png不存在！请确保 src/assets/logo.png 文件存在'
        )
      }

      console.log('🚀 正在复制背景脚本')

      if (!existsSync(BGDIST) && existsSync(BACKGROUND)) {
        copyFileSync(BACKGROUND, BGDIST)
        console.log('✅ 背景脚本已复制')
      }

      console.log('✨ Chrome扩展处理完成!')
    },
  }
}

export default defineConfig({
  plugins: [vue(), chromeExtensionPlugins()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})
