import { useLayoutEffect, useRef, useState } from 'react'
import { Check, Maximize2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { ubahKeKunciTanggalLokal as tanggalHariIni } from '../fungsi-bantuan/tanggal.js'

export function FormulirData({ modal, daftarMataPelajaran, tampilkanNotifikasi, onClose, onSave }) {
  const { page, item } = modal
  const isSubject = page === 'Mata Pelajaran'
  const isTask = page === 'Tugas'
  const isNote = page === 'Catatan'
  const isCalendar = page === 'Kalender'
  const [deskripsiForm, aturDeskripsiForm] = useState(item?.description || '')
  const [judulCatatan, aturJudulCatatan] = useState(item?.title || '')
  const dialogRef = useRef(null)
  const openerRef = useRef(typeof document !== 'undefined' ? document.activeElement : null)
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => { onCloseRef.current = onClose }, [onClose])
  const titleLabel = isSubject ? 'Nama mata pelajaran' : 'Judul'
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const opener = openerRef.current
    if (!dialog) return

    const selector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    const getFocusable = () => Array.from(dialog.querySelectorAll(selector)).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0)
    if (!dialog.contains(document.activeElement)) {
      ;(dialog.querySelector('[autofocus]') || getFocusable()[0] || dialog).focus()
    }

    function handleDialogKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = getFocusable()
      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown)
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown)
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  function kirimFormulir(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (key) => String(form.get(key) || '').trim()
    const jadwalDiisi = Boolean(value('day') || value('start') || value('end') || value('room'))
    if (isSubject && jadwalDiisi && (!value('day') || !value('start') || !value('end') || value('start') >= value('end'))) {
      tampilkanNotifikasi('Pilih hari, lalu isi waktu mulai dan selesai. Pastikan waktu selesai setelah waktu mulai.', 'error')
      return
    }
    if (isSubject) onSave({ name: value('name'), code: value('code'), teacher: value('teacher'), category: value('category'), level: value('level'), description: value('description'), color: value('color'), schedule: value('day') ? [{ day: value('day'), start: value('start'), end: value('end'), room: value('room') }] : [] })
    else if (isTask) onSave({ title: value('title'), description: value('description'), subject: value('subject'), deadline: value('deadline'), priority: value('priority'), status: value('status') })
    else if (isNote) onSave({ title: value('title'), description: value('description'), subject: value('subject') })
    else if (isCalendar) onSave({ title: value('title'), description: value('description'), subject: value('subject'), date: value('date'), time: value('startTime'), startTime: value('startTime'), endTime: value('endTime') })
    else onSave({ title: value('title'), description: value('description'), date: value('date'), time: value('time') })
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="data-entry-dialog-title" ref={dialogRef} tabIndex={-1}><div className="modal-heading"><div><p className="eyebrow">STUDYFLOW / {page.toUpperCase()}</p><h2 id="data-entry-dialog-title">{item ? 'Edit' : 'Tambah'} {isSubject ? 'mata pelajaran' : isTask ? 'tugas' : isNote ? 'catatan' : isCalendar ? 'kegiatan' : 'pengingat'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup"><X size={20}/></button></div><form onSubmit={kirimFormulir} className="modal-form">
    <label className="field-label">{titleLabel}<input className="form-control" name={isSubject ? 'name' : 'title'} value={isNote ? judulCatatan : undefined} onChange={isNote ? (event) => aturJudulCatatan(event.target.value) : undefined} defaultValue={isNote ? undefined : item?.name || item?.title || ''} required autoFocus/></label>
    {isSubject ? <>
      <label className="field-label">Pengajar (opsional)<input className="form-control" name="teacher" defaultValue={item?.teacher || ''} placeholder="Nama guru atau pengajar" /></label>
      <div className="form-two"><label className="field-label">Bidang atau kategori<input className="form-control" name="category" defaultValue={item?.category || ''} placeholder="Contoh: Sains" /></label><label className="field-label">Kelas atau tingkat<input className="form-control" name="level" defaultValue={item?.level || ''} placeholder="Opsional" /></label></div>
      <label className="field-label">Kode pelajaran (opsional)<input className="form-control" name="code" defaultValue={item?.code || ''} placeholder="Boleh dikosongkan" /></label>
      <EditorDeskripsi judul={item?.name || ''} nilai={deskripsiForm} aturNilai={aturDeskripsiForm} label="Deskripsi (opsional)" placeholder="Catatan singkat tentang pelajaran ini" />
      <label className="field-label">Warna identitas<input className="form-control color-input" type="color" name="color" defaultValue={item?.color?.startsWith('#') ? item.color : '#D5735B'} /></label>
      <div className="form-two"><label className="field-label">Hari belajar<select name="day" className="form-control" defaultValue={item?.schedule?.[0]?.day || ''}><option value="">Pilih hari (opsional)</option>{['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map((day)=><option key={day}>{day}</option>)}</select></label><label className="field-label">Lokasi belajar<input className="form-control" name="room" defaultValue={item?.schedule?.[0]?.room || ''} placeholder="Opsional" /></label></div>
      <div className="form-two"><label className="field-label">Mulai<input className="form-control" type="time" name="start" defaultValue={item?.schedule?.[0]?.start || ''}/></label><label className="field-label">Selesai<input className="form-control" type="time" name="end" defaultValue={item?.schedule?.[0]?.end || ''}/></label></div>
    </> : <>
      {isNote ? <EditorDeskripsi judul={judulCatatan} nilai={deskripsiForm} aturNilai={aturDeskripsiForm} label="Deskripsi" placeholder="Tulis isi catatanmu di sini..." /> : (isTask || isCalendar || page === 'Pengingat') && <EditorDeskripsi judul={item?.title || ''} nilai={deskripsiForm} aturNilai={aturDeskripsiForm} label={isTask ? 'Deskripsi' : 'Keterangan'} placeholder="Tulis deskripsi di sini..." />}
      {(isTask || isNote) && <label className="field-label">Mata pelajaran<select name="subject" className="form-control" defaultValue={item?.subject || ''}><option value="">Tanpa mata pelajaran</option>{daftarMataPelajaran.map((subject)=><option key={subject.id}>{subject.name}</option>)}</select></label>}
      {isCalendar && <label className="field-label">Mata pelajaran terkait<select name="subject" className="form-control" defaultValue={item?.subject || ''}><option value="">Tidak terkait</option>{daftarMataPelajaran.map((subject)=><option key={subject.id}>{subject.name}</option>)}</select></label>}
      {(isTask || page === 'Pengingat') && <div className="form-two"><label className="field-label">Tanggal<input className="form-control" type="date" name={isTask ? 'deadline' : 'date'} defaultValue={item?.deadline || item?.date || tanggalHariIni()} required/></label><label className="field-label">Jam<input className="form-control" type="time" name="time" defaultValue={item?.time || ''}/></label></div>}
      {isCalendar && <><label className="field-label">Tanggal<input className="form-control" type="date" name="date" defaultValue={item?.date || tanggalHariIni()} required/></label><div className="form-two"><label className="field-label">Waktu mulai<input className="form-control" type="time" name="startTime" defaultValue={item?.startTime || item?.time || ''}/></label><label className="field-label">Waktu selesai<input className="form-control" type="time" name="endTime" defaultValue={item?.endTime || ''}/></label></div></>}
      {isTask && <div className="form-two"><label className="field-label">Prioritas<select name="priority" className="form-control" defaultValue={item?.priority || 'Sedang'}>{['Rendah','Sedang','Tinggi'].map((value)=><option key={value}>{value}</option>)}</select></label><label className="field-label">Status<select name="status" className="form-control" defaultValue={item?.status || (item?.done ? 'Selesai' : 'Belum dikerjakan')}>{['Belum dikerjakan','Sedang dikerjakan','Selesai'].map((value)=><option key={value}>{value}</option>)}</select></label></div>}
    </>}
    <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Batal</button><button className="primary-button" type="submit">{item ? 'Simpan perubahan' : 'Simpan'}</button></div></form></section></div>
}

function EditorDeskripsi({ judul, nilai, aturNilai, label = 'Deskripsi', placeholder = 'Tulis deskripsi di sini...' }) {
  const [modePenuh, aturModePenuh] = useState(false)
  const textareaForm = useRef(null)
  const textareaPenuh = useRef(null)
  const posisiKursor = useRef({ mulai: 0, selesai: 0 })
  const modeSebelumnyaPenuh = useRef(false)

  useLayoutEffect(() => {
    if (modePenuh) {
      textareaPenuh.current?.focus()
      textareaPenuh.current?.setSelectionRange(posisiKursor.current.mulai, posisiKursor.current.selesai)
    } else if (modeSebelumnyaPenuh.current) {
      textareaForm.current?.focus()
      textareaForm.current?.setSelectionRange(posisiKursor.current.mulai, posisiKursor.current.selesai)
    }
    modeSebelumnyaPenuh.current = modePenuh
  }, [modePenuh])

  function simpanPosisiKursor(event) {
    posisiKursor.current = { mulai: event.currentTarget.selectionStart, selesai: event.currentTarget.selectionEnd }
  }

  function masukModePenuh() {
    simpanPosisiKursor({ currentTarget: textareaForm.current })
    aturModePenuh(true)
  }

  function keluarModePenuh() {
    if (textareaPenuh.current) simpanPosisiKursor({ currentTarget: textareaPenuh.current })
    aturModePenuh(false)
  }

  useLayoutEffect(() => {
    if (!modePenuh) return undefined
    const overflowSebelumnya = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function tutupDenganEscape(event) {
      if (event.key === 'Escape') keluarModePenuh()
    }
    window.addEventListener('keydown', tutupDenganEscape)
    return () => {
      document.body.style.overflow = overflowSebelumnya
      window.removeEventListener('keydown', tutupDenganEscape)
    }
  }, [modePenuh])

  return <>
    <label className="field-label editor-deskripsi-field">{label}
      <span className="editor-deskripsi-area">
        <textarea ref={textareaForm} className={`form-control textarea-control ${modePenuh ? 'editor-deskripsi-tersembunyi' : ''}`} name="description" rows="4" value={nilai} onChange={(event) => aturNilai(event.target.value)} onSelect={simpanPosisiKursor} placeholder={placeholder} />
        <button className="editor-deskripsi-fullscreen" type="button" aria-label="Buka editor layar penuh" title="Tulis dalam layar penuh" onClick={masukModePenuh}><Maximize2 size={16}/></button>
      </span>
    </label>
    {modePenuh && createPortal(<div className="editor-catatan-overlay">
      <section className="editor-catatan-penuh" aria-label="Editor deskripsi layar penuh">
        <header className="editor-catatan-header"><div><span>MENULIS DESKRIPSI</span><strong>{judul || 'Deskripsi'}</strong></div><button className="editor-catatan-selesai" type="button" onClick={keluarModePenuh}><Check size={17}/>Selesai</button></header>
        <textarea ref={textareaPenuh} className="editor-catatan-teks" value={nilai} onChange={(event) => aturNilai(event.target.value)} onSelect={simpanPosisiKursor} aria-label="Isi deskripsi" placeholder={placeholder} />
        <footer className="editor-catatan-footer">Teks tersimpan di formulir. Tekan Selesai untuk kembali, lalu tekan Simpan.</footer>
      </section>
    </div>, document.body)}
  </>
}
