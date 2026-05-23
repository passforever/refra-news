import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AdminPanel } from './sections/AdminPanel.tsx'
import { NewsDetailPage } from './sections/NewsDetailPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
