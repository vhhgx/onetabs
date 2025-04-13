import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// 自定义插件，用于处理 Chrome 扩展程序的所需文件
function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension',

    // 构建结束后的钩子
    //
    closeBundle: async () => {},
  }
}

// // 自定义插件示例（完整版）
// function myVitePlugin() {
//   return {
//     name: 'my-vite-plugin',

//     // 修改Vite配置
//     config(config) {
//       return {
//         // 合并配置
//         ...config,
//         // 添加自定义配置
//         customOption: true
//       }
//     },

//     // Vite配置解析后
//     configResolved(resolvedConfig) {
//       // 存储最终解析的配置
//       console.log(resolvedConfig)
//     },

//     // 配置开发服务器
//     configureServer(server) {
//       // 添加自定义中间件
//       server.middlewares.use((req, res, next) => {
//         // 自定义处理逻辑
//         next()
//       })

//       // 或在服务器启动后执行
//       return () => {
//         // 服务器启动后执行的代码
//       }
//     },

//     // 转换HTML内容
//     transformIndexHtml(html) {
//       return html.replace(
//         /<title>(.*?)<\/title>/,
//         `<title>Modified Title</title>`
//       )
//     },

//     // 解析模块ID (Rollup钩子)
//     resolveId(source, importer) {
//       if (source === 'virtual-module') {
//         // 返回一个虚拟模块的ID
//         return source
//       }
//       return null // 让其他插件处理
//     },

//     // 加载模块内容 (Rollup钩子)
//     load(id) {
//       if (id === 'virtual-module') {
//         // 返回虚拟模块的内容
//         return 'export default "This is a virtual module"'
//       }
//       return null // 让其他插件处理
//     },

//     // 转换模块内容 (Rollup钩子)
//     transform(code, id) {
//       if (id.endsWith('.js')) {
//         // 转换JS文件内容
//         return {
//           code: `/* 添加注释 */\n${code}`,
//           map: null // 可选的source map
//         }
//       }
//     },

//     // 热更新处理
//     handleHotUpdate(ctx) {
//       // 自定义HMR逻辑
//       console.log('file changed:', ctx.file)
//       // 可以返回自定义的更新模块列表
//       return ctx.modules
//     }
//   }
// }

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/manifest.json',
          dest: '',
        },
        {
          src: 'src/background.js',
          dest: '',
        },
        {
          src: 'src/assets/logo.png',
          dest: 'icons',
          rename: 'icon128.png',
        },
        {
          src: 'src/assets/logo.png',
          dest: 'icons',
          rename: 'icon48.png',
        },
        {
          src: 'src/assets/logo.png',
          dest: 'icons',
          rename: 'icon16.png',
        },
        {
          src: 'src/assets/logo.png',
          dest: 'icons',
          rename: 'default-favicon.png',
        },
        {
          src: 'src/assets/logo.png',
          dest: 'icons',
          rename: 'logo.png',
        },
      ],
    }),
  ],
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
