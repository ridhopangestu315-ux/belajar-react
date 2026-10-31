import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Copy, Info, TriangleAlert, X, XCircle } from 'lucide-react'

const ikonNotifikasi = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  information: Info,
}

const judulNotifikasi = {
  success: 'Berhasil',
  error: 'Terjadi kesalahan',
  warning: 'Perlu perhatian',
  information: 'Informasi',
}

export default function PusatPemberitahuan({ notifikasi, konfirmasi, tutupNotifikasi, tampilkanNotifikasi, selesaikanKonfirmasi }) {
  useEffect(() => {
    if (!notifikasi) return undefined
    const idPengaturWaktu = window.setTimeout(tutupNotifikasi, 4000)
    return () => window.clearTimeout(idPengaturWaktu)
  }, [notifikasi, tutupNotifikasi])

  const IkonToast = notifikasi ? ikonNotifikasi[notifikasi.jenis] || Info : null

  return <>
    {notifikasi && <div key={notifikasi.id} className={`studyflow-toast toast-enter studyflow-toast-${notifikasi.jenis}`} role={notifikasi.jenis === 'error' ? 'alert' : 'status'} aria-live={notifikasi.jenis === 'error' ? 'assertive' : 'polite'}>
      <span className="studyflow-alert-icon" aria-hidden="true"><IkonToast size={20}/></span>
      <div className="studyflow-toast-copy"><strong>{judulNotifikasi[notifikasi.jenis] || judulNotifikasi.information}</strong><p>{notifikasi.pesan}</p></div>
      <button className="studyflow-alert-close" type="button" aria-label="Tutup notifikasi" onClick={tutupNotifikasi}><X size={17}/></button>
    </div>}

    {konfirmasi && <DialogKonfirmasi key={konfirmasi.id} konfirmasi={konfirmasi} tampilkanNotifikasi={tampilkanNotifikasi} selesaikanKonfirmasi={selesaikanKonfirmasi}/>}
  </>
}

function DialogKonfirmasi({ konfirmasi, selesaikanKonfirmasi, tampilkanNotifikasi }) {
  const tombolBatal = useRef(null)
  const kolomKonfirmasi = useRef(null)
  const [teksKonfirmasi, aturTeksKonfirmasi] = useState('')
  const IkonKonfirmasi = ikonNotifikasi[konfirmasi.jenis] || TriangleAlert

  useEffect(() => {
    if (konfirmasi.frasaKonfirmasi) kolomKonfirmasi.current?.focus()
    else tombolBatal.current?.focus()
  }, [konfirmasi.frasaKonfirmasi])

  async function salinFrasaKonfirmasi(event) {
    event.preventDefault()
    event.stopPropagation()
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API tidak tersedia')
      await navigator.clipboard.writeText(konfirmasi.frasaKonfirmasi)
      tampilkanNotifikasi('Kata konfirmasi berhasil disalin!', 'success')
    } catch {
      tampilkanNotifikasi('Kata konfirmasi gagal disalin. Silakan salin teksnya secara manual.', 'error')
    }
  }

  return <div className="studyflow-confirm-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) selesaikanKonfirmasi(false) }}>
    <section className="studyflow-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="studyflow-confirm-title" aria-describedby="studyflow-confirm-message" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); selesaikanKonfirmasi(false) } }}>
      <span className={`studyflow-confirm-icon studyflow-toast-${konfirmasi.jenis}`} aria-hidden="true"><IkonKonfirmasi size={23}/></span>
      <h2 id="studyflow-confirm-title">{konfirmasi.judul}</h2>
      <p id="studyflow-confirm-message">{konfirmasi.pesan}</p>
      {konfirmasi.frasaKonfirmasi && <label className="studyflow-confirm-phrase">
        <span className="studyflow-confirm-phrase-instruction">Ketik <strong>{konfirmasi.frasaKonfirmasi}</strong> untuk melanjutkan.<button className="studyflow-copy-phrase" type="button" onClick={salinFrasaKonfirmasi}><Copy size={14}/>Salin Kata</button></span>
        <input ref={kolomKonfirmasi} type="text" value={teksKonfirmasi} onChange={(event) => aturTeksKonfirmasi(event.target.value)} autoComplete="off" spellCheck="false" aria-label={`Ketik ${konfirmasi.frasaKonfirmasi}`} />
      </label>}
      <div className="studyflow-confirm-actions">
        <button ref={tombolBatal} className="secondary-button" type="button" onClick={() => selesaikanKonfirmasi(false)}>Batal</button>
        <button className="studyflow-confirm-accept" type="button" disabled={Boolean(konfirmasi.frasaKonfirmasi && teksKonfirmasi !== konfirmasi.frasaKonfirmasi)} onClick={() => selesaikanKonfirmasi(true)}>{konfirmasi.labelKonfirmasi || 'Ya, Lanjutkan'}</button>
      </div>
    </section>
  </div>
}
