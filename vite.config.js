import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/rag-hotel-assistant/', // Назва вашого репозиторію на GitHub зі слешами
})