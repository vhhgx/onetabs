import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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
          src: 'src/onetabs.html',
          dest: '',
        },
        {
          src: 'src/onetabs.css',
          dest: '',
        },
        {
          src: 'src/onetabs.js',
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
