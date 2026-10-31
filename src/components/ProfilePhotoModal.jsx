import { useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload, X } from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ProfilePhotoModal({ name, photo = '', onClose, onSave }) {
  const fileInput = useRef(null)
  const [preview, setPreview] = useState(photo)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function readPhoto(file) {
    setError('')
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_TYPES.includes(file.type) || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      setError('Pilih foto JPG, PNG, atau WEBP.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Ukuran foto maksimal 5 MB.')
      return
    }
    setBusy(true)
    const reader = new FileReader()
    reader.onerror = () => { setError('Foto tidak dapat dibaca. Coba file lain.'); setBusy(false) }
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => { setError('File ini bukan gambar yang valid.'); setBusy(false) }
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 512 / Math.max(image.width, image.height))
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        setPreview(canvas.toDataURL('image/jpeg', 0.82))
        setBusy(false)
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  return <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div className="profile-modal-heading"><div><span className="eyebrow">PROFIL</span><h2 id="profile-modal-title">Foto profil</h2></div><button className="icon-button" aria-label="Tutup" onClick={onClose}><X size={18}/></button></div>
      <p className="profile-modal-help">Foto akan tampil di avatar desktop dan mobile.</p>
      <div className="profile-preview">{preview ? <img src={preview} alt="Preview foto profil"/> : <span>{(name || 'S').trim().slice(0, 1).toUpperCase() || 'S'}</span>}</div>
      {error && <p className="profile-error" role="alert">{error}</p>}
      <div className="profile-modal-actions">
        <button className="secondary-button" type="button" onClick={() => fileInput.current?.click()} disabled={busy}><Upload size={16}/>{preview ? 'Ganti foto' : 'Unggah foto'}</button>
        {preview && <button className="subtle-button" type="button" onClick={() => { setPreview(''); setError('') }}><Trash2 size={16}/>Hapus</button>}
        <input ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden onChange={(event) => { readPhoto(event.target.files?.[0]); event.target.value = '' }}/>
      </div>
      <p className="profile-file-hint"><ImagePlus size={14}/> JPG, PNG, atau WEBP · Maksimal 5 MB</p>
      <div className="profile-modal-footer"><button className="secondary-button" onClick={onClose}>Batal</button><button className="primary-button" disabled={busy} onClick={() => onSave(preview)}>{busy ? 'Memproses…' : 'Simpan foto'}</button></div>
    </section>
  </div>
}
