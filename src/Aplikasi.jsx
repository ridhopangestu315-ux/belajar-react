import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CalendarDays, CheckCircle2, ChevronRight, Menu, X, Moon, Sun } from 'lucide-react'
import BilahSamping from './komponen/BilahSamping.jsx'
import Dasbor from './halaman/Dasbor.jsx'
import { HalamanFokus } from './halaman/HalamanFokus.jsx'
import { HalamanProgres } from './halaman/HalamanProgres.jsx'
import { HalamanPengaturan } from './halaman/HalamanPengaturan.jsx'
import { FormulirData } from './komponen/FormulirData.jsx'
import NavigasiMobile from './komponen/NavigasiMobile.jsx'
import AvatarProfil from './komponen/AvatarProfil.jsx'
import ModalFotoProfil from './komponen/ModalFotoProfil.jsx'
import { HalamanKalender, HalamanData } from './halaman/HalamanPerencanaan.jsx'
import { usePenyimpananLokal } from './kait/usePenyimpananLokal.js'
import { tambahHariLokal, ubahKeKunciTanggalLokal } from './fungsi-bantuan/tanggal.js'

const tanggalHariIni = () => ubahKeKunciTanggalLokal()
const tanggalSetelah = (days) => ubahKeKunciTanggalLokal(tambahHariLokal(new Date(), days))
const buatId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`
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
  { id:'sample-task-1', title:'Mengerjakan latihan matematika', description:'Selesaikan latihan pecahan dan periksa kembali jawaban.', subject:sampleSubjects[0].name, deadline:tanggalSetelah(1), priority:'Tinggi', status:'Belum dikerjakan', done:false },
  { id:'sample-task-2', title:'Membuat rangkuman IPA', description:'Catat pokok materi dan istilah penting dengan bahasamu sendiri.', subject:sampleSubjects[3].name, deadline:tanggalSetelah(3), priority:'Sedang', status:'Sedang dikerjakan', done:false },
  { id:'sample-task-3', title:'Membaca materi Bahasa Indonesia', description:'Baca satu bab dan tulis hal penting yang kamu pelajari.', subject:sampleSubjects[1].name, deadline:tanggalSetelah(5), priority:'Rendah', status:'Selesai', done:true },
  { id:'sample-task-4', title:'Belajar untuk ujian Bahasa Inggris', description:'Ulangi kosakata dan kerjakan soal latihan.', subject:sampleSubjects[2].name, deadline:tanggalSetelah(6), priority:'Sedang', status:'Belum dikerjakan', done:false },
]
const sampleActivities = [{ id:'sample-activity-1', text:'Menambahkan rencana belajar minggu ini', date:tanggalHariIni() }, { id:'sample-activity-2', text:'Membaca materi Bahasa Indonesia', date:tanggalHariIni() }]
const sampleNotes = [{ id:'sample-note-1', title:'Catatan belajar minggu ini', description:'Tuliskan hal penting yang sudah dipelajari dan pertanyaan yang ingin dibahas.', subject:sampleSubjects[1].name, createdAt:tanggalHariIni() }]
const sampleReminders = [{ id:'sample-reminder-1', title:'Belajar untuk ujian', description:'Siapkan materi dan latihan yang ingin diulang.', date:tanggalSetelah(2), time:'16:00', done:false }]

function migrasikanDataBelajar() {
  try {
    if (localStorage.getItem('studyflow_universal_v1')) return
    const uraiDaftar = (key) => {
      try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : [] } catch { return [] }
    }
    const currentSubjects = uraiDaftar('studyflow_subjects')
    const oldCourses = uraiDaftar('studyflow_courses')
    const rapikanJadwal = (schedule, fallbackRoom = '') => {
      if (Array.isArray(schedule)) return schedule.map((slot) => ({ ...slot, room: slot.room || fallbackRoom || '' }))
      if (typeof schedule !== 'string' || !schedule.trim()) return []
      const match = schedule.match(/(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s*(\d{1,2}:\d{2})\s*(?:-|\u2013)\s*(\d{1,2}:\d{2})/i)
      return match ? [{ day: match[1], start: match[2], end: match[3], room: fallbackRoom }] : []
    }
    const rapikanMataPelajaran = (subject) => {
      const data = { ...subject }
      const lecturer = data.lecturer
      const room = data.room
      delete data.lecturer
      delete data.credits
      delete data.room
      delete data.field
      const legacyColors = { terra:'#D5735B', sage:'#4D7260', amber:'#D49A43', teal:'#4D8A83' }
      return { ...data, teacher: data.teacher || lecturer || '', category: data.category || data.field || 'Umum', level: data.level || '', description: data.description || '', code: data.code || '', color: data.color?.startsWith('#') ? data.color : legacyColors[data.color] || '#D5735B', schedule: rapikanJadwal(data.schedule, room) }
    }
    const subjects = [...currentSubjects, ...oldCourses].map(rapikanMataPelajaran)
    const uniqueSubjects = subjects.filter((subject, index, list) => list.findIndex((item) => (item.id && item.id === subject.id) || item.name?.toLowerCase() === subject.name?.toLowerCase()) === index)
    const existingTasks = uraiDaftar('studyflow_tasks')
    const existingNotes = uraiDaftar('studyflow_notes')
    const existingReminders = uraiDaftar('studyflow_reminders')
    const existingActivities = uraiDaftar('studyflow_activities')
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
    localStorage.hapusData('studyflow_courses')

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
      try { localStorage.setItem('studyflow_settings', JSON.stringify({ educationLevel:'', classLevel:'', institution:'', ...JSON.parse(settings) })) } catch { /* Biarkan pengait memakai nilai awal jika data pengaturan rusak. */ }
    }
    localStorage.setItem('studyflow_universal_v1', 'true')
  } catch { /* Jika penyimpanan tidak tersedia, aplikasi tetap memakai nilai di memori. */ }
}

migrasikanDataBelajar()

function Aplikasi() {
  const [halamanAktif, aturHalamanAktif] = useState('Dashboard')
  const [apakahBilahSampingTerbuka, aturBilahSamping] = useState(false)
  const [tasks, setTasks] = usePenyimpananLokal('studyflow_tasks', sampleTasks)
  const [subjects, setSubjects] = usePenyimpananLokal('studyflow_subjects', sampleSubjects)
  const [notes, setNotes] = usePenyimpananLokal('studyflow_notes', sampleNotes)
  const [reminders, setReminders] = usePenyimpananLokal('studyflow_reminders', sampleReminders)
  const [activities, setActivities] = usePenyimpananLokal('studyflow_activities', sampleActivities)
  const [settings, setSettings] = usePenyimpananLokal('studyflow_settings', { name: '', educationLevel: '', classLevel: '', institution: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [taskFilter, setTaskFilter] = useState('Semua tugas')
  const [subjectFilter, setSubjectFilter] = useState('Semua bidang')
  const [selisihBulan, setMonthOffset] = useState(0)
  const [modeTimer, setTimerMode] = usePenyimpananLokal('studyflow_timer_mode', 'Fokus')
  const [sisaDetik, setSecondsLeft] = usePenyimpananLokal('studyflow_timer_seconds', (settings.focusMinutes || 25) * 60)
  const [durasiTimerDetik, setTimerDurationSeconds] = usePenyimpananLokal('studyflow_timer_duration_seconds', (settings.focusMinutes || 25) * 60)
  const [timerBerjalan, setTimerRunning] = usePenyimpananLokal('studyflow_timer_running', false)
  const [jumlahSesiFokus, setFocusSessions] = usePenyimpananLokal('studyflow_focus_sessions', 0)
  const [riwayatFokus, setFocusHistory] = usePenyimpananLokal('studyflow_focus_history', [])
  const [pemberitahuanTimer, setTimerNotice] = useState('')
  const [toast, setToast] = useState('')
  const [modalProfilTerbuka, aturModalProfil] = useState(false)
  const [tanggalSaatIni, setCurrentDate] = useState(() => new Date())
  const statistikSudahDianimasikan = useRef(false)
  const penyelesaianTimerSudahDitangani = useRef(false)

  const jumlahTugasSelesai = tasks.filter((task) => task.done).length
  const jumlahTugasAktif = tasks.length - jumlahTugasSelesai
  const progress = tasks.length ? Math.round((jumlahTugasSelesai / tasks.length) * 100) : 0
  const daftarTugasTerurut = useMemo(() => [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.deadline || '9999').localeCompare(b.deadline || '9999')), [tasks])

  useEffect(() => {
    if (halamanAktif === 'Dashboard') statistikSudahDianimasikan.current = true
  }, [halamanAktif])

  useEffect(() => {
    const clockId = window.setInterval(() => setCurrentDate(new Date()), 60_000)
    return () => window.clearInterval(clockId)
  }, [])

  useEffect(() => {
    const terapkanTema = () => {
      const theme = settings.theme || 'system'
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    }
    terapkanTema()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', terapkanTema)
    return () => media.removeEventListener('change', terapkanTema)
  }, [settings.theme])

  // Timer disimpan di state utama agar tidak diatur ulang saat berpindah halaman.
  useEffect(() => {
    if (!timerBerjalan) return undefined
    if (sisaDetik <= 0) {
      setTimerRunning(false)
      if (!penyelesaianTimerSudahDitangani.current) {
        penyelesaianTimerSudahDitangani.current = true
        const completedAt = new Date()
        const record = { id: buatId(), completedAt: completedAt.toISOString(), completedDate: ubahKeKunciTanggalLokal(completedAt), durationSeconds: durasiTimerDetik, type: modeTimer }
        setFocusHistory((history) => [record, ...history])
        if (modeTimer === 'Fokus') setFocusSessions((count) => count + 1)
        window.dispatchEvent(new CustomEvent('studyflow:timer-done', { detail: modeTimer }))
      }
      return undefined
    }
    const timerId = window.setTimeout(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timerId)
  }, [timerBerjalan, sisaDetik, modeTimer, durasiTimerDetik, setFocusHistory, setFocusSessions, setSecondsLeft, setTimerRunning])

  useEffect(() => {
    function tampilkanPemberitahuanTimer(event) {
      setTimerNotice(`${event.detail} selesai. Saatnya ${event.detail === 'Fokus' ? 'istirahat sejenak' : 'kembali belajar'}!`)
      window.setTimeout(() => setTimerNotice(''), 5000)
    }
    window.addEventListener('studyflow:timer-done', tampilkanPemberitahuanTimer)
    return () => window.removeEventListener('studyflow:timer-done', tampilkanPemberitahuanTimer)
  }, [])

  function bukaFormulirTambah(page = halamanAktif, item = null) {
    setModal({ page, item })
  }

  function simpanData(formData) {
    const { page, item } = modal
    const id = item?.id || buatId()
    const addActivity = (text) => setActivities((list) => [{ id: buatId(), text, date: tanggalHariIni() }, ...list].slice(0, 12))
    if (page === 'Tugas') {
      const taskData = { ...formData, done: formData.status === 'Selesai' }
      setTasks((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...taskData } : entry) : [...list, { ...taskData, id }])
      if (!item) addActivity(`Menambahkan tugas ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“${formData.title}ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`)
    } else if (page === 'Mata Pelajaran') {
      const subjectData = { ...formData, teacher: formData.teacher || '', category: formData.category || 'Umum', level: formData.level || '', description: formData.description || '', code: formData.code || '' }
      setSubjects((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...subjectData } : entry) : [...list, { ...subjectData, id }])
    }
    else if (page === 'Catatan') setNotes((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...formData } : entry) : [...list, { ...formData, id, createdAt: tanggalHariIni() }])
    else if (page === 'Pengingat') setReminders((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...formData } : entry) : [...list, { ...formData, id, done: false }])
    else if (page === 'Kalender') setActivities((list) => [{ ...formData, id, date: formData.date || tanggalHariIni(), type: 'Kegiatan' }, ...list])
    setModal(null)
    tampilkanNotifikasi(`${item ? 'Perubahan' : 'Data'} berhasil disimpan.`)
  }

  function tampilkanNotifikasi(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function hapusData(page, id) {
    if (!window.confirm('Hapus item ini? Data terkait yang sudah tersimpan akan tetap ada.')) return
    const setter = { Tugas: setTasks, 'Mata Pelajaran': setSubjects, Catatan: setNotes, Pengingat: setReminders }[page]
    if (setter) setter((list) => list.filter((item) => item.id !== id))
  }

  function ubahStatusTugas(id) {
    const task = tasks.find((entry) => entry.id === id)
    setTasks((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done, status: entry.done ? 'Belum dikerjakan' : 'Selesai' } : entry))
    if (task && !task.done) tampilkanNotifikasi('Tugas selesai. Kerja bagus!')
  }

  function ubahModeTimer(mode) {
    penyelesaianTimerSudahDitangani.current = false
    setTimerMode(mode)
    const minutes = mode === 'Fokus' ? settings.focusMinutes : mode === 'Istirahat panjang' ? settings.longBreak : settings.shortBreak
    setSecondsLeft(minutes * 60)
    setTimerDurationSeconds(minutes * 60)
    setTimerRunning(false)
  }

  function mulaiTimerFokus() {
    penyelesaianTimerSudahDitangani.current = false
    if (sisaDetik === 0) ubahModeTimer(modeTimer)
    setTimerRunning(true)
  }

  function mulaiFokusDariDasbor() {
    penyelesaianTimerSudahDitangani.current = false
    const focusDuration = settings.focusMinutes * 60
    setTimerMode('Fokus')
    setTimerDurationSeconds(focusDuration)
    setSecondsLeft(focusDuration)
    setTimerRunning(true)
  }

  function aturUlangDataAplikasi() {
    if (!window.confirm('Hapus semua data StudyFlow dari browser ini?')) return
    setTasks([]); setSubjects([]); setNotes([]); setReminders([]); setActivities([]); setFocusSessions(0); setFocusHistory([]); setTimerRunning(false); setTimerMode('Fokus'); setSecondsLeft(25 * 60); setTimerDurationSeconds(25 * 60); setSettings({ name: '', educationLevel: '', classLevel: '', institution: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  }

  return <div className="app-shell">
    <BilahSamping halamanAktif={halamanAktif} onNavigate={aturHalamanAktif} isOpen={apakahBilahSampingTerbuka} onClose={() => aturBilahSamping(false)} userName={settings.name} userPhoto={settings.profilePhoto} onProfileClick={() => aturModalProfil(true)} userSummary={[settings.educationLevel, settings.classLevel, settings.institution].filter(Boolean).join(' ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ') || 'Ruang belajarmu'} />
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Buka navigasi" onClick={() => aturBilahSamping(true)}><Menu size={21}/></button><div className="mobile-brand"><span className="brand-mark">S</span><strong>StudyFlow</strong></div><div className="breadcrumb">Ruang belajar <ChevronRight size={15}/> <strong>{halamanAktif}</strong></div><div className="topbar-actions"><span className="tanggalHariIni-pill"><CalendarDays size={16}/>{new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span><button className="icon-button theme-toggle" aria-label="Ganti tema" title="Ganti tema" onClick={() => setSettings((value) => ({ ...value, theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' }))}>{document.documentElement.dataset.theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-button notification-button" aria-label="Pengingat" title="Pengingat" onClick={() => aturHalamanAktif('Pengingat')}><Bell size={19}/>{reminders.some((item) => !item.done) && <i/>}</button><AvatarProfil className="avatar-small" name={settings.name} photo={settings.profilePhoto} onClick={() => aturModalProfil(true)}/></div></header>
      <section className="page-content" key={halamanAktif}>
        {halamanAktif === 'Dashboard' && <Dasbor name={settings.name} tasks={daftarTugasTerurut} subjects={subjects} activities={activities} jumlahTugasAktif={jumlahTugasAktif} jumlahTugasSelesai={jumlahTugasSelesai} progress={progress} riwayatFokus={riwayatFokus} now={tanggalSaatIni} onToggleTask={ubahStatusTugas} onAddTask={() => bukaFormulirTambah('Tugas')} onNavigate={aturHalamanAktif} onStartFocus={() => { aturHalamanAktif('Focus Mode'); mulaiFokusDariDasbor() }} animateStats={!statistikSudahDianimasikan.current}/>}
        {pageToData[halamanAktif] && <HalamanData page={halamanAktif} data={({ Tugas: daftarTugasTerurut, 'Mata Pelajaran': subjects, Catatan: notes, Pengingat: [...reminders].sort((a,b) => (a.date || '').localeCompare(b.date || '')) })[halamanAktif]} search={search} setSearch={setSearch} filter={taskFilter} setFilter={setTaskFilter} subjectFilter={subjectFilter} setSubjectFilter={setSubjectFilter} onAdd={() => bukaFormulirTambah()} onEdit={(item) => bukaFormulirTambah(halamanAktif, item)} onDelete={(id) => hapusData(halamanAktif, id)} onToggle={(id) => halamanAktif === 'Tugas' ? ubahStatusTugas(id) : setReminders((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done } : entry))}/>}
        {halamanAktif === 'Kalender' && <HalamanKalender tasks={tasks} subjects={subjects} activities={activities} selisihBulan={selisihBulan} setMonthOffset={setMonthOffset} now={tanggalSaatIni} onAdd={() => bukaFormulirTambah('Kalender')}/>}
        {halamanAktif === 'Focus Mode' && <HalamanFokus mode={modeTimer} seconds={sisaDetik} running={timerBerjalan} sessions={jumlahSesiFokus} history={riwayatFokus} onMode={ubahModeTimer} onRun={mulaiTimerFokus} onPause={() => setTimerRunning(false)} onReset={() => { setTimerRunning(false); ubahModeTimer(modeTimer) }}/ >}
        {halamanAktif === 'Progress Belajar' && <HalamanProgres tasks={tasks} subjects={subjects} sessions={jumlahSesiFokus} riwayatFokus={riwayatFokus} activities={activities} now={tanggalSaatIni}/>}
        {halamanAktif === 'Pengaturan' && <HalamanPengaturan settings={settings} setSettings={setSettings} onReset={aturUlangDataAplikasi}/>}
      </section>
    </main>
    {modal && <FormulirData modal={modal} subjects={subjects} onClose={() => setModal(null)} onSave={simpanData}/>}
    {modalProfilTerbuka && <ModalFotoProfil name={settings.name} photo={settings.profilePhoto || ''} onClose={() => aturModalProfil(false)} onSave={(profilePhoto) => { setSettings((value) => ({ ...value, profilePhoto })); aturModalProfil(false); tampilkanNotifikasi(profilePhoto ? 'Foto profil berhasil diperbarui.' : 'Foto profil dihapus.') }}/>} 
    <NavigasiMobile halamanAktif={halamanAktif} onNavigate={aturHalamanAktif}/>
    {(pemberitahuanTimer || toast) && <div className="timer-notice toast-enter" role="status"><CheckCircle2 size={18}/>{pemberitahuanTimer || toast}<button onClick={() => { setTimerNotice(''); setToast('') }} aria-label="Tutup pemberitahuan"><X size={16}/></button></div>}
  </div>
}

export default Aplikasi


