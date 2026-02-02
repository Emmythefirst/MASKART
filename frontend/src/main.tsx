import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WalletContextProvider } from './context/WalletContext'
import App from './App'  // ← Import App
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletContextProvider>
      <BrowserRouter>
        <App />  {/* ← Render App, which contains Routes */}
      </BrowserRouter>
    </WalletContextProvider>
    </React.StrictMode>,
)