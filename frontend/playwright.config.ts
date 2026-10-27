import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // W5 has its own approved public profile and optional manual RPC run.
  testIgnore: ['w5.spec.ts', 'w6.spec.ts'],
  use: { baseURL: 'http://127.0.0.1:4173', headless: true },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4173', port: 4173, reuseExistingServer: false },
})
