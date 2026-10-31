import { useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Plus, Search, Trash2 } from 'lucide-react'
import { EmptyState } from '../components/StudyComponents.jsx'
import { toLocalDateKey as today } from '../utils/date.js'

export function DataPage({ page, data, search, setSearch, filter, setFilter, subjectFilter, setSubjectFilter, onAdd, onEdit, onDelete, onToggle }) {
  const isSubjects = page === 'Mata Pelajaran'
  const subjectCategories = [...new Set(data.map((item) => item.category).filter(Boolean))]
  const filtered = data.filter((item) => {
    const searchable = `${item.title || ''} ${item.name || ''} ${item.description || ''} ${item.subject || ''} ${item.teacher || ''} ${item.category || ''} ${item.level || ''}`.toLowerCase().includes(search.toLowerCase())
    if (isSubjects) return searchable && (subjectFilter === 'Semua bidang' || item.category === subjectFilter)
    if (page !== 'Tugas') return searchable
    return searchable && (filter === 'Semua tugas' || filter === 'Belum selesai' && !item.done || filter === 'Selesai' && item.done || filter === 'Prioritas tinggi' && item.priority === 'Tinggi' || filter === 'Sedang dikerjakan' && item.status === 'Sedang dikerjakan')
  })
  const addLabel = isSubjects ? 'Tambah mata pelajaran' : page === 'Tugas' ? 'Tambah tugas' : page === 'Catatan' ? 'Tambah catatan' : 'Tambah pengingat'
  return <><div className="welcome-row"><div><p className="eyebrow">STUDYFLOW / {page.toUpperCase()}</p><h1>{page}</h1><p className="muted">{pageDescriptions[page]}</p></div><button className="primary-button" onClick={onAdd}><Plus size={18}/>{addLabel}</button></div>
    <section className="panel data-panel"><div className="data-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Cari ${page.toLowerCase()}...`}/></div>{page === 'Tugas' && <select className="select-control" value={filter} onChange={(event) => setFilter(event.target.value)}>{['Semua tugas', 'Belum selesai', 'Sedang dikerjakan', 'Selesai', 'Prioritas tinggi'].map((option) => <option key={option}>{option}</option>)}</select>}{isSubjects && <select className="select-control" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option>Semua bidang</option>{subjectCategories.map((category) => <option key={category}>{category}</option>)}</select>}</div>
      {filtered.length ? <div className={page === 'Mata Pelajaran' || page === 'Catatan' ? 'cards-grid' : 'records-list'}>{filtered.map((item) => <DataCard key={item.id} item={item} page={page} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onToggle={() => onToggle(item.id)}/>)}</div> : <EmptyState text={`Belum ada ${page.toLowerCase()} di sini. Gunakan tombol tambah untuk memulai.`}/>}</section></>
}
const pageDescriptions = { 'Mata Pelajaran': 'Atur materi, pengajar, kategori, dan jadwal belajarmu.', Tugas: 'Kelola tugas dan jaga deadline tetap terkendali.', Catatan: 'Simpan ide dan catatan belajarmu.', Pengingat: 'Ingat aktivitas penting yang akan datang.' }
function DataCard({ item, page, onEdit, onDelete, onToggle }) {
  if (page === 'Tugas') return <div className={`record-task ${item.done ? 'task-done' : ''}`}><button className="check-button" onClick={onToggle} aria-label="Ubah status">{item.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button><div className="record-body"><strong>{item.title}</strong><p>{item.description || 'Tidak ada deskripsi'}</p><span>{item.subject || 'Tanpa mata pelajaran'} · Deadline {item.deadline || 'belum ditentukan'}</span></div><span className={`priority priority-${(item.priority || 'sedang').toLowerCase()}`}>{item.status || (item.done ? 'Selesai' : item.priority || 'Sedang')}</span><RecordActions onEdit={onEdit} onDelete={onDelete}/></div>
  if (page === 'Mata Pelajaran') return <article className="subject-card" style={{ '--subject-color': item.color || '#D5735B' }}><div className="subject-card-top"><span className="subject-color-dot"/><span>{item.category || 'UMUM'}{item.level ? ` · ${item.level}` : ''}</span><RecordActions onEdit={onEdit} onDelete={onDelete}/></div><h3>{item.name}</h3>{item.teacher && <p>Pengajar: {item.teacher}</p>}{item.description && <p className="subject-description">{item.description}</p>}{item.code && <span className="subject-code">Kode pelajaran: {item.code}</span>}<div className="subject-schedule">{(item.schedule || []).map((slot, i) => <span key={i}>{slot.day} · {slot.start}–{slot.end}{slot.room ? ` · ${slot.room}` : ''}</span>)}{!item.schedule?.length && <span>Jadwal belajar belum ditambahkan</span>}</div></article>
  if (page === 'Catatan') return <article className="note-card"><div className="note-card-head"><span className="note-label">{item.subject || 'CATATAN'}</span><RecordActions onEdit={onEdit} onDelete={onDelete}/></div><h3>{item.title}</h3><p>{item.description}</p><span className="record-date">{item.createdAt}</span></article>
  return <div className="record-task"><button className="check-button" onClick={onToggle}>{item.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button><div className="record-body"><strong>{item.title}</strong><p>{item.description}</p><span>{item.date} {item.time && `· ${item.time}`}</span></div><RecordActions onEdit={onEdit} onDelete={onDelete}/></div>
}
function RecordActions({ onEdit, onDelete }) { return <div className="record-actions"><button className="subtle-button" aria-label="Edit" onClick={onEdit}>Edit</button><button className="delete-button" aria-label="Hapus" onClick={onDelete}><Trash2 size={16}/></button></div> }

export function CalendarPage({ tasks, subjects, activities, monthOffset, setMonthOffset, now, onAdd }) {
  const [selectedDate, setSelectedDate] = useState(today())
  const monthDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthTitle = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(monthDate)
  const firstWeekday = (monthDate.getDay() + 6) % 7
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const dayDate = (day) => `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const events = (day) => {
    const date = dayDate(day)
    const weekday = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date(`${date}T12:00:00`))
    const classes = subjects.flatMap((subject) => (subject.schedule || []).filter((slot) => slot.day === weekday).map((slot) => ({ label: `${slot.start || ''} ${subject.name}`, type: 'event-class' })))
    return [...tasks.filter((task) => task.deadline === date).map((task) => ({ label: task.title, type: 'event-task' })), ...activities.filter((item) => item.date === date).map((item) => ({ label: item.title || item.text, type: 'event-activity' })), ...classes]
  }
  const todayMatches = monthDate.getMonth() === now.getMonth() && monthDate.getFullYear() === now.getFullYear()
  const selectedDay = selectedDate.startsWith(`${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-`) ? Number(selectedDate.slice(-2)) : null
  const selectedEvents = selectedDay ? events(selectedDay) : []
  return <>
    <div className="welcome-row">
      <div><p className="eyebrow">STUDYFLOW / KALENDER</p><h1>Kalender belajar</h1><p className="muted">Lihat deadline dan rencanakan kegiatanmu.</p></div>
      <button className="primary-button" onClick={onAdd}><Plus size={18} />Tambah kegiatan</button>
    </div>
    <section className="panel calendar-panel">
      <div className="calendar-header">
        <button className="icon-button" onClick={() => setMonthOffset((offset) => offset - 1)} aria-label="Bulan sebelumnya"><ChevronLeft size={20} /></button>
        <h2>{monthTitle}</h2>
        <button className="icon-button" onClick={() => setMonthOffset((offset) => offset + 1)} aria-label="Bulan berikutnya"><ChevronRight size={20} /></button>
        <button className="subtle-button today-button" onClick={() => { setMonthOffset(0); setSelectedDate(today()) }}>Hari ini</button>
      </div>
      <div className="calendar-grid calendar-weekdays">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">
        {cells.map((day, index) => {
          const isSelected = day && selectedDay === day
          const isToday = day && todayMatches && day === now.getDate()
          const dayClass = ['calendar-day', isToday && 'is-today', isSelected && 'is-selected'].filter(Boolean).join(' ')
          return <button type="button" aria-label={day ? `Pilih ${day} ${monthTitle}` : undefined} aria-pressed={day ? Boolean(isSelected) : undefined} className={dayClass} key={`${day}-${index}`} disabled={!day} onClick={() => day && setSelectedDate(dayDate(day))}>
            {day && <><span className="day-number">{day}</span>{events(day).slice(0, 2).map((event, eventIndex) => <span key={eventIndex} className={'calendar-event ' + event.type}>{event.label}</span>)}</>}
          </button>
        })}
      </div>
      <div className="calendar-legend"><span><i className="legend-dot purple-dot" />Deadline tugas</span><span><i className="legend-dot blue-dot" />Kegiatan</span><span><i className="legend-dot green-dot" />Jadwal belajar: {subjects.length} mata pelajaran</span></div>
      <section className="calendar-selected">
        <h3>{selectedDay ? new Intl.DateTimeFormat('id-ID', { weekday:'long', day:'numeric', month:'long' }).format(new Date(dayDate(selectedDay) + 'T12:00:00')) : 'Pilih tanggal untuk melihat jadwal'}</h3>
        {selectedEvents.length ? <div className="selected-event-list">{selectedEvents.map((event, index) => {
          const tone = event.type === 'event-task' ? 'purple-dot' : event.type === 'event-class' ? 'green-dot' : 'blue-dot'
          return <div className="selected-event" key={event.label + index}><span className={'legend-dot ' + tone} /><span>{event.label}</span></div>
        })}</div> : <p className="muted">Tidak ada kegiatan tercatat pada tanggal ini.</p>}
      </section>
    </section>
  </>
}
