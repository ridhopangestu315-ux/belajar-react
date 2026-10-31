import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock3, Menu, Plus, Search, Sparkles, Target, Trash2, TrendingUp, X } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'

const today = () => new Date().toISOString().slice(0, 10)
const dateAfter = (days) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10) }
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`
const pageToData = { 'Mata Pelajaran': 'subjects', Tugas: 'tasks', Catatan: 'notes', Pengingat: 'reminders' }
const todayWeekday = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date())
const sampleSubjects = [
  { id:'sample-subject-1', name:'Matematika', category:'Eksakta', teacher:'', level:'', description:'', code:'', color:'#D5735B', schedule:[{ day:todayWeekday, start:'16:00', end:'16:45', room:'' }] },
  { id:'sample-subject-2', name:'Bahasa Indonesia', category:'Bahasa', teacher:'', level:'', description:'', code:'', color:'#4D7260', schedule:[] },
  { id:'sample-subject-3', name:'Bahasa Inggris', category:'Bahasa', teacher:'', level:'', description:'', code:'', color:'#D49A43', schedule:[] },
  { id:'sample-subject-4', name:'IPA', category:'Sains', teacher:'', level:'', description:'', code:'', color:'#5476A8', schedule:[] },
  { id:'sample-subject-5', name:'IPS', category:'Sosial', teacher:'', level:'', description:'', code:'', color:'#8A6B9A', schedule:[] },
  { id:'sample-subject-6', name:'Informatika', category:'Teknologi', teacher:'', level:'', description:'', code:'', color:'#D49A43', schedule:[] },
  { id:'sample-subject-7', name:'Sejarah', category:'Humaniora', teacher:'', level:'', description:'', code:'', color:'#4D7260', schedule:[] },
]
const sampleTasks = [
  { id:'sample-task-1', title:'Mengerjakan latihan matematika', description:'Selesaikan latihan pecahan dan periksa kembali jawaban.', subject:sampleSubjects[0].name, deadline:dateAfter(1), priority:'Tinggi', status:'Belum dikerjakan', done:false },
  { id:'sample-task-2', title:'Membuat rangkuman IPA', description:'Catat pokok materi dan istilah penting dengan bahasamu sendiri.', subject:sampleSubjects[3].name, deadline:dateAfter(3), priority:'Sedang', status:'Sedang dikerjakan', done:false },
  { id:'sample-task-3', title:'Membaca materi Bahasa Indonesia', description:'Baca satu bab dan tulis hal penting yang kamu pelajari.', subject:sampleSubjects[1].name, deadline:dateAfter(5), priority:'Rendah', status:'Selesai', done:true },
  { id:'sample-task-4', title:'Belajar untuk ujian Bahasa Inggris', description:'Ulangi kosakata dan kerjakan soal latihan.', subject:sampleSubjects[2].name, deadline:dateAfter(6), priority:'Sedang', status:'Belum dikerjakan', done:false },
]
const sampleActivities = [{ id:'sample-activity-1', text:'Menambahkan rencana belajar minggu ini', date:today() }, { id:'sample-activity-2', text:'Membaca materi Bahasa Indonesia', date:today() }]
const sampleNotes = [{ id:'sample-note-1', title:'Catatan belajar minggu ini', description:'Tuliskan hal penting yang sudah dipelajari dan pertanyaan yang ingin dibahas.', subject:sampleSubjects[1].name, createdAt:today() }]
const sampleReminders = [{ id:'sample-reminder-1', title:'Belajar untuk ujian', description:'Siapkan materi dan latihan yang ingin diulang.', date:dateAfter(2), time:'16:00', done:false }]

function migrasikanDataBelajar() {
  try {
    if (localStorage.getItem('studyflow_universal_v1')) return
    const parseArray = (key) => {
      try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : [] } catch { return [] }
    }
    const currentSubjects = parseArray('studyflow_subjects')
    const oldCourses = parseArray('studyflow_courses')
    const normalizeSchedule = (schedule, fallbackRoom = '') => {
      if (Array.isArray(schedule)) return schedule.map((slot) => ({ ...slot, room: slot.room || fallbackRoom || '' }))
      if (typeof schedule !== 'string' || !schedule.trim()) return []
      const match = schedule.match(/(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s*(\d{1,2}:\d{2})\s*(?:-|\u2013)\s*(\d{1,2}:\d{2})/i)
      return match ? [{ day: match[1], start: match[2], end: match[3], room: fallbackRoom }] : []
    }
    const normalizeSubject = (subject) => {
      const data = { ...subject }
      const lecturer = data.lecturer
      const room = data.room
      delete data.lecturer
      delete data.credits
      delete data.room
      delete data.field
      const legacyColors = { terra:'#D5735B', sage:'#4D7260', amber:'#D49A43', teal:'#4D8A83' }
      return { ...data, teacher: data.teacher || lecturer || '', category: data.category || data.field || 'Umum', level: data.level || '', description: data.description || '', code: data.code || '', color: data.color?.startsWith('#') ? data.color : legacyColors[data.color] || '#D5735B', schedule: normalizeSchedule(data.schedule, room) }
    }
    const subjects = [...currentSubjects, ...oldCourses].map(normalizeSubject)
    const uniqueSubjects = subjects.filter((subject, index, list) => list.findIndex((item) => (item.id && item.id === subject.id) || item.name?.toLowerCase() === subject.name?.toLowerCase()) === index)
    const existingTasks = parseArray('studyflow_tasks')
    const existingNotes = parseArray('studyflow_notes')
    const existingReminders = parseArray('studyflow_reminders')
    const existingActivities = parseArray('studyflow_activities')
    const hasLearningData = uniqueSubjects.length + existingTasks.length + existingNotes.length + existingReminders.length + existingActivities.length > 0
    if (!hasLearningData) {
      localStorage.setItem('studyflow_subjects', JSON.stringify(sampleSubjects))
      localStorage.setItem('studyflow_tasks', JSON.stringify(sampleTasks))
      localStorage.setItem('studyflow_notes', JSON.stringify(sampleNotes))
      localStorage.setItem('studyflow_reminders', JSON.stringify(sampleReminders))
      localStorage.setItem('studyflow_activities', JSON.stringify(sampleActivities))
    } else if (uniqueSubjects.length) {
      localStorage.setItem('studyflow_subjects', JSON.stringify(uniqueSubjects))
    }
    localStorage.removeItem('studyflow_courses')

    const normalizedTasks = existingTasks.map((task) => {
      const linkedSubject = uniqueSubjects.find((subject) => subject.id === task.courseId || subject.name === task.courseName)
      const data = { ...task }
      const courseName = data.courseName
      const dueDate = data.dueDate
      const dueTime = data.dueTime
      const description = data.description || data.desc || ''
      const completed = data.completed
      ;['courseId', 'courseName', 'dueDate', 'dueTime', 'desc', 'completed'].forEach((key) => delete data[key])
      const done = task.done ?? completed ?? false
      return { ...data, subject: task.subject || courseName || linkedSubject?.name || '', deadline: task.deadline || dueDate || '', time: task.time || dueTime || '', description, done, status: task.status || (done ? 'Selesai' : 'Belum dikerjakan') }
    })
    if (hasLearningData && existingTasks.length) localStorage.setItem('studyflow_tasks', JSON.stringify(normalizedTasks))
    const settings = localStorage.getItem('studyflow_settings')
    if (settings) {
      try { localStorage.setItem('studyflow_settings', JSON.stringify({ educationLevel:'', classLevel:'', institution:'', ...JSON.parse(settings) })) } catch { /* Keep malformed settings for the safe hook fallback. */ }
    }
    localStorage.setItem('studyflow_universal_v1', 'true')
  } catch { /* Storage may be unavailable in private browsing; the app still uses in-memory defaults. */ }
}

migrasikanDataBelajar()

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [tasks, setTasks] = useLocalStorage('studyflow_tasks', sampleTasks)
  const [subjects, setSubjects] = useLocalStorage('studyflow_subjects', sampleSubjects)
  const [notes, setNotes] = useLocalStorage('studyflow_notes', sampleNotes)
  const [reminders, setReminders] = useLocalStorage('studyflow_reminders', sampleReminders)
  const [activities, setActivities] = useLocalStorage('studyflow_activities', sampleActivities)
  const [settings, setSettings] = useLocalStorage('studyflow_settings', { name: '', educationLevel: '', classLevel: '', institution: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [taskFilter, setTaskFilter] = useState('Semua tugas')
  const [subjectFilter, setSubjectFilter] = useState('Semua bidang')
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
    } else if (page === 'Mata Pelajaran') {
      const subjectData = { ...formData, teacher: formData.teacher || '', category: formData.category || 'Umum', level: formData.level || '', description: formData.description || '', code: formData.code || '' }
      setSubjects((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...subjectData } : entry) : [...list, { ...subjectData, id }])
    }
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
    setTasks([]); setSubjects([]); setNotes([]); setReminders([]); setActivities([]); setFocusSessions(0); setSettings({ name: '', educationLevel: '', classLevel: '', institution: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  }

  return <div className="app-shell">
    <Sidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} userName={settings.name} userSummary={[settings.educationLevel, settings.classLevel, settings.institution].filter(Boolean).join(' · ') || 'Ruang belajarmu'} />
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Buka navigasi" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button><div className="breadcrumb">Ruang belajar <ChevronRight size={15}/> <strong>{activePage}</strong></div><div className="topbar-actions"><span className="today-pill"><CalendarDays size={16}/>{new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span><button className="icon-button notification-button" aria-label="Pengingat" onClick={() => setActivePage('Pengingat')}><Bell size={19}/>{reminders.some((item) => !item.done) && <i/>}</button><div className="avatar avatar-small">{(settings.name || 'S').slice(0, 1).toUpperCase()}</div></div></header>
      <section className="page-content" key={activePage}>
        {activePage === 'Dashboard' && <Dashboard name={settings.name} tasks={sortedTasks} subjects={subjects} activities={activities} totalTasks={tasks.length} openTasks={openTasks} completedTasks={completedTasks} progress={progress} onToggleTask={toggleTask} onAddTask={() => openCreateForm('Tugas')} onNavigate={setActivePage} animateStats={!hasAnimatedStats.current}/>}
        {pageToData[activePage] && <DataPage page={activePage} data={({ Tugas: sortedTasks, 'Mata Pelajaran': subjects, Catatan: notes, Pengingat: [...reminders].sort((a,b) => (a.date || '').localeCompare(b.date || '')) })[activePage]} search={search} setSearch={setSearch} filter={taskFilter} setFilter={setTaskFilter} subjectFilter={subjectFilter} setSubjectFilter={setSubjectFilter} onAdd={() => openCreateForm()} onEdit={(item) => openCreateForm(activePage, item)} onDelete={(id) => removeItem(activePage, id)} onToggle={(id) => activePage === 'Tugas' ? toggleTask(id) : setReminders((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done } : entry))}/>}
        {activePage === 'Kalender' && <CalendarPage tasks={tasks} subjects={subjects} activities={activities} monthOffset={monthOffset} setMonthOffset={setMonthOffset} onAdd={() => openCreateForm('Kalender')}/>}
        {activePage === 'Focus Mode' && <FocusPage mode={timerMode} seconds={secondsLeft} running={timerRunning} sessions={focusSessions} onMode={updateTimerMode} onRun={startFocusTimer} onPause={() => setTimerRunning(false)} onReset={() => { setTimerRunning(false); updateTimerMode(timerMode) }}/ >}
        {activePage === 'Progress Belajar' && <ProgressPage tasks={tasks} subjects={subjects} sessions={focusSessions} focusMinutes={settings.focusMinutes} activities={activities}/>}
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
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">JADWAL</p><h2>Jadwal belajar hari ini</h2></div><button className="text-button" onClick={() => onNavigate('Mata Pelajaran')}>Lihat jadwal <ChevronRight size={16}/></button></div>{todayClasses.length ? <div className="class-list">{todayClasses.map((slot, index) => <div className="class-row" key={`${slot.subject.id}-${index}`}><span className="class-time">{slot.start || '—'}</span><span className="class-bar" style={{ background: slot.subject.color || '#D5735B' }}/><div><strong>{slot.subject.name}</strong><span>{slot.subject.code ? `Kode ${slot.subject.code}` : (slot.subject.category || 'Mata pelajaran')} · {slot.room || 'Lokasi belajar'}</span></div></div>)}</div> : <EmptyState text="Belum ada jadwal belajar hari ini. Atur waktu belajar pada mata pelajaranmu." actionLabel="Lihat mata pelajaran" onAction={() => onNavigate('Mata Pelajaran')}/>}</section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">AKTIVITAS BELAJAR</p><h2>Aktivitas terbaru</h2></div><TrendingUp size={19} className="subtle-icon" aria-label="Tren aktivitas"/></div>{activities.length ? <div className="activity-list">{activities.slice(0, 4).map((item, index) => <div className="activity-row activity-enter" style={{ '--item-index': index }} key={item.id}><span className="activity-mark"><Check size={14}/></span><div><strong>{item.text}</strong><span>{item.date}</span></div></div>)}</div> : <EmptyState text="Aktivitas belajar akan muncul di sini setelah kamu menambahkan tugas atau catatan."/>}</section></div>
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

function DataPage({ page, data, search, setSearch, filter, setFilter, subjectFilter, setSubjectFilter, onAdd, onEdit, onDelete, onToggle }) {
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

function CalendarPage({ tasks, subjects, activities, monthOffset, setMonthOffset, onAdd }) {
  const [selectedDate, setSelectedDate] = useState(today())
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
  const selectedDay = selectedDate.startsWith(`${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-`) ? Number(selectedDate.slice(-2)) : null
  const selectedEvents = selectedDay ? events(selectedDay) : []
  return <>
    <div className="welcome-row">
      <div><p className="eyebrow">STUDYFLOW / KALENDER</p><h1>Kalender akademik</h1><p className="muted">Lihat deadline dan rencanakan kegiatanmu.</p></div>
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
          const isToday = day && todayMatches && day === new Date().getDate()
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

function FocusPage({ mode, seconds, running, sessions, onMode, onRun, onPause, onReset }) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainingSeconds = String(seconds % 60).padStart(2, '0')
  return <><div className="welcome-row"><div><p className="eyebrow">STUDYFLOW / FOCUS MODE</p><h1>Waktunya fokus</h1><p className="muted">Satu hal dalam satu waktu. Kamu pasti bisa.</p></div></div><div className="focus-layout"><section className="panel focus-panel"><div className="focus-tabs">{['Fokus', 'Istirahat pendek', 'Istirahat panjang'].map((item) => <button key={item} className={mode === item ? 'selected' : ''} onClick={() => onMode(item)}>{item}</button>)}</div><div className={running ? 'timer-circle timer-active' : 'timer-circle'}><span>{mode.toUpperCase()}</span><strong>{minutes}:{remainingSeconds}</strong><small>Tarik napas, dan mulai.</small></div><div className="timer-actions">{running ? <button className="primary-button" onClick={onPause}>Jeda</button> : <button className="primary-button" onClick={onRun}>{seconds === 0 ? 'Mulai lagi' : 'Mulai fokus'}</button>}<button className="secondary-button" onClick={onReset}>Atur ulang</button></div><p className="timer-caption"><Target size={16}/>Sesi fokus selesai <strong>{sessions}</strong></p></section><aside className="panel focus-side"><span className="focus-side-icon"><Sparkles size={21}/></span><h2>Jaga ritmemu</h2><p>Fokus selama satu sesi, lalu ambil jeda sejenak untuk mengisi energi.</p><div className="focus-step"><span>01</span><p><strong>Fokus</strong><small>Belajar tanpa gangguan</small></p><b>25 menit</b></div><div className="focus-step"><span>02</span><p><strong>Istirahat</strong><small>Regangkan tubuhmu</small></p><b>5 menit</b></div><div className="focus-quote">“Kemajuan kecil yang konsisten membawa hasil besar.”</div></aside></div></>
}

function ProgressPage({ tasks, subjects, sessions, focusMinutes, activities }) {
  const completed = tasks.filter((task) => task.done).length
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const activityCount = activities.filter((item) => item.date === today()).length
  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - 6 + index)
    const key = date.toISOString().slice(0, 10)
    return { key, label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date), count: activities.filter((item) => item.date === key).length }
  })
  const maxDailyActivity = Math.max(...weekActivity.map((day) => day.count), 1)
  const activeStudyDays = weekActivity.filter((day) => day.count > 0).length
  return <>
    <div className="welcome-row">
      <div><p className="eyebrow">STUDYFLOW / INSIGHT</p><h1>Progress belajar</h1><p className="muted">Lihat perkembangan dan rayakan kemajuanmu.</p></div>
    </div>
    <div className="stats-grid progress-summary-grid">
      <StatCard title="Total tugas" value={tasks.length} hint="Tercatat" icon={<CheckCircle2 />} tone="purple" />
      <StatCard title="Tugas selesai" value={completed} hint={`${percent}% dari total`} icon={<Check />} tone="green" />
      <StatCard title="Belum selesai" value={tasks.length - completed} hint="Masih bisa dikerjakan" icon={<Clock3 />} tone="blue" />
      <StatCard title="Sesi fokus" value={sessions} hint="Sesi tersimpan" icon={<Target />} tone="orange" />
      <StatCard title="Hari aktif" value={activeStudyDays} hint="Dari 7 hari terakhir" icon={<CalendarDays />} tone="purple" />
    </div>
    <div className="dashboard-grid progress-grid">
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">PENYELESAIAN</p><h2>Ringkasan tugas</h2></div></div>
        <div className="big-progress"><div className="big-progress-bar"><span style={{ width: `${percent}%` }} /></div><strong>{percent}%</strong></div>
        <p className="muted">{completed} dari {tasks.length} tugas sudah selesai.</p>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">AKTIVITAS</p><h2>Hari ini</h2></div></div>
        <div className="activity-summary"><span className="summary-number">{activityCount}</span><p>aktivitas tercatat hari ini</p></div>
        {weekActivity.some((day) => day.count > 0) ? <div className="activity-bars">{weekActivity.map((day) => <div key={day.key} title={`${day.count} aktivitas`}><span style={{ height: `${Math.max(day.count / maxDailyActivity * 100, 8)}%` }} /><small>{day.label}</small></div>)}</div> : <EmptyState text="Aktivitas minggu ini akan muncul setelah kamu belajar." />}
      </section>
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">MATA PELAJARAN</p><h2>Tugas per mata pelajaran</h2></div></div>
        {subjects.length ? <div className="subject-progress-list">{subjects.map((subject) => {
          const subjectTasks = tasks.filter((task) => task.subject === subject.name)
          const done = subjectTasks.filter((task) => task.done).length
          return <div key={subject.id}><div><span>{subject.name}</span><span>{done}/{subjectTasks.length}</span></div><div className="big-progress-bar"><span style={{ width: `${subjectTasks.length ? done / subjectTasks.length * 100 : 0}%`, background: subject.color || undefined }} /></div></div>
        })}</div> : <EmptyState text="Tambahkan mata pelajaran untuk melihat statistiknya." />}
      </section>
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">DURASI BELAJAR</p><h2>Fokus bertahap</h2></div></div>
        <div className="activity-summary"><span className="summary-number">{sessions * focusMinutes}</span><p>menit fokus tercatat</p></div>
        <p className="muted">Durasi dihitung dari {sessions} sesi fokus yang selesai.</p>
      </section>
    </div>
  </>
}

function SettingsPage({ settings, setSettings, onReset }) {
  const defaults = { name:'', educationLevel:'', classLevel:'', institution:'', theme:'light', focusMinutes:25, shortBreak:5, longBreak:15 }
  const educationOptions = ['SMP', 'SMA', 'SMK', 'Perguruan Tinggi', 'Belajar Mandiri', 'Lainnya']
  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }))
  }
  return <>
    <div className="welcome-row"><div><p className="eyebrow">STUDYFLOW / PREFERENSI</p><h1>Pengaturan</h1><p className="muted">Atur profil dan ruang belajar sesuai kebutuhanmu.</p></div></div>
    <div className="settings-layout">
      <section className="panel settings-panel">
        <h2>Profil belajar</h2>
        <label className="field-label">Nama pengguna<input className="form-control" value={settings.name || ''} placeholder="Nama panggilan (opsional)" onChange={(event) => updateSetting('name', event.target.value)} /></label>
        <label className="field-label">Jenjang pendidikan (opsional)<select className="form-control" value={settings.educationLevel || ''} onChange={(event) => updateSetting('educationLevel', event.target.value)}><option value="">Pilih jenjang</option>{educationOptions.map((level) => <option key={level}>{level}</option>)}</select></label>
        <div className="form-two profile-fields"><label className="field-label">Kelas atau tingkat<input className="form-control" value={settings.classLevel || ''} placeholder="Contoh: Kelas 8" onChange={(event) => updateSetting('classLevel', event.target.value)} /></label><label className="field-label">Sekolah atau institusi<input className="form-control" value={settings.institution || ''} placeholder="Opsional" onChange={(event) => updateSetting('institution', event.target.value)} /></label></div>
        <h2>Tampilan</h2>
        <label className="field-label">Tema<select className="form-control" value={settings.theme || 'light'} onChange={(event) => updateSetting('theme', event.target.value)}><option value="light">Terang</option><option value="dark">Gelap</option><option value="system">Sistem</option></select></label>
        <h2>Timer fokus</h2>
        <div className="settings-duration">
          <label className="field-label">Fokus (menit)<input className="form-control" type="number" min="1" max="90" value={settings.focusMinutes} onChange={(event) => updateSetting('focusMinutes', Math.max(1, Number(event.target.value)))} /></label>
          <label className="field-label">Istirahat pendek<input className="form-control" type="number" min="1" max="30" value={settings.shortBreak} onChange={(event) => updateSetting('shortBreak', Math.max(1, Number(event.target.value)))} /></label>
          <label className="field-label">Istirahat panjang<input className="form-control" type="number" min="1" max="60" value={settings.longBreak} onChange={(event) => updateSetting('longBreak', Math.max(1, Number(event.target.value)))} /></label>
        </div>
        <h2>Data aplikasi</h2><p className="muted">Data belajar dan pengaturan tersimpan di browser ini.</p>
        <div className="settings-buttons"><button className="secondary-button" onClick={() => setSettings(defaults)}>Kembalikan pengaturan default</button><button className="danger-button" onClick={onReset}><Trash2 size={17} />Hapus semua data</button></div>
      </section>
      <aside className="panel settings-tip"><span className="focus-side-icon"><Sparkles size={20} /></span><h2>Belajar dengan caramu</h2><p>Informasi jenjang dan institusi bersifat opsional. StudyFlow tetap bisa digunakan untuk belajar mandiri.</p></aside>
    </div>
  </>
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
    if (isSubject) onSave({ name: value('name'), code: value('code'), teacher: value('teacher'), category: value('category'), level: value('level'), description: value('description'), color: value('color'), schedule: value('day') ? [{ day: value('day'), start: value('start'), end: value('end'), room: value('room') }] : [] })
    else if (isTask) onSave({ title: value('title'), description: value('description'), subject: value('subject'), deadline: value('deadline'), priority: value('priority'), status: value('status') })
    else if (isNote) onSave({ title: value('title'), description: value('description'), subject: value('subject') })
    else if (isCalendar) onSave({ title: value('title'), description: value('description'), date: value('date'), time: value('time') })
    else onSave({ title: value('title'), description: value('description'), date: value('date'), time: value('time') })
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card"><div className="modal-heading"><div><p className="eyebrow">STUDYFLOW / {page.toUpperCase()}</p><h2>{item ? 'Edit' : 'Tambah'} {isSubject ? 'mata pelajaran' : isTask ? 'tugas' : isNote ? 'catatan' : isCalendar ? 'kegiatan' : 'pengingat'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup"><X size={20}/></button></div><form onSubmit={submitForm} className="modal-form">
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
      {(isTask || isCalendar || page === 'Pengingat') && <div className="form-two"><label className="field-label">Tanggal<input className="form-control" type="date" name={isTask ? 'deadline' : 'date'} defaultValue={item?.deadline || item?.date || today()} required/></label><label className="field-label">Jam<input className="form-control" type="time" name="time" defaultValue={item?.time || ''}/></label></div>}
      {isTask && <div className="form-two"><label className="field-label">Prioritas<select name="priority" className="form-control" defaultValue={item?.priority || 'Sedang'}>{['Rendah','Sedang','Tinggi'].map((value)=><option key={value}>{value}</option>)}</select></label><label className="field-label">Status<select name="status" className="form-control" defaultValue={item?.status || (item?.done ? 'Selesai' : 'Belum dikerjakan')}>{['Belum dikerjakan','Sedang dikerjakan','Selesai'].map((value)=><option key={value}>{value}</option>)}</select></label></div>}
    </>}
    <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Batal</button><button className="primary-button" type="submit">{item ? 'Simpan perubahan' : 'Simpan'}</button></div></form></section></div>
}

export default App


