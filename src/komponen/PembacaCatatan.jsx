import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, CalendarDays, Clock3, Pencil, Trash2 } from 'lucide-react'

function formatTanggalCatatan(tanggal) {
  if (!tanggal) return 'Belum tersedia'
  const waktu = new Date(`${tanggal}T12:00:00`)
  if (Number.isNaN(waktu.getTime())) return tanggal
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(waktu)
}

export default function PembacaCatatan({ catatan, onClose, onEdit, onDelete }) {
  useEffect(() => {
    const overflowSebelumnya = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function tutupDenganEscape(event) {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose()
    }
    window.addEventListener('keydown', tutupDenganEscape)
    return () => {
      document.body.style.overflow = overflowSebelumnya
      window.removeEventListener('keydown', tutupDenganEscape)
    }
  }, [onClose])

  const tanggalDibuat = formatTanggalCatatan(catatan.createdAt)
  const tanggalDiperbarui = formatTanggalCatatan(catatan.updatedAt || catatan.createdAt)

  return createPortal(<div className="pembaca-catatan-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="pembaca-catatan" role="dialog" aria-modal="true" aria-labelledby="pembaca-catatan-judul">
      <header className="pembaca-catatan-header">
        <button className="pembaca-catatan-kembali" type="button" onClick={onClose}><ArrowLeft size={18}/><span>Kembali ke Catatan</span></button>
        <div className="pembaca-catatan-actions">
          <button className="secondary-button" type="button" onClick={onEdit}><Pencil size={16}/><span>Edit</span></button>
          <button className="danger-button pembaca-catatan-hapus" type="button" onClick={onDelete}><Trash2 size={16}/><span>Hapus</span></button>
        </div>
      </header>
      <article className="pembaca-catatan-konten">
        {catatan.subject && <span className="pembaca-catatan-subjek">{catatan.subject}</span>}
        <h1 id="pembaca-catatan-judul">{catatan.title || 'Catatan tanpa judul'}</h1>
        <div className="pembaca-catatan-tanggal">
          <span><CalendarDays size={15}/>Dibuat {tanggalDibuat}</span>
          <span><Clock3 size={15}/>Terakhir diperbarui {tanggalDiperbarui}</span>
        </div>
        <div className="pembaca-catatan-isi">{catatan.description || 'Catatan ini belum memiliki isi.'}</div>
      </article>
    </section>
  </div>, document.body)
}
