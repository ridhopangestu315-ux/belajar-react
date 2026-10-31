import { useState } from 'react'
import { Bell, BookOpen, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Circle, ClipboardList, NotebookPen, Plus, Search, Trash2 } from 'lucide-react'
import { TampilanKosong } from '../komponen/KomponenBelajar.jsx'
import PengantarHalaman from '../komponen/PengantarHalaman.jsx'
import { ubahKeKunciTanggalLokal as tanggalHariIni } from '../fungsi-bantuan/tanggal.js'

export function HalamanData({ page, data, kataPencarian, aturKataPencarian, filter, setFilter, filterMataPelajaran, aturFilterMataPelajaran, onAdd, onEdit, onDelete, onToggle }) {
  const apakahMataPelajaran = page === 'Mata Pelajaran'
  const kategoriMataPelajaran = [...new Set(data.map((item) => item.category).filter(Boolean))]
  const filtered = data.filter((item) => {
    const searchable = `${item.title || ''} ${item.name || ''} ${item.description || ''} ${item.subject || ''} ${item.teacher || ''} ${item.category || ''} ${item.level || ''}`.toLowerCase().includes(kataPencarian.toLowerCase())
    if (apakahMataPelajaran) return searchable && (filterMataPelajaran === 'Semua bidang' || item.category === filterMataPelajaran)
    if (page !== 'Tugas') return searchable
    return searchable && (filter === 'Semua tugas' || filter === 'Belum selesai' && !item.done || filter === 'Selesai' && item.done || filter === 'Prioritas tinggi' && item.priority === 'Tinggi' || filter === 'Sedang dikerjakan' && item.status === 'Sedang dikerjakan')
  })
  const addLabel = apakahMataPelajaran ? 'Tambah mata pelajaran' : page === 'Tugas' ? 'Tambah tugas' : page === 'Catatan' ? 'Tambah catatan' : 'Tambah pengingat'
  const ikonHalaman = apakahMataPelajaran ? BookOpen : page === 'Tugas' ? ClipboardList : page === 'Catatan' ? NotebookPen : Bell
  const aksiTambah = <button className="primary-button" onClick={onAdd}><Plus size={18}/><span>{addLabel}</span></button>
  return <div className="non-dashboard-page"><PengantarHalaman halaman={page} judul={page} deskripsi={deskripsiHalaman[page]} Ikon={ikonHalaman} aksi={aksiTambah}/>
    <section className="panel data-panel"><div className="data-toolbar"><div className="search-box"><Search size={17}/><input value={kataPencarian} onChange={(event) => aturKataPencarian(event.target.value)} placeholder={`Cari ${page.toLowerCase()}...`}/></div>{page === 'Tugas' && <select className="select-control" value={filter} onChange={(event) => setFilter(event.target.value)}>{['Semua tugas', 'Belum selesai', 'Sedang dikerjakan', 'Selesai', 'Prioritas tinggi'].map((option) => <option key={option}>{option}</option>)}</select>}{apakahMataPelajaran && <select className="select-control" value={filterMataPelajaran} onChange={(event) => aturFilterMataPelajaran(event.target.value)}><option>Semua bidang</option>{kategoriMataPelajaran.map((category) => <option key={category}>{category}</option>)}</select>}</div>
      {filtered.length ? <div className={page === 'Mata Pelajaran' || page === 'Catatan' ? 'cards-grid' : 'records-list'}>{filtered.map((item) => <KartuData key={item.id} item={item} page={page} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onToggle={() => onToggle(item.id)}/>)}</div> : data.length ? <TampilanKosong text={`Tidak ada ${page.toLowerCase()} yang cocok dengan pencarianmu.`} Ikon={ikonHalaman} gayaHalaman/> : <TampilanKosong Ikon={ikonHalaman} text={`Belum ada ${page.toLowerCase()} di sini.`} subtext="Gunakan tombol tambah untuk memulai." actionLabel={addLabel} onAction={onAdd} gayaHalaman/>}</section>
  </div>
}
const deskripsiHalaman = { 'Mata Pelajaran': 'Your subjects, your schedule, your progress!', Tugas: 'Kelola tugas dan jaga deadline tetap terkendali.', Catatan: 'Jangan sampai ide bagusmu lupa dicatat!', Pengingat: 'Ingat aktivitas penting yang akan datang.' }
function KartuData({ item, page, onEdit, onDelete, onToggle }) {
  if (page === 'Tugas') return <div className={`record-task ${item.done ? 'task-done' : ''}`}><button className="check-button" onClick={onToggle} aria-label="Ubah status">{item.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button><div className="record-body"><strong>{item.title}</strong><p>{item.description || 'Tidak ada deskripsi'}</p><span>{item.subject || 'Tanpa mata pelajaran'} · Deadline {item.deadline || 'belum ditentukan'}</span></div><span className={`priority priority-${(item.priority || 'sedang').toLowerCase()}`}>{item.status || (item.done ? 'Selesai' : item.priority || 'Sedang')}</span><AksiCatatan onEdit={onEdit} onDelete={onDelete}/></div>
  if (page === 'Mata Pelajaran') return <article className="subject-card" style={{ '--subject-color': item.color || '#D5735B' }}><div className="subject-card-top"><span className="subject-color-dot"/><span>{item.category || 'UMUM'}{item.level ? ` · ${item.level}` : ''}</span><AksiCatatan onEdit={onEdit} onDelete={onDelete}/></div><h3>{item.name}</h3>{item.teacher && <p>Pengajar: {item.teacher}</p>}{item.description && <p className="subject-description">{item.description}</p>}{item.code && <span className="subject-code">Kode pelajaran: {item.code}</span>}<div className="subject-schedule">{(item.schedule || []).map((slot, i) => <span key={i}>{slot.day} · {slot.start}–{slot.end}{slot.room ? ` · ${slot.room}` : ''}</span>)}{!item.schedule?.length && <span>Jadwal belajar belum ditambahkan</span>}</div></article>
  if (page === 'Catatan') return <article className="note-card"><div className="note-card-head"><span className="note-label">{item.subject || 'CATATAN'}</span><AksiCatatan onEdit={onEdit} onDelete={onDelete}/></div><h3>{item.title}</h3><p>{item.description}</p><span className="record-date">{item.createdAt}</span></article>
  return <div className="record-task"><button className="check-button" onClick={onToggle}>{item.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button><div className="record-body"><strong>{item.title}</strong><p>{item.description}</p><span>{item.date} {item.time && `· ${item.time}`}</span></div><AksiCatatan onEdit={onEdit} onDelete={onDelete}/></div>
}
function AksiCatatan({ onEdit, onDelete }) { return <div className="record-actions"><button className="subtle-button" aria-label="Edit" onClick={onEdit}>Edit</button><button className="delete-button" aria-label="Hapus" onClick={onDelete}><Trash2 size={16}/></button></div> }

export function HalamanKalender({ daftarTugas, daftarMataPelajaran, daftarAktivitas, selisihBulan, aturSelisihBulan, now, onAdd }) {
  const [selectedDate, setSelectedDate] = useState(tanggalHariIni())
  const monthDate = new Date(now.getFullYear(), now.getMonth() + selisihBulan, 1)
  const monthTitle = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(monthDate)
  const firstWeekday = (monthDate.getDay() + 6) % 7
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const dayDate = (day) => `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const events = (day) => {
    const date = dayDate(day)
    const weekday = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date(`${date}T12:00:00`))
    const classes = daftarMataPelajaran.flatMap((subject) => (subject.schedule || []).filter((slot) => slot.day === weekday).map((slot) => ({ label: `${slot.start || ''} ${subject.name}`, type: 'event-class' })))
    return [...daftarTugas.filter((task) => task.deadline === date).map((task) => ({ label: task.title, type: 'event-task' })), ...daftarAktivitas.filter((item) => item.date === date).map((item) => ({ label: item.title || item.text, type: 'event-activity' })), ...classes]
  }
  const todayMatches = monthDate.getMonth() === now.getMonth() && monthDate.getFullYear() === now.getFullYear()
  const tanggalTerpilih = selectedDate.startsWith(`${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-`) ? Number(selectedDate.slice(-2)) : null
  const selectedEvents = tanggalTerpilih ? events(tanggalTerpilih) : []
  return <div className="non-dashboard-page">
    <PengantarHalaman halaman="Kalender" judul="Kalender belajar" deskripsi="Lihat dan atur jadwal kegiatan belajarmu." Ikon={CalendarDays} aksi={<button className="primary-button" onClick={onAdd}><Plus size={18} /><span>Tambah kegiatan</span></button>}/>
    <section className="panel calendar-panel">
      <div className="calendar-header">
        <button className="icon-button" onClick={() => aturSelisihBulan((offset) => offset - 1)} aria-label="Bulan sebelumnya"><ChevronLeft size={20} /></button>
        <h2>{monthTitle}</h2>
        <button className="icon-button" onClick={() => aturSelisihBulan((offset) => offset + 1)} aria-label="Bulan berikutnya"><ChevronRight size={20} /></button>
        <button className="subtle-button tanggalHariIni-button" onClick={() => { aturSelisihBulan(0); setSelectedDate(tanggalHariIni()) }}>Hari ini</button>
      </div>
      <div className="calendar-grid calendar-weekdays">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">
        {cells.map((day, index) => {
          const isSelected = day && tanggalTerpilih === day
          const isToday = day && todayMatches && day === now.getDate()
          const dayClass = ['calendar-day', isToday && 'is-tanggalHariIni', isSelected && 'is-selected'].filter(Boolean).join(' ')
          return <button type="button" aria-label={day ? `Pilih ${day} ${monthTitle}` : undefined} aria-pressed={day ? Boolean(isSelected) : undefined} className={dayClass} key={`${day}-${index}`} disabled={!day} onClick={() => day && setSelectedDate(dayDate(day))}>
            {day && <><span className="day-number">{day}</span>{events(day).slice(0, 2).map((event, eventIndex) => <span key={eventIndex} className={'calendar-event ' + event.type}>{event.label}</span>)}</>}
          </button>
        })}
      </div>
      <div className="calendar-legend"><span><i className="legend-dot purple-dot" />Deadline tugas</span><span><i className="legend-dot blue-dot" />Kegiatan</span><span><i className="legend-dot green-dot" />Jadwal belajar: {daftarMataPelajaran.length} mata pelajaran</span></div>
      <section className="calendar-selected">
        <h3>{tanggalTerpilih ? new Intl.DateTimeFormat('id-ID', { weekday:'long', day:'numeric', month:'long' }).format(new Date(dayDate(tanggalTerpilih) + 'T12:00:00')) : 'Pilih tanggal untuk melihat jadwal'}</h3>
        {selectedEvents.length ? <div className="selected-event-list">{selectedEvents.map((event, index) => {
          const tone = event.type === 'event-task' ? 'purple-dot' : event.type === 'event-class' ? 'green-dot' : 'blue-dot'
          return <div className="selected-event" key={event.label + index}><span className={'legend-dot ' + tone} /><span>{event.label}</span></div>
        })}</div> : <p className="muted">Tidak ada kegiatan tercatat pada tanggal ini.</p>}
      </section>
    </section>
  </div>
}
