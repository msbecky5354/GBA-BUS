import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/GBA-BUS/', // <-- 必須加入呢行，名字要同你 GitHub Repo 完全一樣
})