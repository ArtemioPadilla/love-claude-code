import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'
import { analytics } from './services/analytics'

// Initialize analytics
analytics.init({
  provider: 'google', // or 'plausible' or 'umami'
  // Configuration will be read from environment variables
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)