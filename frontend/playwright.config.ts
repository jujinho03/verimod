import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // Live W5/W6 RPC suites require approved profiles and run only through their dedicated configs.
  testIgnore: ['w5.spec.ts', 'w6.spec.ts', 'w6-rpc-recovery.spec.ts', 'w7-check-live.spec.ts', 'w7-w4-shortcut.spec.ts'],
  use: { baseURL: 'http://127.0.0.1:4173', headless: true },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4173', port: 4173, reuseExistingServer: false },
})
