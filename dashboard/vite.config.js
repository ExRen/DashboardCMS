import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// DEBUG: Check files in Vercel environment
try {
  console.log("DEBUG: Current CWD:", process.cwd())
  console.log("DEBUG: Files in CWD:", fs.readdirSync(process.cwd()))
  console.log("DEBUG: Files in __dirname:", fs.readdirSync(__dirname))
} catch (e) {
  console.log("DEBUG Error:", e)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
