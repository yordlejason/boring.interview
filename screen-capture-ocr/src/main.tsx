import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css' // create a simple css file if needed

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)