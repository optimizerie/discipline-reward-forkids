import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ["discipline-reward-forkids.up.railway.app", "kidquest-production.up.railway.app"],
  },
})
