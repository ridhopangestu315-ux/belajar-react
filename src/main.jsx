import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './gaya/variabel.css'
import './gaya/dasar.css'
import './gaya/aplikasi.css'
import './gaya/halaman.css'
import Aplikasi from './Aplikasi.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Aplikasi />
  </StrictMode>,
)
