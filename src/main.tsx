import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // 確保這裡沒有寫成 .jsx 或 .tsx
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
