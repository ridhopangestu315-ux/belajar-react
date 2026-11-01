import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './gaya/variabel.css'
import './gaya/dasar.css'
import './gaya/aplikasi.css'
import './gaya/halaman.css'
import './gaya/notifikasi.css'
import './gaya/pembaca-catatan.css'
import './gaya/editor-catatan.css'
import './gaya/palet-studyflow.css'
import './gaya/autentikasi.css'
import Aplikasi from './Aplikasi.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Aplikasi />
  </StrictMode>,
)
