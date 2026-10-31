import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'

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

export default function PusatPemberitahuan({ notifikasi, konfirmasi, tutupNotifikasi, selesaikanKonfirmasi }) {
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

    {konfirmasi && <DialogKonfirmasi key={konfirmasi.id} konfirmasi={konfirmasi} selesaikanKonfirmasi={selesaikanKonfirmasi}/>}
  </>
}

function DialogKonfirmasi({ konfirmasi, selesaikanKonfirmasi }) {
  const tombolBatal = useRef(null)
  const kolomKonfirmasi = useRef(null)
  const [teksKonfirmasi, aturTeksKonfirmasi] = useState('')
  const IkonKonfirmasi = ikonNotifikasi[konfirmasi.jenis] || TriangleAlert

  useEffect(() => {
    if (konfirmasi.frasaKonfirmasi) kolomKonfirmasi.current?.focus()
    else tombolBatal.current?.focus()
  }, [konfirmasi.frasaKonfirmasi])

  return <div className="studyflow-confirm-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) selesaikanKonfirmasi(false) }}>
    <section className="studyflow-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="studyflow-confirm-title" aria-describedby="studyflow-confirm-message" onKeyDown={(event) => { if (event.key === 'Escape') selesaikanKonfirmasi(false) }}>
      <span className={`studyflow-confirm-icon studyflow-toast-${konfirmasi.jenis}`} aria-hidden="true"><IkonKonfirmasi size={23}/></span>
      <h2 id="studyflow-confirm-title">{konfirmasi.judul}</h2>
      <p id="studyflow-confirm-message">{konfirmasi.pesan}</p>
      {konfirmasi.frasaKonfirmasi && <label className="studyflow-confirm-phrase">
        Ketik <strong>{konfirmasi.frasaKonfirmasi}</strong> untuk melanjutkan.
        <input ref={kolomKonfirmasi} type="text" value={teksKonfirmasi} onChange={(event) => aturTeksKonfirmasi(event.target.value)} autoComplete="off" spellCheck="false" aria-label={`Ketik ${konfirmasi.frasaKonfirmasi}`} />
      </label>}
      <div className="studyflow-confirm-actions">
        <button ref={tombolBatal} className="secondary-button" type="button" onClick={() => selesaikanKonfirmasi(false)}>Batal</button>
        <button className="studyflow-confirm-accept" type="button" disabled={Boolean(konfirmasi.frasaKonfirmasi && teksKonfirmasi !== konfirmasi.frasaKonfirmasi)} onClick={() => selesaikanKonfirmasi(true)}>{konfirmasi.labelKonfirmasi || 'Ya, Lanjutkan'}</button>
      </div>
    </section>
  </div>
}
