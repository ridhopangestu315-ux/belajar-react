import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import Aplikasi from './Aplikasi.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Aplikasi />
  </StrictMode>,
)
