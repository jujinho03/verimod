import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'

import '@fontsource-variable/tasa-orbiter'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import 'pretendard/dist/web/variable/pretendardvariable.css'

import './styles/tokens.css'
import './styles/ui.css'
import './styles/chrome.css'
import './styles/pages.css'
import './styles/home.css'

import { CheckPage } from './pages/CheckPage'
import { Home } from './pages/home/Home'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProtocolPage } from './pages/ProtocolPage'
import { ReceiptDetailPage } from './pages/ReceiptDetailPage'
import { ReceiptsPage } from './pages/ReceiptsPage'
import { ReviewPage } from './pages/ReviewPage'
import { VerifyPage } from './pages/VerifyPage'
import { Layout } from './site/Layout'
import { StoreProvider } from './store/StoreProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="check" element={<CheckPage />} />
            <Route path="receipts" element={<ReceiptsPage />} />
            <Route path="receipts/:receiptId" element={<ReceiptDetailPage />} />
            <Route path="verify" element={<VerifyPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="protocol" element={<ProtocolPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
)
