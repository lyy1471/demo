import { defineConfig } from 'vite'

export default defineConfig({
  base: './',  // 设置基础路径为相对路径
  publicDir: 'public',  // 指定静态资源目录
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
    },
    assetsDir: 'assets',  // 指定打包后的资源目录
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})