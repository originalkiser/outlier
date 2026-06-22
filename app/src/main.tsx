import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#002745',
          color: '#F2F1E6',
          fontFamily: 'DMMono, monospace',
          fontSize: '13px',
          border: '1px solid #4F7489',
        },
        success: { iconTheme: { primary: '#2ECC71', secondary: '#002745' } },
        error:   { iconTheme: { primary: '#C0392B', secondary: '#002745' } },
      }}
    />
  </React.StrictMode>
)
