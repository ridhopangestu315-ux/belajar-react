import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CalendarDays, CheckCircle2, ChevronRight, Menu, X, Moon, Sun } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { FocusPage } from './pages/FocusPage.jsx'
import { ProgressPage } from './pages/ProgressPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { ItemModal } from './components/ItemModal.jsx'
import MobileNav from './components/MobileNav.jsx'
import { CalendarPage, DataPage } from './pages/PlanningPages.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { addLocalDays, toLocalDateKey } from './utils/date.js'

const today = () => toLocalDateKey()
const dateAfter = (days) => toLocalDateKey(addLocalDays(new Date(), days))
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
  const [timerMode, setTimerMode] = useLocalStorage('studyflow_timer_mode', 'Fokus')
  const [secondsLeft, setSecondsLeft] = useLocalStorage('studyflow_timer_seconds', (settings.focusMinutes || 25) * 60)
  const [timerDurationSeconds, setTimerDurationSeconds] = useLocalStorage('studyflow_timer_duration_seconds', (settings.focusMinutes || 25) * 60)
  const [timerRunning, setTimerRunning] = useLocalStorage('studyflow_timer_running', false)
  const [focusSessions, setFocusSessions] = useLocalStorage('studyflow_focus_sessions', 0)
  const [focusHistory, setFocusHistory] = useLocalStorage('studyflow_focus_history', [])
  const [timerNotice, setTimerNotice] = useState('')
  const [toast, setToast] = useState('')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const hasAnimatedStats = useRef(false)
  const timerCompletionHandled = useRef(false)

  const completedTasks = tasks.filter((task) => task.done).length
  const openTasks = tasks.length - completedTasks
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.deadline || '9999').localeCompare(b.deadline || '9999')), [tasks])

  useEffect(() => {
    if (activePage === 'Dashboard') hasAnimatedStats.current = true
  }, [activePage])

  useEffect(() => {
    const clockId = window.setInterval(() => setCurrentDate(new Date()), 60_000)
    return () => window.clearInterval(clockId)
  }, [])

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
    if (secondsLeft <= 0) {
      setTimerRunning(false)
      if (!timerCompletionHandled.current) {
        timerCompletionHandled.current = true
        const completedAt = new Date()
        const record = { id: createId(), completedAt: completedAt.toISOString(), completedDate: toLocalDateKey(completedAt), durationSeconds: timerDurationSeconds, type: timerMode }
        setFocusHistory((history) => [record, ...history])
        if (timerMode === 'Fokus') setFocusSessions((count) => count + 1)
        window.dispatchEvent(new CustomEvent('studyflow:timer-done', { detail: timerMode }))
      }
      return undefined
    }
    const timerId = window.setTimeout(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timerId)
  }, [timerRunning, secondsLeft, timerMode, timerDurationSeconds, setFocusHistory, setFocusSessions, setSecondsLeft, setTimerRunning])

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
    if (!window.confirm('Hapus item ini? Data terkait yang sudah tersimpan akan tetap ada.')) return
    const setter = { Tugas: setTasks, 'Mata Pelajaran': setSubjects, Catatan: setNotes, Pengingat: setReminders }[page]
    if (setter) setter((list) => list.filter((item) => item.id !== id))
  }

  function toggleTask(id) {
    const task = tasks.find((entry) => entry.id === id)
    setTasks((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done, status: entry.done ? 'Belum dikerjakan' : 'Selesai' } : entry))
    if (task && !task.done) tampilkanNotifikasi('Tugas selesai. Kerja bagus!')
  }

  function updateTimerMode(mode) {
    timerCompletionHandled.current = false
    setTimerMode(mode)
    const minutes = mode === 'Fokus' ? settings.focusMinutes : mode === 'Istirahat panjang' ? settings.longBreak : settings.shortBreak
    setSecondsLeft(minutes * 60)
    setTimerDurationSeconds(minutes * 60)
    setTimerRunning(false)
  }

  function startFocusTimer() {
    timerCompletionHandled.current = false
    if (secondsLeft === 0) updateTimerMode(timerMode)
    setTimerRunning(true)
  }

  function startFocusFromDashboard() {
    timerCompletionHandled.current = false
    const focusDuration = settings.focusMinutes * 60
    setTimerMode('Fokus')
    setTimerDurationSeconds(focusDuration)
    setSecondsLeft(focusDuration)
    setTimerRunning(true)
  }

  function resetAppData() {
    if (!window.confirm('Hapus semua data StudyFlow dari browser ini?')) return
    setTasks([]); setSubjects([]); setNotes([]); setReminders([]); setActivities([]); setFocusSessions(0); setFocusHistory([]); setTimerRunning(false); setTimerMode('Fokus'); setSecondsLeft(25 * 60); setTimerDurationSeconds(25 * 60); setSettings({ name: '', educationLevel: '', classLevel: '', institution: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  }

  return <div className="app-shell">
    <Sidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} userName={settings.name} userSummary={[settings.educationLevel, settings.classLevel, settings.institution].filter(Boolean).join(' · ') || 'Ruang belajarmu'} />
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Buka navigasi" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button><div className="mobile-brand"><span className="brand-mark">S</span><strong>StudyFlow</strong></div><div className="breadcrumb">Ruang belajar <ChevronRight size={15}/> <strong>{activePage}</strong></div><div className="topbar-actions"><button className="icon-button theme-toggle" aria-label="Ganti tema" title="Ganti tema" onClick={() => setSettings((value) => ({ ...value, theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' }))}>{document.documentElement.dataset.theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><span className="today-pill"><CalendarDays size={16}/>{new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span><button className="icon-button notification-button" aria-label="Pengingat" title="Pengingat" onClick={() => setActivePage('Pengingat')}><Bell size={19}/>{reminders.some((item) => !item.done) && <i/>}</button><div className="avatar avatar-small">{(settings.name || 'S').slice(0, 1).toUpperCase()}</div></div></header>
      <section className="page-content" key={activePage}>
        {activePage === 'Dashboard' && <Dashboard name={settings.name} tasks={sortedTasks} subjects={subjects} activities={activities} openTasks={openTasks} completedTasks={completedTasks} progress={progress} focusHistory={focusHistory} now={currentDate} onToggleTask={toggleTask} onAddTask={() => openCreateForm('Tugas')} onNavigate={setActivePage} onStartFocus={() => { setActivePage('Focus Mode'); startFocusFromDashboard() }} animateStats={!hasAnimatedStats.current}/>}
        {pageToData[activePage] && <DataPage page={activePage} data={({ Tugas: sortedTasks, 'Mata Pelajaran': subjects, Catatan: notes, Pengingat: [...reminders].sort((a,b) => (a.date || '').localeCompare(b.date || '')) })[activePage]} search={search} setSearch={setSearch} filter={taskFilter} setFilter={setTaskFilter} subjectFilter={subjectFilter} setSubjectFilter={setSubjectFilter} onAdd={() => openCreateForm()} onEdit={(item) => openCreateForm(activePage, item)} onDelete={(id) => removeItem(activePage, id)} onToggle={(id) => activePage === 'Tugas' ? toggleTask(id) : setReminders((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done } : entry))}/>}
        {activePage === 'Kalender' && <CalendarPage tasks={tasks} subjects={subjects} activities={activities} monthOffset={monthOffset} setMonthOffset={setMonthOffset} now={currentDate} onAdd={() => openCreateForm('Kalender')}/>}
        {activePage === 'Focus Mode' && <FocusPage mode={timerMode} seconds={secondsLeft} running={timerRunning} sessions={focusSessions} history={focusHistory} onMode={updateTimerMode} onRun={startFocusTimer} onPause={() => setTimerRunning(false)} onReset={() => { setTimerRunning(false); updateTimerMode(timerMode) }}/ >}
        {activePage === 'Progress Belajar' && <ProgressPage tasks={tasks} subjects={subjects} sessions={focusSessions} focusHistory={focusHistory} activities={activities} now={currentDate}/>}
        {activePage === 'Pengaturan' && <SettingsPage settings={settings} setSettings={setSettings} onReset={resetAppData}/>}
      </section>
    </main>
    {modal && <ItemModal modal={modal} subjects={subjects} onClose={() => setModal(null)} onSave={saveItem}/>}
    <MobileNav activePage={activePage} onNavigate={setActivePage}/>
    {(timerNotice || toast) && <div className="timer-notice toast-enter" role="status"><CheckCircle2 size={18}/>{timerNotice || toast}<button onClick={() => { setTimerNotice(''); setToast('') }} aria-label="Tutup pemberitahuan"><X size={16}/></button></div>}
  </div>
}

export default App


