import { defineConfig, loadEnv, type ConfigEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd())
  const relayer = env.NEXT_PUBLIC_RELAYER_API_URL ?? env.VITE_RELAYER_API_URL ?? 'https://api3.privacycash.org'

  return defineConfig({
    plugins: [react()],
    define: {
      'process.env.NEXT_PUBLIC_RELAYER_API_URL': JSON.stringify(relayer)
    }
  })
}