import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// settings.json 보존 플러그인: 빌드 전 백업, 빌드 후 복원
function preserveSettingsPlugin(): Plugin {
  const settingsPath = path.resolve(__dirname, '../docs/data/settings.json')
  const backupPath = path.resolve(__dirname, '.settings_backup.json')
  return {
    name: 'preserve-settings',
    buildStart() {
      // 빌드 전: 기존 settings.json 백업
      if (fs.existsSync(settingsPath)) {
        fs.copyFileSync(settingsPath, backupPath)
      }
    },
    closeBundle() {
      // 빌드 후: docs/data/ 폴더 생성 및 settings.json 복원
      const dataDir = path.resolve(__dirname, '../docs/data')
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, settingsPath)
        fs.unlinkSync(backupPath)
      } else {
        // 백업이 없으면 빈 JSON 생성
        fs.writeFileSync(settingsPath, '{}')
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/WorkM/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    preserveSettingsPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
