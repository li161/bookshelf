import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ base: '/bookshelf/', plugins: [vue()], build: { target: 'es2020' } })
