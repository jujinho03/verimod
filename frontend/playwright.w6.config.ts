import { defineConfig } from '@playwright/test'

const runId = process.env.W6_RUN_ID || new Date().toISOString().replace(/[:.]/g, '-')

export default defineConfig({
  testDir: './e2e',
  testMatch: 'w6.spec.ts',
  timeout: 420_000,
  workers: 1,
  maxFailures: 1,
  outputDir: `../private-data/w6-f-browser/${runId}/results`,
  reporter: [['list'], ['json', { outputFile: `../private-data/w6-f-browser/${runId}/playwright.json` }]],
  use: {
    baseURL: 'http://127.0.0.1:4186',
    channel: process.env.W6_BROWSER_CHANNEL || 'msedge',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } }],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4186 --strictPort',
    port: 4186,
    reuseExistingServer: false,
    env: {
      VITE_BASE_SEPOLIA_CONTRACT_ADDRESS: '0xd17ba590b23e984e3f3408bcdc3529be9868ec50',
      VITE_BASE_SEPOLIA_PUBLISHER: '0xd47675be41ec3476f541c1d8d8a9f622c90182ed',
      VITE_BASE_SEPOLIA_RPC_URLS: 'https://base-sepolia-rpc.publicnode.com,https://sepolia.base.org',
      VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK: '48012271',
      VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS: '12',
    },
  },
})
