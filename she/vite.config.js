import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['vconsole'] // 排除vconsole从依赖优化中
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境下移除console
        drop_debugger: true // 生产环境下移除debugger
      }
    }
  }
})