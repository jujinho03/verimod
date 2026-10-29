import { defineConfig } from '@playwright/test'

const runId = process.env.W6_RECOVERY_RUN_ID || new Date().toISOString().replace(/[:.]/g, '-')

export default defineConfig({
  testDir: './e2e',
  testMatch: 'w6-rpc-recovery.spec.ts',
  timeout: 720_000,
  workers: 1,
  maxFailures: 0,
  outputDir: `../private-data/w6-f-rpc-recovery/${runId}/results`,
  reporter: [['list'], ['json', { outputFile: `../private-data/w6-f-rpc-recovery/${runId}/playwright.json` }]],
  use: {
    baseURL: 'http://127.0.0.1:4187',
    channel: process.env.W6_BROWSER_CHANNEL || undefined,
    headless: true,
    trace: 'on',
    video: process.env.W6_RECORD_VIDEO === 'true' ? 'on' : 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-emulation', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4187 --strictPort',
    port: 4187,
    reuseExistingServer: process.env.W6_REUSE_SERVER === 'true',
    env: {
      VITE_BASE_SEPOLIA_CONTRACT_ADDRESS: '0xd17ba590b23e984e3f3408bcdc3529be9868ec50',
      VITE_BASE_SEPOLIA_PUBLISHER: '0xd47675be41ec3476f541c1d8d8a9f622c90182ed',
      VITE_BASE_SEPOLIA_RPC_URLS: 'https://base-sepolia-rpc.publicnode.com,https://sepolia.base.org',
      VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK: '48012271',
      VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS: '12',
    },
  },
})
