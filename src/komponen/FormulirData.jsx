import { X } from 'lucide-react'
import { ubahKeKunciTanggalLokal as tanggalHariIni } from '../fungsi-bantuan/tanggal.js'

export function FormulirData({ modal, subjects, onClose, onSave }) {
  const { page, item } = modal
  const isSubject = page === 'Mata Pelajaran'
  const isTask = page === 'Tugas'
  const isNote = page === 'Catatan'
  const isCalendar = page === 'Kalender'
  const titleLabel = isSubject ? 'Nama mata pelajaran' : 'Judul'
  function kirimFormulir(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (key) => String(form.get(key) || '').trim()
    if (isSubject && value('day') && (!value('start') || !value('end') || value('start') >= value('end'))) {
      window.alert('Isi waktu mulai dan selesai yang valid untuk jadwal belajar.')
      return
    }
    if (isSubject) onSave({ name: value('name'), code: value('code'), teacher: value('teacher'), category: value('category'), level: value('level'), description: value('description'), color: value('color'), schedule: value('day') ? [{ day: value('day'), start: value('start'), end: value('end'), room: value('room') }] : [] })
    else if (isTask) onSave({ title: value('title'), description: value('description'), subject: value('subject'), deadline: value('deadline'), priority: value('priority'), status: value('status') })
    else if (isNote) onSave({ title: value('title'), description: value('description'), subject: value('subject') })
    else if (isCalendar) onSave({ title: value('title'), description: value('description'), date: value('date'), time: value('time') })
    else onSave({ title: value('title'), description: value('description'), date: value('date'), time: value('time') })
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card"><div className="modal-heading"><div><p className="eyebrow">STUDYFLOW / {page.toUpperCase()}</p><h2>{item ? 'Edit' : 'Tambah'} {isSubject ? 'mata pelajaran' : isTask ? 'tugas' : isNote ? 'catatan' : isCalendar ? 'kegiatan' : 'pengingat'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup"><X size={20}/></button></div><form onSubmit={kirimFormulir} className="modal-form">
    <label className="field-label">{titleLabel}<input className="form-control" name={isSubject ? 'name' : 'title'} defaultValue={item?.name || item?.title || ''} required autoFocus/></label>
    {isSubject ? <>
      <label className="field-label">Pengajar (opsional)<input className="form-control" name="teacher" defaultValue={item?.teacher || ''} placeholder="Nama guru atau pengajar" /></label>
      <div className="form-two"><label className="field-label">Bidang atau kategori<input className="form-control" name="category" defaultValue={item?.category || ''} placeholder="Contoh: Sains" /></label><label className="field-label">Kelas atau tingkat<input className="form-control" name="level" defaultValue={item?.level || ''} placeholder="Opsional" /></label></div>
      <label className="field-label">Kode pelajaran (opsional)<input className="form-control" name="code" defaultValue={item?.code || ''} placeholder="Boleh dikosongkan" /></label>
      <label className="field-label">Deskripsi (opsional)<textarea className="form-control textarea-control" name="description" rows="2" defaultValue={item?.description || ''} placeholder="Catatan singkat tentang pelajaran ini" /></label>
      <label className="field-label">Warna identitas<input className="form-control color-input" type="color" name="color" defaultValue={item?.color?.startsWith('#') ? item.color : '#D5735B'} /></label>
      <div className="form-two"><label className="field-label">Hari belajar<select name="day" className="form-control" defaultValue={item?.schedule?.[0]?.day || ''}><option value="">Pilih hari (opsional)</option>{['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map((day)=><option key={day}>{day}</option>)}</select></label><label className="field-label">Lokasi belajar<input className="form-control" name="room" defaultValue={item?.schedule?.[0]?.room || ''} placeholder="Opsional" /></label></div>
      <div className="form-two"><label className="field-label">Mulai<input className="form-control" type="time" name="start" defaultValue={item?.schedule?.[0]?.start || ''}/></label><label className="field-label">Selesai<input className="form-control" type="time" name="end" defaultValue={item?.schedule?.[0]?.end || ''}/></label></div>
    </> : <>
      {(isTask || isNote || isCalendar || page === 'Pengingat') && <label className="field-label">{isNote || isTask ? 'Deskripsi' : 'Keterangan'}<textarea className="form-control textarea-control" name="description" rows="3" defaultValue={item?.description || ''}/></label>}
      {(isTask || isNote) && <label className="field-label">Mata pelajaran<select name="subject" className="form-control" defaultValue={item?.subject || ''}><option value="">Tanpa mata pelajaran</option>{subjects.map((subject)=><option key={subject.id}>{subject.name}</option>)}</select></label>}
      {(isTask || isCalendar || page === 'Pengingat') && <div className="form-two"><label className="field-label">Tanggal<input className="form-control" type="date" name={isTask ? 'deadline' : 'date'} defaultValue={item?.deadline || item?.date || tanggalHariIni()} required/></label><label className="field-label">Jam<input className="form-control" type="time" name="time" defaultValue={item?.time || ''}/></label></div>}
      {isTask && <div className="form-two"><label className="field-label">Prioritas<select name="priority" className="form-control" defaultValue={item?.priority || 'Sedang'}>{['Rendah','Sedang','Tinggi'].map((value)=><option key={value}>{value}</option>)}</select></label><label className="field-label">Status<select name="status" className="form-control" defaultValue={item?.status || (item?.done ? 'Selesai' : 'Belum dikerjakan')}>{['Belum dikerjakan','Sedang dikerjakan','Selesai'].map((value)=><option key={value}>{value}</option>)}</select></label></div>}
    </>}
    <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Batal</button><button className="primary-button" type="submit">{item ? 'Simpan perubahan' : 'Simpan'}</button></div></form></section></div>
}
