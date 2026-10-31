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
    const daftarMataPelajaran = [...currentSubjects, ...oldCourses].map(rapikanMataPelajaran)
    const uniqueSubjects = daftarMataPelajaran.filter((subject, index, list) => list.findIndex((item) => (item.id && item.id === subject.id) || item.name?.toLowerCase() === subject.name?.toLowerCase()) === index)
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
    const pengaturan = localStorage.getItem('studyflow_settings')
    if (pengaturan) {
      try { localStorage.setItem('studyflow_settings', JSON.stringify({ educationLevel:'', classLevel:'', institution:'', ...JSON.parse(pengaturan) })) } catch { /* Biarkan pengait memakai nilai awal jika data pengaturan rusak. */ }
    }
    localStorage.setItem('studyflow_universal_v1', 'true')
  } catch { /* Jika penyimpanan tidak tersedia, aplikasi tetap memakai nilai di memori. */ }
}

migrasikanDataBelajar()

function Aplikasi() {
  const [halamanAktif, aturHalamanAktif] = useState('Dashboard')
  const [apakahBilahSampingTerbuka, aturBilahSamping] = useState(false)
  const [apakahBilahSampingTerlipat, aturBilahSampingTerlipat] = useState(false)
  const [daftarTugas, aturDaftarTugas] = usePenyimpananLokal('studyflow_tasks', sampleTasks)
  const [daftarMataPelajaran, aturDaftarMataPelajaran] = usePenyimpananLokal('studyflow_subjects', sampleSubjects)
  const [daftarCatatan, aturDaftarCatatan] = usePenyimpananLokal('studyflow_notes', sampleNotes)
  const [daftarPengingat, aturDaftarPengingat] = usePenyimpananLokal('studyflow_reminders', sampleReminders)
  const [daftarAktivitas, aturDaftarAktivitas] = usePenyimpananLokal('studyflow_activities', sampleActivities)
  const [pengaturan, aturPengaturan] = usePenyimpananLokal('studyflow_settings', { name: '', educationLevel: '', classLevel: '', institution: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  const [modal, setModal] = useState(null)
  const [kataPencarian, aturKataPencarian] = useState('')
  const [filterTugas, aturFilterTugas] = useState('Semua tugas')
  const [filterMataPelajaran, aturFilterMataPelajaran] = useState('Semua bidang')
  const [selisihBulan, aturSelisihBulan] = useState(0)
  const [modeTimer, aturModeTimer] = usePenyimpananLokal('studyflow_timer_mode', 'Fokus')
  const [sisaDetik, aturSisaDetik] = usePenyimpananLokal('studyflow_timer_seconds', (pengaturan.focusMinutes || 25) * 60)
  const [durasiTimerDetik, aturDurasiTimerDetik] = usePenyimpananLokal('studyflow_timer_duration_seconds', (pengaturan.focusMinutes || 25) * 60)
  const [timerBerjalan, aturTimerBerjalan] = usePenyimpananLokal('studyflow_timer_running', false)
  const [jumlahSesiFokus, aturJumlahSesiFokus] = usePenyimpananLokal('studyflow_focus_sessions', 0)
  const [riwayatFokus, aturRiwayatFokus] = usePenyimpananLokal('studyflow_focus_history', [])
  const [pemberitahuanTimer, aturPemberitahuanTimer] = useState('')
  const [toast, aturNotifikasi] = useState('')
  const [modalProfilTerbuka, aturModalProfil] = useState(false)
  const [tanggalSaatIni, aturTanggalSaatIni] = useState(() => new Date())
  const statistikSudahDianimasikan = useRef(false)
  const penyelesaianTimerSudahDitangani = useRef(false)

  const apakahTemaGelap = pengaturan.theme === 'dark' || (pengaturan.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const jumlahTugasSelesai = daftarTugas.filter((task) => task.done).length
  const jumlahTugasAktif = daftarTugas.length - jumlahTugasSelesai
  const progress = daftarTugas.length ? Math.round((jumlahTugasSelesai / daftarTugas.length) * 100) : 0
  const daftarTugasTerurut = useMemo(() => [...daftarTugas].sort((a, b) => Number(a.done) - Number(b.done) || (a.deadline || '9999').localeCompare(b.deadline || '9999')), [daftarTugas])

  useEffect(() => {
    if (halamanAktif === 'Dashboard') statistikSudahDianimasikan.current = true
  }, [halamanAktif])

  useEffect(() => {
    const clockId = window.setInterval(() => aturTanggalSaatIni(new Date()), 60_000)
    return () => window.clearInterval(clockId)
  }, [])

  useEffect(() => {
    const terapkanTema = () => {
      const theme = pengaturan.theme || 'system'
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    }
    terapkanTema()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', terapkanTema)
    return () => media.removeEventListener('change', terapkanTema)
  }, [pengaturan.theme])

  // Timer disimpan di state utama agar tidak diatur ulang saat berpindah halaman.
  useEffect(() => {
    if (!timerBerjalan) return undefined
    if (sisaDetik <= 0) {
      aturTimerBerjalan(false)
      if (!penyelesaianTimerSudahDitangani.current) {
        penyelesaianTimerSudahDitangani.current = true
        const completedAt = new Date()
        const record = { id: buatId(), completedAt: completedAt.toISOString(), completedDate: ubahKeKunciTanggalLokal(completedAt), durationSeconds: durasiTimerDetik, type: modeTimer }
        aturRiwayatFokus((history) => [record, ...history])
        if (modeTimer === 'Fokus') aturJumlahSesiFokus((count) => count + 1)
        window.dispatchEvent(new CustomEvent('studyflow:timer-done', { detail: modeTimer }))
      }
      return undefined
    }
    const timerId = window.setTimeout(() => aturSisaDetik((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timerId)
  }, [timerBerjalan, sisaDetik, modeTimer, durasiTimerDetik, aturRiwayatFokus, aturJumlahSesiFokus, aturSisaDetik, aturTimerBerjalan])

  useEffect(() => {
    function tampilkanPemberitahuanTimer(event) {
      aturPemberitahuanTimer(`${event.detail} selesai. Saatnya ${event.detail === 'Fokus' ? 'istirahat sejenak' : 'kembali belajar'}!`)
      window.setTimeout(() => aturPemberitahuanTimer(''), 5000)
    }
    window.addEventListener('studyflow:timer-done', tampilkanPemberitahuanTimer)
    return () => window.removeEventListener('studyflow:timer-done', tampilkanPemberitahuanTimer)
  }, [])

  function ubahTampilanBilahSamping() {
    if (window.matchMedia('(min-width: 801px)').matches) {
      aturBilahSampingTerlipat((terlipat) => !terlipat)
      return
    }
    aturBilahSamping(true)
  }

  function bukaFormulirTambah(page = halamanAktif, item = null) {
    setModal({ page, item })
  }

  function simpanData(formData) {
    const { page, item } = modal
    const id = item?.id || buatId()
    const addActivity = (text) => aturDaftarAktivitas((list) => [{ id: buatId(), text, date: tanggalHariIni() }, ...list].slice(0, 12))
    if (page === 'Tugas') {
      const taskData = { ...formData, done: formData.status === 'Selesai' }
      aturDaftarTugas((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...taskData } : entry) : [...list, { ...taskData, id }])
      if (!item) addActivity(`Menambahkan tugas ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“${formData.title}ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`)
    } else if (page === 'Mata Pelajaran') {
      const subjectData = { ...formData, teacher: formData.teacher || '', category: formData.category || 'Umum', level: formData.level || '', description: formData.description || '', code: formData.code || '' }
      aturDaftarMataPelajaran((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...subjectData } : entry) : [...list, { ...subjectData, id }])
    }
    else if (page === 'Catatan') aturDaftarCatatan((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...formData } : entry) : [...list, { ...formData, id, createdAt: tanggalHariIni() }])
    else if (page === 'Pengingat') aturDaftarPengingat((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...formData } : entry) : [...list, { ...formData, id, done: false }])
    else if (page === 'Kalender') aturDaftarAktivitas((list) => [{ ...formData, id, date: formData.date || tanggalHariIni(), type: 'Kegiatan' }, ...list])
    setModal(null)
    tampilkanNotifikasi(`${item ? 'Perubahan' : 'Data'} berhasil disimpan.`)
  }

  function tampilkanNotifikasi(message) {
    aturNotifikasi(message)
    window.setTimeout(() => aturNotifikasi(''), 2800)
  }

  function hapusData(page, id) {
    if (!window.confirm('Hapus item ini? Data terkait yang sudah tersimpan akan tetap ada.')) return
    const setter = { Tugas: aturDaftarTugas, 'Mata Pelajaran': aturDaftarMataPelajaran, Catatan: aturDaftarCatatan, Pengingat: aturDaftarPengingat }[page]
    if (setter) setter((list) => list.filter((item) => item.id !== id))
  }

  function ubahStatusTugas(id) {
    const task = daftarTugas.find((entry) => entry.id === id)
    aturDaftarTugas((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done, status: entry.done ? 'Belum dikerjakan' : 'Selesai' } : entry))
    if (task && !task.done) tampilkanNotifikasi('Tugas selesai. Kerja bagus!')
  }

  function ubahModeTimer(mode) {
    penyelesaianTimerSudahDitangani.current = false
    aturModeTimer(mode)
    const minutes = mode === 'Fokus' ? pengaturan.focusMinutes : mode === 'Istirahat panjang' ? pengaturan.longBreak : pengaturan.shortBreak
    aturSisaDetik(minutes * 60)
    aturDurasiTimerDetik(minutes * 60)
    aturTimerBerjalan(false)
  }

  function mulaiTimerFokus() {
    penyelesaianTimerSudahDitangani.current = false
    if (sisaDetik === 0) ubahModeTimer(modeTimer)
    aturTimerBerjalan(true)
  }

  function mulaiFokusDariDasbor() {
    penyelesaianTimerSudahDitangani.current = false
    const focusDuration = pengaturan.focusMinutes * 60
    aturModeTimer('Fokus')
    aturDurasiTimerDetik(focusDuration)
    aturSisaDetik(focusDuration)
    aturTimerBerjalan(true)
  }

  function aturUlangDataAplikasi() {
    if (!window.confirm('Hapus semua data StudyFlow dari browser ini?')) return
    aturDaftarTugas([]); aturDaftarMataPelajaran([]); aturDaftarCatatan([]); aturDaftarPengingat([]); aturDaftarAktivitas([]); aturJumlahSesiFokus(0); aturRiwayatFokus([]); aturTimerBerjalan(false); aturModeTimer('Fokus'); aturSisaDetik(25 * 60); aturDurasiTimerDetik(25 * 60); aturPengaturan({ name: '', educationLevel: '', classLevel: '', institution: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  }

  return <div className={`app-shell ${apakahBilahSampingTerlipat ? 'sidebar-collapsed' : ''}`}>
    <BilahSamping halamanAktif={halamanAktif} onNavigate={aturHalamanAktif} isOpen={apakahBilahSampingTerbuka} onClose={() => aturBilahSamping(false)} userName={pengaturan.name} userPhoto={pengaturan.profilePhoto} onProfileClick={() => aturModalProfil(true)} userSummary={[pengaturan.educationLevel, pengaturan.classLevel, pengaturan.institution].filter(Boolean).join(' ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ') || 'Ruang belajarmu'} />
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label={apakahBilahSampingTerlipat ? 'Tampilkan menu' : 'Buka navigasi'} onClick={ubahTampilanBilahSamping}><Menu size={21}/></button><div className="mobile-brand"><span className="brand-logo-wrap"><img className="brand-logo" src="/assets/logo-studyflow.png" alt=""/></span><strong>StudyFlow</strong></div><div className="breadcrumb">Ruang belajar <ChevronRight size={15}/> <strong>{halamanAktif}</strong></div><div className="topbar-actions"><span className="today-pill"><CalendarDays size={16}/>{new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span><button className="icon-button theme-toggle" aria-label={apakahTemaGelap ? "Gunakan tema terang" : "Gunakan tema gelap"} title={apakahTemaGelap ? "Gunakan tema terang" : "Gunakan tema gelap"} onClick={() => aturPengaturan((value) => ({ ...value, theme: apakahTemaGelap ? 'light' : 'dark' }))}>{apakahTemaGelap ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-button notification-button" aria-label="Pengingat" title="Pengingat" onClick={() => aturHalamanAktif('Pengingat')}><Bell size={19}/>{daftarPengingat.some((item) => !item.done) && <i/>}</button><AvatarProfil className="avatar-small" name={pengaturan.name} photo={pengaturan.profilePhoto} onClick={() => aturModalProfil(true)}/></div></header>
      <section className="page-content" key={halamanAktif}>
        {halamanAktif === 'Dashboard' && <Dasbor name={pengaturan.name} daftarTugas={daftarTugasTerurut} daftarMataPelajaran={daftarMataPelajaran} daftarAktivitas={daftarAktivitas} jumlahTugasAktif={jumlahTugasAktif} jumlahTugasSelesai={jumlahTugasSelesai} progress={progress} riwayatFokus={riwayatFokus} now={tanggalSaatIni} onToggleTask={ubahStatusTugas} onAddTask={() => bukaFormulirTambah('Tugas')} onNavigate={aturHalamanAktif} onStartFocus={() => { aturHalamanAktif('Focus Mode'); mulaiFokusDariDasbor() }} animateStats={!statistikSudahDianimasikan.current}/>}
        {pageToData[halamanAktif] && <HalamanData page={halamanAktif} data={({ Tugas: daftarTugasTerurut, 'Mata Pelajaran': daftarMataPelajaran, Catatan: daftarCatatan, Pengingat: [...daftarPengingat].sort((a,b) => (a.date || '').localeCompare(b.date || '')) })[halamanAktif]} kataPencarian={kataPencarian} aturKataPencarian={aturKataPencarian} filter={filterTugas} setFilter={aturFilterTugas} filterMataPelajaran={filterMataPelajaran} aturFilterMataPelajaran={aturFilterMataPelajaran} onAdd={() => bukaFormulirTambah()} onEdit={(item) => bukaFormulirTambah(halamanAktif, item)} onDelete={(id) => hapusData(halamanAktif, id)} onToggle={(id) => halamanAktif === 'Tugas' ? ubahStatusTugas(id) : aturDaftarPengingat((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done } : entry))}/>}
        {halamanAktif === 'Kalender' && <HalamanKalender daftarTugas={daftarTugas} daftarMataPelajaran={daftarMataPelajaran} daftarAktivitas={daftarAktivitas} selisihBulan={selisihBulan} aturSelisihBulan={aturSelisihBulan} now={tanggalSaatIni} onAdd={() => bukaFormulirTambah('Kalender')}/>}
        {halamanAktif === 'Focus Mode' && <HalamanFokus mode={modeTimer} seconds={sisaDetik} running={timerBerjalan} sessions={jumlahSesiFokus} history={riwayatFokus} onMode={ubahModeTimer} onRun={mulaiTimerFokus} onPause={() => aturTimerBerjalan(false)} onReset={() => { aturTimerBerjalan(false); ubahModeTimer(modeTimer) }}/ >}
        {halamanAktif === 'Progress Belajar' && <HalamanProgres daftarTugas={daftarTugas} daftarMataPelajaran={daftarMataPelajaran} sessions={jumlahSesiFokus} riwayatFokus={riwayatFokus} daftarAktivitas={daftarAktivitas} now={tanggalSaatIni}/>}
        {halamanAktif === 'Pengaturan' && <HalamanPengaturan pengaturan={pengaturan} aturPengaturan={aturPengaturan} onReset={aturUlangDataAplikasi}/>}
      </section>
    </main>
    {modal && <FormulirData modal={modal} daftarMataPelajaran={daftarMataPelajaran} onClose={() => setModal(null)} onSave={simpanData}/>}
    {modalProfilTerbuka && <ModalFotoProfil name={pengaturan.name} photo={pengaturan.profilePhoto || ''} onClose={() => aturModalProfil(false)} onSave={(profilePhoto) => { aturPengaturan((value) => ({ ...value, profilePhoto })); aturModalProfil(false); tampilkanNotifikasi(profilePhoto ? 'Foto profil berhasil diperbarui.' : 'Foto profil dihapus.') }}/>} 
    <NavigasiMobile halamanAktif={halamanAktif} onNavigate={aturHalamanAktif}/>
    {(pemberitahuanTimer || toast) && <div className="timer-notice toast-enter" role="status"><CheckCircle2 size={18}/>{pemberitahuanTimer || toast}<button onClick={() => { aturPemberitahuanTimer(''); aturNotifikasi('') }} aria-label="Tutup pemberitahuan"><X size={16}/></button></div>}
  </div>
}

export default Aplikasi


