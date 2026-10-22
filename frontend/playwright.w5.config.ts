import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e', testMatch: 'w5.spec.ts', timeout: 120_000, workers: 1, maxFailures: 1,
  outputDir: '../private-data/w5-browser-results',
  reporter: [['list'], ['json', { outputFile: '../private-data/w5-browser.json' }]],
  use: { baseURL: 'http://127.0.0.1:4185', channel: process.env.W5_BROWSER_CHANNEL || 'msedge', headless: true, trace: 'off', screenshot: 'off' },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4185 --strictPort', port: 4185, reuseExistingServer: false,
    env: { VITE_BASE_SEPOLIA_CONTRACT_ADDRESS: '0xd17ba590b23e984e3f3408bcdc3529be9868ec50',
      VITE_BASE_SEPOLIA_PUBLISHER: '0xd47675be41ec3476f541c1d8d8a9f622c90182ed',
      VITE_BASE_SEPOLIA_RPC_URLS: 'https://base-sepolia-rpc.publicnode.com,https://sepolia.base.org',
      VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK: '48012271', VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS: '12' } },
})
