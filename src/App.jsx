import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock3, Menu, Plus, Search, Sparkles, Target, Trash2, TrendingUp, X } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'

const today = () => new Date().toISOString().slice(0, 10)
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`
const pageToData = { 'Mata Pelajaran': 'subjects', Tugas: 'tasks', Catatan: 'notes', Pengingat: 'reminders' }

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [tasks, setTasks] = useLocalStorage('studyflow_tasks', [])
  const [subjects, setSubjects] = useLocalStorage('studyflow_subjects', [])
  const [notes, setNotes] = useLocalStorage('studyflow_notes', [])
  const [reminders, setReminders] = useLocalStorage('studyflow_reminders', [])
  const [activities, setActivities] = useLocalStorage('studyflow_activities', [])
  const [settings, setSettings] = useLocalStorage('studyflow_settings', { name: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [taskFilter, setTaskFilter] = useState('Semua tugas')
  const [monthOffset, setMonthOffset] = useState(0)
  const [timerMode, setTimerMode] = useState('Fokus')
  const [secondsLeft, setSecondsLeft] = useLocalStorage('studyflow_timer_seconds', (settings.focusMinutes || 25) * 60)
  const [timerRunning, setTimerRunning] = useLocalStorage('studyflow_timer_running', false)
  const [focusSessions, setFocusSessions] = useLocalStorage('studyflow_focus_sessions', 0)
  const [timerNotice, setTimerNotice] = useState('')
  const [toast, setToast] = useState('')
  const hasAnimatedStats = useRef(false)

  const completedTasks = tasks.filter((task) => task.done).length
  const openTasks = tasks.length - completedTasks
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.deadline || '9999').localeCompare(b.deadline || '9999')), [tasks])

  useEffect(() => {
    if (activePage === 'Dashboard') hasAnimatedStats.current = true
  }, [activePage])

  useEffect(() => {
    const applyTheme = () => {
      const theme = settings.theme || 'system'
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    }
    applyTheme()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [settings.theme])

  // The timer is kept in shared app state, so changing pages does not reset it.
  useEffect(() => {
    if (!timerRunning) return undefined
    const timerId = window.setInterval(() => setSecondsLeft((seconds) => {
      if (seconds <= 1) {
        setTimerRunning(false)
        if (timerMode === 'Fokus') setFocusSessions((count) => count + 1)
        window.dispatchEvent(new CustomEvent('studyflow:timer-done', { detail: timerMode }))
        return 0
      }
      return seconds - 1
    }), 1000)
    return () => window.clearInterval(timerId)
  }, [timerRunning, timerMode, setFocusSessions, setSecondsLeft, setTimerRunning])

  useEffect(() => {
    function showTimerNotice(event) {
      setTimerNotice(`${event.detail} selesai. Saatnya ${event.detail === 'Fokus' ? 'istirahat sejenak' : 'kembali belajar'}!`)
      window.setTimeout(() => setTimerNotice(''), 5000)
    }
    window.addEventListener('studyflow:timer-done', showTimerNotice)
    return () => window.removeEventListener('studyflow:timer-done', showTimerNotice)
  }, [])

  function openCreateForm(page = activePage, item = null) {
    setModal({ page, item })
  }

  function saveItem(formData) {
    const { page, item } = modal
    const id = item?.id || createId()
    const addActivity = (text) => setActivities((list) => [{ id: createId(), text, date: today() }, ...list].slice(0, 12))
    if (page === 'Tugas') {
      const taskData = { ...formData, done: formData.status === 'Selesai' }
      setTasks((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...taskData } : entry) : [...list, { ...taskData, id }])
      if (!item) addActivity(`Menambahkan tugas “${formData.title}”`)
    } else if (page === 'Mata Pelajaran') setSubjects((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...formData } : entry) : [...list, { ...formData, id }])
    else if (page === 'Catatan') setNotes((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...formData } : entry) : [...list, { ...formData, id, createdAt: today() }])
    else if (page === 'Pengingat') setReminders((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...formData } : entry) : [...list, { ...formData, id, done: false }])
    else if (page === 'Kalender') setActivities((list) => [{ ...formData, id, date: formData.date || today(), type: 'Kegiatan' }, ...list])
    setModal(null)
    tampilkanNotifikasi(`${item ? 'Perubahan' : 'Data'} berhasil disimpan.`)
  }

  function tampilkanNotifikasi(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function removeItem(page, id) {
    const setter = { Tugas: setTasks, 'Mata Pelajaran': setSubjects, Catatan: setNotes, Pengingat: setReminders }[page]
    if (setter) setter((list) => list.filter((item) => item.id !== id))
  }

  function toggleTask(id) {
    const task = tasks.find((entry) => entry.id === id)
    setTasks((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done, status: entry.done ? 'Belum dikerjakan' : 'Selesai' } : entry))
    if (task && !task.done) tampilkanNotifikasi('Tugas selesai. Kerja bagus!')
  }

  function updateTimerMode(mode) {
    setTimerMode(mode)
    const minutes = mode === 'Fokus' ? settings.focusMinutes : mode === 'Istirahat panjang' ? settings.longBreak : settings.shortBreak
    setSecondsLeft(minutes * 60)
    setTimerRunning(false)
  }

  function startFocusTimer() {
    if (secondsLeft === 0) updateTimerMode(timerMode)
    setTimerRunning(true)
  }

  function resetAppData() {
    if (!window.confirm('Hapus semua data StudyFlow dari browser ini?')) return
    setTasks([]); setSubjects([]); setNotes([]); setReminders([]); setActivities([]); setFocusSessions(0); setSettings({ name: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  }

  return <div className="app-shell">
    <Sidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Buka navigasi" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button><div className="breadcrumb">Ruang belajar <ChevronRight size={15}/> <strong>{activePage}</strong></div><div className="topbar-actions"><span className="today-pill"><CalendarDays size={16}/>{new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span><button className="icon-button notification-button" aria-label="Pengingat" onClick={() => setActivePage('Pengingat')}><Bell size={19}/>{reminders.some((item) => !item.done) && <i/>}</button><div className="avatar avatar-small">{(settings.name || 'S').slice(0, 1).toUpperCase()}</div></div></header>
      <section className="page-content" key={activePage}>
        {activePage === 'Dashboard' && <Dashboard name={settings.name} tasks={sortedTasks} subjects={subjects} activities={activities} totalTasks={tasks.length} openTasks={openTasks} completedTasks={completedTasks} progress={progress} onToggleTask={toggleTask} onAddTask={() => openCreateForm('Tugas')} onNavigate={setActivePage} animateStats={!hasAnimatedStats.current}/>}
        {pageToData[activePage] && <DataPage page={activePage} data={({ Tugas: sortedTasks, 'Mata Pelajaran': subjects, Catatan: notes, Pengingat: [...reminders].sort((a,b) => (a.date || '').localeCompare(b.date || '')) })[activePage]} search={search} setSearch={setSearch} filter={taskFilter} setFilter={setTaskFilter} onAdd={() => openCreateForm()} onEdit={(item) => openCreateForm(activePage, item)} onDelete={(id) => removeItem(activePage, id)} onToggle={(id) => activePage === 'Tugas' ? toggleTask(id) : setReminders((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done } : entry))}/>}
        {activePage === 'Kalender' && <CalendarPage tasks={tasks} subjects={subjects} activities={activities} monthOffset={monthOffset} setMonthOffset={setMonthOffset} onAdd={() => openCreateForm('Kalender')}/>}
        {activePage === 'Focus Mode' && <FocusPage mode={timerMode} seconds={secondsLeft} running={timerRunning} sessions={focusSessions} onMode={updateTimerMode} onRun={startFocusTimer} onPause={() => setTimerRunning(false)} onReset={() => { setTimerRunning(false); updateTimerMode(timerMode) }}/ >}
        {activePage === 'Progress Belajar' && <ProgressPage tasks={tasks} subjects={subjects} sessions={focusSessions} activities={activities}/>}
        {activePage === 'Pengaturan' && <SettingsPage settings={settings} setSettings={setSettings} onReset={resetAppData}/>}
      </section>
    </main>
    {modal && <ItemModal modal={modal} subjects={subjects} onClose={() => setModal(null)} onSave={saveItem}/>}
    {(timerNotice || toast) && <div className="timer-notice toast-enter" role="status"><CheckCircle2 size={18}/>{timerNotice || toast}<button onClick={() => { setTimerNotice(''); setToast('') }} aria-label="Tutup pemberitahuan"><X size={16}/></button></div>}
  </div>
}

function Dashboard({ name, tasks, subjects, activities, totalTasks, openTasks, completedTasks, progress, onToggleTask, onAddTask, onNavigate, animateStats }) {
  const upcoming = tasks.filter((task) => !task.done).slice(0, 4)
  const weekday = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date())
  const todayClasses = subjects.flatMap((subject) => (subject.schedule || []).filter((slot) => slot.day === weekday).map((slot) => ({ ...slot, subject })))
  return <>
    <div className="welcome-row"><div><p className="eyebrow">{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</p><h1>Selamat {new Date().getHours() < 11 ? 'pagi' : new Date().getHours() < 15 ? 'siang' : 'sore'}{name ? `, ${name}` : ''} <span>✦</span></h1><p className="muted">Siap untuk membuat hari ini lebih produktif?</p></div><button className="primary-button" onClick={onAddTask}><Plus size={18}/>Tambah tugas</button></div>
    <div className="dashboard-summary"><span className="summary-title">Ringkasan tugas</span><div><strong><CountUp value={totalTasks} active={animateStats}/></strong><small>Total</small></div><div><strong><CountUp value={openTasks} active={animateStats}/></strong><small>Berjalan</small></div><div><strong><CountUp value={completedTasks} active={animateStats}/></strong><small>Selesai</small></div><span className="summary-subjects">{subjects.length} mata pelajaran</span></div>
    <div className="dashboard-grid"><section className="panel progress-panel"><div className="panel-heading"><div><p className="eyebrow">PERFORMA</p><h2>Progress belajarmu</h2></div><button className="text-button" onClick={() => onNavigate('Progress Belajar')}>Lihat detail <ChevronRight size={16}/></button></div><div className="progress-content"><div className="progress-ring progress-animate" style={{ '--progress': `${progress}%` }}><div><strong>{progress}%</strong><span>selesai</span></div></div><div className="progress-legend"><p><i className="legend-dot purple-dot"/>Tugas selesai <strong>{completedTasks}</strong></p><p><i className="legend-dot gray-dot"/>Belum selesai <strong>{openTasks}</strong></p><span className="soft-message"><Sparkles size={16}/>Setiap langkah kecil berarti.</span></div></div></section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">DEADLINE</p><h2>Tugas terdekat</h2></div><button className="text-button" onClick={() => onNavigate('Tugas')}>Semua tugas <ChevronRight size={16}/></button></div>{upcoming.length ? <div className="task-list">{upcoming.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggleTask}/>)}</div> : <EmptyState text="Belum ada tugas. Mulai dengan satu langkah kecil hari ini." actionLabel="Tambah tugas" onAction={onAddTask}/>}</section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">JADWAL</p><h2>Kuliah hari ini</h2></div><button className="text-button" onClick={() => onNavigate('Mata Pelajaran')}>Lihat jadwal <ChevronRight size={16}/></button></div>{todayClasses.length ? <div className="class-list">{todayClasses.map((slot, index) => <div className="class-row" key={`${slot.subject.id}-${index}`}><span className="class-time">{slot.start || '—'}</span><span className="class-bar" style={{ background: slot.subject.color || '#8170e8' }}/><div><strong>{slot.subject.name}</strong><span>{slot.subject.code || 'Mata pelajaran'} · {slot.room || 'Ruang kuliah'}</span></div></div>)}</div> : <EmptyState text="Belum ada jadwal hari ini. Atur jadwal dari mata pelajaranmu." actionLabel="Lihat mata pelajaran" onAction={() => onNavigate('Mata Pelajaran')}/>}</section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">AKTIVITAS</p><h2>Aktivitas belajar</h2></div><TrendingUp size={19} className="subtle-icon" aria-label="Tren aktivitas"/></div>{activities.length ? <div className="activity-list">{activities.slice(0, 4).map((item, index) => <div className="activity-row activity-enter" style={{ '--item-index': index }} key={item.id}><span className="activity-mark"><Check size={14}/></span><div><strong>{item.text}</strong><span>{item.date}</span></div></div>)}</div> : <EmptyState text="Aktivitas belajar akan muncul di sini setelah kamu menambahkan tugas atau catatan."/>}</section></div>
  </>
}

function StatCard({ title, value, hint, icon, tone }) { return <article className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><span className="stat-title">{title}</span><strong className="stat-value">{value}</strong><span className="stat-hint">{hint}</span></div></article> }
function CountUp({ value, active }) {
  const [displayValue, setDisplayValue] = useState(0)
  useEffect(() => {
    if (!active || value === 0) return undefined
    let frame
    const start = performance.now()
    const tick = (now) => {
      const percent = Math.min((now - start) / 650, 1)
      setDisplayValue(Math.round(value * percent))
      if (percent < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, value])
  return active ? displayValue : value
}
function EmptyState({ text, actionLabel, onAction }) { return <div className="empty-state"><span className="empty-mark"><Sparkles size={18}/></span><p>{text}</p>{onAction && <button className="text-button empty-action" onClick={onAction}>{actionLabel}<ChevronRight size={15}/></button>}</div> }
function TaskRow({ task, onToggle }) {
  const late = task.deadline && task.deadline < today()
  const soon = task.deadline && !late && (new Date(task.deadline) - new Date(today())) / 86400000 < 3
  return <div className={`task-row ${task.done ? 'task-done' : ''}`}><button className="check-button" aria-label={task.done ? 'Tandai belum selesai' : 'Tandai selesai'} onClick={() => onToggle(task.id)}>{task.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button><div className="task-main"><strong>{task.title}</strong><span>{task.subject || 'Tanpa mata pelajaran'} · <span className={late ? 'deadline-late' : soon ? 'deadline-soon' : ''}>{task.deadline ? new Date(`${task.deadline}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Tanpa deadline'}</span></span></div><span className={`priority priority-${(task.priority || 'sedang').toLowerCase()}`}>{task.priority || 'Sedang'}</span></div>
}

function DataPage({ page, data, search, setSearch, filter, setFilter, onAdd, onEdit, onDelete, onToggle }) {
  const filtered = data.filter((item) => {
    const searchable = `${item.title || ''} ${item.name || ''} ${item.description || ''} ${item.subject || ''}`.toLowerCase().includes(search.toLowerCase())
    if (page !== 'Tugas') return searchable
    return searchable && (filter === 'Semua tugas' || filter === 'Belum selesai' && !item.done || filter === 'Selesai' && item.done || filter === 'Prioritas tinggi' && item.priority === 'Tinggi' || filter === 'Sedang dikerjakan' && item.status === 'Sedang dikerjakan')
  })
  return <><div className="welcome-row"><div><p className="eyebrow">STUDYFLOW / {page.toUpperCase()}</p><h1>{page}</h1><p className="muted">{pageDescriptions[page]}</p></div><button className="primary-button" onClick={onAdd}><Plus size={18}/>{page === 'Mata Pelajaran' ? 'Tambah mata pelajaran' : page === 'Tugas' ? 'Tambah tugas' : page === 'Catatan' ? 'Tambah catatan' : 'Tambah pengingat'}</button></div>
    <section className="panel data-panel"><div className="data-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Cari ${page.toLowerCase()}...`}/></div>{page === 'Tugas' && <select className="select-control" value={filter} onChange={(event) => setFilter(event.target.value)}>{['Semua tugas', 'Belum selesai', 'Sedang dikerjakan', 'Selesai', 'Prioritas tinggi'].map((option) => <option key={option}>{option}</option>)}</select>}</div>
      {filtered.length ? <div className={page === 'Mata Pelajaran' || page === 'Catatan' ? 'cards-grid' : 'records-list'}>{filtered.map((item) => <DataCard key={item.id} item={item} page={page} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onToggle={() => onToggle(item.id)}/>)}</div> : <EmptyState text={`Belum ada ${page.toLowerCase()} di sini. Gunakan tombol tambah untuk memulai.`}/>}</section></>
}
const pageDescriptions = { 'Mata Pelajaran': 'Atur kelas, dosen, dan jadwal kuliahmu.', Tugas: 'Kelola tugas dan jaga deadline tetap terkendali.', Catatan: 'Simpan ide dan catatan perkuliahanmu.', Pengingat: 'Ingat aktivitas penting yang akan datang.' }
function DataCard({ item, page, onEdit, onDelete, onToggle }) {
  if (page === 'Tugas') return <div className={`record-task ${item.done ? 'task-done' : ''}`}><button className="check-button" onClick={onToggle} aria-label="Ubah status">{item.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button><div className="record-body"><strong>{item.title}</strong><p>{item.description || 'Tidak ada deskripsi'}</p><span>{item.subject || 'Tanpa mata pelajaran'} · Deadline {item.deadline || 'belum ditentukan'}</span></div><span className={`priority priority-${(item.priority || 'sedang').toLowerCase()}`}>{item.status || (item.done ? 'Selesai' : item.priority || 'Sedang')}</span><RecordActions onEdit={onEdit} onDelete={onDelete}/></div>
  if (page === 'Mata Pelajaran') return <article className="subject-card" style={{ '--subject-color': item.color || '#8474ec' }}><div className="subject-card-top"><span className="subject-color-dot"/><span>{item.code || 'KELAS'}</span><RecordActions onEdit={onEdit} onDelete={onDelete}/></div><h3>{item.name}</h3><p>{item.lecturer || 'Nama dosen belum diisi'}</p><div className="subject-schedule">{(item.schedule || []).map((slot, i) => <span key={i}>{slot.day} · {slot.start}–{slot.end}</span>)}{!item.schedule?.length && <span>Jadwal belum ditambahkan</span>}</div></article>
  if (page === 'Catatan') return <article className="note-card"><div className="note-card-head"><span className="note-label">{item.subject || 'CATATAN'}</span><RecordActions onEdit={onEdit} onDelete={onDelete}/></div><h3>{item.title}</h3><p>{item.description}</p><span className="record-date">{item.createdAt}</span></article>
  return <div className="record-task"><button className="check-button" onClick={onToggle}>{item.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button><div className="record-body"><strong>{item.title}</strong><p>{item.description}</p><span>{item.date} {item.time && `· ${item.time}`}</span></div><RecordActions onEdit={onEdit} onDelete={onDelete}/></div>
}
function RecordActions({ onEdit, onDelete }) { return <div className="record-actions"><button className="subtle-button" aria-label="Edit" onClick={onEdit}>Edit</button><button className="delete-button" aria-label="Hapus" onClick={onDelete}><Trash2 size={16}/></button></div> }

function CalendarPage({ tasks, subjects, activities, monthOffset, setMonthOffset, onAdd }) {
  const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
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
  const todayMatches = monthDate.getMonth() === new Date().getMonth() && monthDate.getFullYear() === new Date().getFullYear()
  return <><div className="welcome-row"><div><p className="eyebrow">STUDYFLOW / KALENDER</p><h1>Kalender akademik</h1><p className="muted">Lihat deadline dan rencanakan kegiatanmu.</p></div><button className="primary-button" onClick={onAdd}><Plus size={18}/>Tambah kegiatan</button></div><section className="panel calendar-panel"><div className="calendar-header"><button className="icon-button" onClick={() => setMonthOffset((offset) => offset - 1)} aria-label="Bulan sebelumnya"><ChevronLeft size={20}/></button><h2>{monthTitle}</h2><button className="icon-button" onClick={() => setMonthOffset((offset) => offset + 1)} aria-label="Bulan berikutnya"><ChevronRight size={20}/></button><button className="subtle-button today-button" onClick={() => setMonthOffset(0)}>Hari ini</button></div><div className="calendar-grid calendar-weekdays">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((day, index) => <div className={`calendar-day ${day && todayMatches && day === new Date().getDate() ? 'is-today' : ''}`} key={`${day}-${index}`}>{day && <><span className="day-number">{day}</span>{events(day).slice(0, 2).map((event, eventIndex) => <span key={eventIndex} className={`calendar-event ${event.type}`}>{event.label}</span>)}</>}</div>)}</div><div className="calendar-legend"><span><i className="legend-dot purple-dot"/>Deadline tugas</span><span><i className="legend-dot blue-dot"/>Kegiatan</span><span><i className="legend-dot green-dot"/>Jadwal kuliah: {subjects.length} mata pelajaran</span></div></section></>
}

function FocusPage({ mode, seconds, running, sessions, onMode, onRun, onPause, onReset }) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainingSeconds = String(seconds % 60).padStart(2, '0')
  return <><div className="welcome-row"><div><p className="eyebrow">STUDYFLOW / FOCUS MODE</p><h1>Waktunya fokus</h1><p className="muted">Satu hal dalam satu waktu. Kamu pasti bisa.</p></div></div><div className="focus-layout"><section className="panel focus-panel"><div className="focus-tabs">{['Fokus', 'Istirahat pendek', 'Istirahat panjang'].map((item) => <button key={item} className={mode === item ? 'selected' : ''} onClick={() => onMode(item)}>{item}</button>)}</div><div className={`timer-circle ${running ? 'timer-active' : ''}`}><span>{mode.toUpperCase()}</span><strong>{minutes}:{remainingSeconds}</strong><small>Tarik napas, dan mulai.</small></div><div className="timer-actions">{running ? <button className="primary-button" onClick={onPause}>Jeda</button> : <button className="primary-button" onClick={onRun}>{seconds === 0 ? 'Mulai lagi' : 'Mulai fokus'}</button>}<button className="secondary-button" onClick={onReset}>Atur ulang</button></div><p className="timer-caption"><Target size={16}/>Sesi fokus selesai <strong>{sessions}</strong></p></section><aside className="panel focus-side"><span className="focus-side-icon"><Sparkles size={21}/></span><h2>Jaga ritmemu</h2><p>Fokus selama satu sesi, lalu ambil jeda sejenak untuk mengisi energi.</p><div className="focus-step"><span>01</span><p><strong>Fokus</strong><small>Belajar tanpa gangguan</small></p><b>25 menit</b></div><div className="focus-step"><span>02</span><p><strong>Istirahat</strong><small>Regangkan tubuhmu</small></p><b>5 menit</b></div><div className="focus-quote">“Kemajuan kecil yang konsisten membawa hasil besar.”</div></aside></div></>
}

function ProgressPage({ tasks, subjects, sessions, activities }) {
  const completed = tasks.filter((task) => task.done).length
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const activityCount = activities.filter((item) => item.date === today()).length
  return <><div className="welcome-row"><div><p className="eyebrow">STUDYFLOW / INSIGHT</p><h1>Progress belajar</h1><p className="muted">Lihat perkembangan dan rayakan kemajuanmu.</p></div></div><div className="stats-grid"><StatCard title="Total tugas" value={tasks.length} hint="Tercatat" icon={<CheckCircle2/>} tone="purple"/><StatCard title="Tugas selesai" value={completed} hint={`${percent}% dari total`} icon={<Check/>} tone="green"/><StatCard title="Belum selesai" value={tasks.length - completed} hint="Masih bisa dikerjakan" icon={<Clock3/>} tone="blue"/><StatCard title="Sesi fokus" value={sessions} hint="Sesi tersimpan" icon={<Target/>} tone="orange"/></div><div className="dashboard-grid progress-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">PENYELESAIAN</p><h2>Ringkasan tugas</h2></div></div><div className="big-progress"><div className="big-progress-bar"><span style={{ width: `${percent}%` }}/></div><strong>{percent}%</strong></div><p className="muted">{completed} dari {tasks.length} tugas sudah selesai.</p></section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">AKTIVITAS</p><h2>Hari ini</h2></div></div><div className="activity-summary"><span className="summary-number">{activityCount}</span><p>aktivitas tercatat hari ini</p></div><div className="activity-bars">{Array.from({ length: 7 }, (_, index) => <div key={index}><span style={{ height: `${20 + ((index * 13 + activities.length * 17) % 75)}%` }}/><small>{['S', 'S', 'R', 'K', 'J', 'S', 'M'][index]}</small></div>)}</div></section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">MATA PELAJARAN</p><h2>Tugas per mata pelajaran</h2></div></div>{subjects.length ? <div className="subject-progress-list">{subjects.map((subject) => { const subjectTasks = tasks.filter((task) => task.subject === subject.name); const done = subjectTasks.filter((task) => task.done).length; return <div key={subject.id}><div><span>{subject.name}</span><span>{done}/{subjectTasks.length}</span></div><div className="big-progress-bar"><span style={{ width: `${subjectTasks.length ? done / subjectTasks.length * 100 : 0}%`, background: subject.color || undefined }}/></div></div> })}</div> : <EmptyState text="Tambahkan mata pelajaran untuk melihat statistiknya."/>}</section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">DURASI BELAJAR</p><h2>Fokus bertahap</h2></div></div><div className="activity-summary"><span className="summary-number">{sessions * 25}</span><p>menit fokus (perkiraan)</p></div><p className="muted">Durasi dihitung dari {sessions} sesi fokus yang selesai.</p></section></div></>
}

function SettingsPage({ settings, setSettings, onReset }) {
  const defaults = { name: '', theme: 'system', focusMinutes: 25, shortBreak: 5, longBreak: 15 }
  return <><div className="welcome-row"><div><p className="eyebrow">STUDYFLOW / PREFERENSI</p><h1>Pengaturan</h1><p className="muted">Sesuaikan ruang belajar agar terasa milikmu.</p></div></div><div className="settings-layout"><section className="panel settings-panel"><h2>Profil pengguna</h2><label className="field-label">Nama pengguna<input className="form-control" value={settings.name} placeholder="Masukkan namamu" onChange={(event) => setSettings({ ...settings, name: event.target.value })}/></label><h2>Tampilan</h2><label className="field-label">Tema<select className="form-control" value={settings.theme} onChange={(event) => setSettings({ ...settings, theme: event.target.value })}><option value="light">Terang</option><option value="dark">Gelap</option><option value="system">Sistem</option></select></label><h2>Timer fokus</h2><div className="settings-duration"><label className="field-label">Fokus (menit)<input className="form-control" type="number" min="1" max="90" value={settings.focusMinutes} onChange={(event) => setSettings({ ...settings, focusMinutes: Math.max(1, Number(event.target.value)) })}/></label><label className="field-label">Istirahat pendek<input className="form-control" type="number" min="1" max="30" value={settings.shortBreak} onChange={(event) => setSettings({ ...settings, shortBreak: Math.max(1, Number(event.target.value)) })}/></label><label className="field-label">Istirahat panjang<input className="form-control" type="number" min="1" max="60" value={settings.longBreak} onChange={(event) => setSettings({ ...settings, longBreak: Math.max(1, Number(event.target.value)) })}/></label></div><h2>Data aplikasi</h2><p className="muted">Seluruh data disimpan di browser ini menggunakan LocalStorage.</p><div className="settings-buttons"><button className="secondary-button" onClick={() => setSettings(defaults)}>Kembalikan pengaturan default</button><button className="danger-button" onClick={onReset}><Trash2 size={17}/>Hapus semua data</button></div></section><aside className="panel settings-tip"><span className="focus-side-icon"><Sparkles size={20}/></span><h2>Data tetap milikmu</h2><p>Pengaturan dan catatan tersimpan di browser yang sedang kamu gunakan. Menghapus data tidak dapat dibatalkan.</p></aside></div></>
}

function ItemModal({ modal, subjects, onClose, onSave }) {
  const { page, item } = modal
  const isSubject = page === 'Mata Pelajaran'
  const isTask = page === 'Tugas'
  const isNote = page === 'Catatan'
  const isCalendar = page === 'Kalender'
  const titleLabel = isSubject ? 'Nama mata pelajaran' : 'Judul'
  function submitForm(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (key) => String(form.get(key) || '').trim()
    if (isSubject) onSave({ name: value('name'), code: value('code'), lecturer: value('lecturer'), color: value('color'), schedule: value('day') ? [{ day: value('day'), start: value('start'), end: value('end'), room: value('room') }] : [] })
    else if (isTask) onSave({ title: value('title'), description: value('description'), subject: value('subject'), deadline: value('deadline'), priority: value('priority'), status: value('status') })
    else if (isNote) onSave({ title: value('title'), description: value('description'), subject: value('subject') })
    else if (isCalendar) onSave({ title: value('title'), description: value('description'), date: value('date'), time: value('time') })
    else onSave({ title: value('title'), description: value('description'), date: value('date'), time: value('time') })
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card"><div className="modal-heading"><div><p className="eyebrow">STUDYFLOW / {page.toUpperCase()}</p><h2>{item ? 'Edit' : 'Tambah'} {isSubject ? 'mata pelajaran' : isTask ? 'tugas' : isNote ? 'catatan' : isCalendar ? 'kegiatan' : 'pengingat'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup"><X size={20}/></button></div><form onSubmit={submitForm} className="modal-form">
    <label className="field-label">{titleLabel}<input className="form-control" name={isSubject ? 'name' : 'title'} defaultValue={item?.name || item?.title || ''} required autoFocus/></label>
    {isSubject ? <><label className="field-label">Kode mata pelajaran<input className="form-control" name="code" defaultValue={item?.code || ''} placeholder="Contoh: IF101"/></label><label className="field-label">Nama dosen<input className="form-control" name="lecturer" defaultValue={item?.lecturer || ''}/></label><label className="field-label">Warna<input className="form-control color-input" type="color" name="color" defaultValue={item?.color || '#8170e8'}/></label><div className="form-two"><label className="field-label">Hari<select name="day" className="form-control" defaultValue={item?.schedule?.[0]?.day || ''}><option value="">Pilih hari</option>{['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map((day)=><option key={day}>{day}</option>)}</select></label><label className="field-label">Ruang<input className="form-control" name="room" defaultValue={item?.schedule?.[0]?.room || ''}/></label></div><div className="form-two"><label className="field-label">Mulai<input className="form-control" type="time" name="start" defaultValue={item?.schedule?.[0]?.start || ''}/></label><label className="field-label">Selesai<input className="form-control" type="time" name="end" defaultValue={item?.schedule?.[0]?.end || ''}/></label></div></> : <>
      {(isTask || isNote || isCalendar || page === 'Pengingat') && <label className="field-label">{isNote || isTask ? 'Deskripsi' : 'Keterangan'}<textarea className="form-control textarea-control" name="description" rows="3" defaultValue={item?.description || ''}/></label>}
      {(isTask || isNote) && <label className="field-label">Mata pelajaran<select name="subject" className="form-control" defaultValue={item?.subject || ''}><option value="">Tanpa mata pelajaran</option>{subjects.map((subject)=><option key={subject.id}>{subject.name}</option>)}</select></label>}
      {(isTask || isCalendar || page === 'Pengingat') && <div className="form-two"><label className="field-label">Tanggal<input className="form-control" type="date" name={isTask ? 'deadline' : 'date'} defaultValue={item?.deadline || item?.date || today()} required/></label><label className="field-label">Jam<input className="form-control" type="time" name="time" defaultValue={item?.time || ''}/></label></div>}
      {isTask && <div className="form-two"><label className="field-label">Prioritas<select name="priority" className="form-control" defaultValue={item?.priority || 'Sedang'}>{['Rendah','Sedang','Tinggi'].map((value)=><option key={value}>{value}</option>)}</select></label><label className="field-label">Status<select name="status" className="form-control" defaultValue={item?.status || (item?.done ? 'Selesai' : 'Belum dikerjakan')}>{['Belum dikerjakan','Sedang dikerjakan','Selesai'].map((value)=><option key={value}>{value}</option>)}</select></label></div>}
    </>}
    <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Batal</button><button className="primary-button" type="submit">{item ? 'Simpan perubahan' : 'Simpan'}</button></div></form></section></div>
}

export default App


