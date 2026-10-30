import { defineConfig } from '@playwright/test'

// This suite uses a mocked API, not the model or a production database.
export default defineConfig({
  testDir: './e2e',
  testMatch: 'w7-check-live.spec.ts',
  use: { baseURL: 'http://127.0.0.1:4191', headless: true },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4191 --strictPort',
    port: 4191,
    reuseExistingServer: false,
    env: { VITE_VERIMOD_LIVE_ENABLED: 'true', VITE_VERIMOD_API_URL: '' },
  },
})
