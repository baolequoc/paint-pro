import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      entry: 'electron/main.ts',
      vite: {
        build: {
          outDir: 'dist-electron',
          sourcemap: true
        }
      }
    }),
    renderer()
  ],
  base: '',
  build: {
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'umd',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]'
      }
    },
    target: 'es2015',
    minify: false,
    sourcemap: true,
    cssCodeSplit: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['vue']
  },
  server: {
    port: 5173
  }
}); 