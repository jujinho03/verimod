import { defineConfig } from '@playwright/test'

// Deterministic route-abort regression only; live W6 suites remain opt-in.
export default defineConfig({
  testDir: './e2e',
  testMatch: 'w7-w4-shortcut.spec.ts',
  timeout: 60_000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4196', browserName: 'chromium', headless: true },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4196 --strictPort',
    port: 4196,
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
