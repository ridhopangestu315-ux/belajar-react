import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CalendarDays, ChevronRight, LogOut, Menu, Moon, Sun } from 'lucide-react'
import BilahSamping from './komponen/BilahSamping.jsx'
import Dasbor from './halaman/Dasbor.jsx'
import { HalamanFokus } from './halaman/HalamanFokus.jsx'
import { HalamanProgres } from './halaman/HalamanProgres.jsx'
import { HalamanPengaturan } from './halaman/HalamanPengaturan.jsx'
import { FormulirData } from './komponen/FormulirData.jsx'
import NavigasiMobile from './komponen/NavigasiMobile.jsx'
import AvatarProfil from './komponen/AvatarProfil.jsx'
import ModalFotoProfil from './komponen/ModalFotoProfil.jsx'
import PusatPemberitahuan from './komponen/PusatPemberitahuan.jsx'
import HalamanAutentikasi from './halaman/HalamanAutentikasi.jsx'
import { HalamanKalender, HalamanData } from './halaman/HalamanPerencanaan.jsx'
import { usePenyimpananLokal } from './kait/usePenyimpananLokal.js'
import { ubahKeKunciTanggalLokal } from './fungsi-bantuan/tanggal.js'
import { eksporCatatanPdf, eksporKegiatanPdf, eksporTugasPdf } from './fungsi-bantuan/eksporStudyFlow.js'

const logoStudyFlow = `${import.meta.env.BASE_URL}assets/logo-studyflow.png`

const tanggalHariIni = () => ubahKeKunciTanggalLokal()
const buatId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`
const pageToData = { 'Mata Pelajaran': 'subjects', Tugas: 'tasks', Catatan: 'notes', Pengingat: 'reminders' }

const kunciKoleksiBelajar = ['studyflow_tasks', 'studyflow_subjects', 'studyflow_courses', 'studyflow_notes', 'studyflow_reminders', 'studyflow_activities', 'studyflow_focus_history']

function bersihkanDataContohTersimpan() {
  kunciKoleksiBelajar.forEach((kunci) => {
    try {
      const nilai = JSON.parse(localStorage.getItem(kunci) || '[]')
      if (!Array.isArray(nilai)) return
      const dataTanpaContoh = nilai.filter((item) => !String(item?.id || '').startsWith('sample-'))
      if (dataTanpaContoh.length !== nilai.length) localStorage.setItem(kunci, JSON.stringify(dataTanpaContoh))
    } catch { /* Data yang tidak valid akan ditangani oleh pengait penyimpanan. */ }
  })
}

function migrasikanDataBelajar() {
  try {
    bersihkanDataContohTersimpan()
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
    if (uniqueSubjects.length) {
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
    if (existingTasks.length) localStorage.setItem('studyflow_tasks', JSON.stringify(normalizedTasks))
    const pengaturan = localStorage.getItem('studyflow_settings')
    if (pengaturan) {
      try { localStorage.setItem('studyflow_settings', JSON.stringify({ educationLevel:'', classLevel:'', institution:'', ...JSON.parse(pengaturan) })) } catch { /* Biarkan pengait memakai nilai awal jika data pengaturan rusak. */ }
    }
    localStorage.setItem('studyflow_universal_v1', 'true')
  } catch { /* Jika penyimpanan tidak tersedia, aplikasi tetap memakai nilai di memori. */ }
}

const kunciPenyimpanan = (penggunaId, kunci) => `studyflow_user_${penggunaId}_${kunci.replace(/^studyflow_/, '')}`
const kunciPenyimpananPengguna = ['studyflow_tasks', 'studyflow_subjects', 'studyflow_courses', 'studyflow_notes', 'studyflow_reminders', 'studyflow_activities', 'studyflow_settings', 'studyflow_focus_history', 'studyflow_focus_sessions', 'studyflow_timer_running', 'studyflow_timer_mode', 'studyflow_timer_seconds', 'studyflow_timer_duration_seconds']

function siapkanPenyimpananPengguna(penggunaId) {
  try {
    const pemilikLama = localStorage.getItem('studyflow_local_owner')
    if (pemilikLama === null) {
      migrasikanDataBelajar()
      kunciPenyimpananPengguna.forEach((kunci) => {
        const kunciBaru = kunciPenyimpanan(penggunaId, kunci)
        const nilaiLama = localStorage.getItem(kunci)
        if (nilaiLama !== null && localStorage.getItem(kunciBaru) === null) localStorage.setItem(kunciBaru, nilaiLama)
      })
      localStorage.setItem('studyflow_local_owner', String(penggunaId))
    }
  } catch { /* Aplikasi tetap dapat berjalan jika penyimpanan browser tidak tersedia. */ }
}

function AplikasiTerlindungi({ onLogout, sessionUser, onSessionUserChange }) {
  const [halamanAktif, aturHalamanAktif] = useState('Dashboard')
  const [apakahBilahSampingTerbuka, aturBilahSamping] = useState(false)
  const [apakahBilahSampingTerlipat, aturBilahSampingTerlipat] = useState(false)
  const [daftarTugas, aturDaftarTugas] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_tasks'), [])
  const [daftarMataPelajaran, aturDaftarMataPelajaran] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_subjects'), [])
  const [daftarCatatan, aturDaftarCatatan] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_notes'), [])
  const [daftarPengingat, aturDaftarPengingat] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_reminders'), [])
  const [daftarAktivitas, aturDaftarAktivitas] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_activities'), [])
  const [pengaturan, aturPengaturan] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_settings'), { name: sessionUser.name || '', email: sessionUser.email || '', educationLevel: '', classLevel: '', institution: '', theme: 'light', focusMinutes: 25, shortBreak: 5, longBreak: 15 })
  const [modal, setModal] = useState(null)
  const [kataPencarian, aturKataPencarian] = useState('')
  const [filterTugas, aturFilterTugas] = useState('Semua tugas')
  const [filterMataPelajaran, aturFilterMataPelajaran] = useState('Semua bidang')
  const [selisihBulan, aturSelisihBulan] = useState(0)
  const [modeTimer, aturModeTimer] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_timer_mode'), 'Fokus')
  const [sisaDetik, aturSisaDetik] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_timer_seconds'), (pengaturan.focusMinutes || 25) * 60)
  const [durasiTimerDetik, aturDurasiTimerDetik] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_timer_duration_seconds'), (pengaturan.focusMinutes || 25) * 60)
  const [timerBerjalan, aturTimerBerjalan] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_timer_running'), false)
  const [jumlahSesiFokus, aturJumlahSesiFokus] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_focus_sessions'), 0)
  const [riwayatFokus, aturRiwayatFokus] = usePenyimpananLokal(kunciPenyimpanan(sessionUser.id, 'studyflow_focus_history'), [])
  const [notifikasi, aturNotifikasi] = useState(null)
  const [konfirmasi, aturKonfirmasi] = useState(null)
  const [modalProfilTerbuka, aturModalProfil] = useState(false)
  const [tanggalSaatIni, aturTanggalSaatIni] = useState(() => new Date())
  const penyelesaianTimerSudahDitangani = useRef(false)
  const penyelesaiKonfirmasi = useRef(null)

  const tampilkanNotifikasi = useCallback((pesan, jenis = 'success') => {
    if (!pesan) return
    if (pengaturan.notifications === false && jenis !== 'error') return
    aturNotifikasi((sebelumnya) => sebelumnya?.pesan === pesan && sebelumnya?.jenis === jenis
      ? sebelumnya
      : { id: Date.now(), pesan, jenis })
  }, [pengaturan.notifications])

  const tutupNotifikasi = useCallback(() => aturNotifikasi(null), [])

  async function kirimAksiAkun(endpoint, data) {
    const respons = await fetch(`/api/auth/${endpoint}.php`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
    const hasil = await respons.json()
    if (!respons.ok || !hasil.berhasil) throw new Error(hasil.pesan || 'Perubahan akun belum berhasil.')
    return hasil
  }

  async function gantiEmailAkun(data) {
    const hasil = await kirimAksiAkun('change-email', data)
    onSessionUserChange(hasil.user)
    aturPengaturan((current) => ({ ...current, email: hasil.user.email }))
    tampilkanNotifikasi(hasil.pesan, 'success')
    return hasil.user
  }

  async function gantiPasswordAkun(data) {
    const hasil = await kirimAksiAkun('change-password', data)
    tampilkanNotifikasi(hasil.pesan, 'success')
  }

  function cetakPdf(jenis) {
    const namaPengguna = pengaturan.name?.trim() || sessionUser.name || 'Pengguna StudyFlow'
    const berhasil = jenis === 'tugas'
      ? eksporTugasPdf({ pengguna: namaPengguna, tugas: daftarTugas })
      : jenis === 'catatan'
        ? eksporCatatanPdf({ pengguna: namaPengguna, catatan: daftarCatatan })
        : eksporKegiatanPdf({ pengguna: namaPengguna, kegiatan: daftarAktivitas.filter((item) => ['Kegiatan', 'Jadwal'].includes(item.type)) })
    if (!berhasil) tampilkanNotifikasi('Jendela cetak diblokir. Izinkan pop-up untuk StudyFlow, lalu coba lagi.', 'error')
  }

  const tampilkanKonfirmasi = useCallback((opsi) => new Promise((resolve) => {
    penyelesaiKonfirmasi.current?.(false)
    penyelesaiKonfirmasi.current = resolve
    aturKonfirmasi({ ...opsi, id: Date.now() })
  }), [])

  const selesaikanKonfirmasi = useCallback((hasil) => {
    penyelesaiKonfirmasi.current?.(hasil)
    penyelesaiKonfirmasi.current = null
    aturKonfirmasi(null)
  }, [])

  const apakahTemaGelap = pengaturan.theme === 'dark' || (pengaturan.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const jumlahTugasSelesai = daftarTugas.filter((task) => task.done).length
  const jumlahTugasAktif = daftarTugas.length - jumlahTugasSelesai
  const progress = daftarTugas.length ? Math.round((jumlahTugasSelesai / daftarTugas.length) * 100) : 0
  const daftarTugasTerurut = useMemo(() => [...daftarTugas].sort((a, b) => Number(a.done) - Number(b.done) || (a.deadline || '9999').localeCompare(b.deadline || '9999')), [daftarTugas])

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
      tampilkanNotifikasi(`${event.detail} selesai. Saatnya ${event.detail === 'Fokus' ? 'istirahat sejenak' : 'kembali belajar'}!`, 'information')
    }
    window.addEventListener('studyflow:timer-done', tampilkanPemberitahuanTimer)
    return () => window.removeEventListener('studyflow:timer-done', tampilkanPemberitahuanTimer)
  }, [tampilkanNotifikasi])

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
    else if (page === 'Catatan') aturDaftarCatatan((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...formData, updatedAt: tanggalHariIni() } : entry) : [...list, { ...formData, id, createdAt: tanggalHariIni(), updatedAt: tanggalHariIni() }])
    else if (page === 'Pengingat') aturDaftarPengingat((list) => item ? list.map((entry) => entry.id === id ? { ...entry, ...formData } : entry) : [...list, { ...formData, id, done: false }])
    else if (page === 'Kalender') aturDaftarAktivitas((list) => item
      ? list.map((entry) => entry.id === id ? { ...entry, ...formData, id, date: formData.date || tanggalHariIni(), type: 'Kegiatan' } : entry)
      : [{ ...formData, id, date: formData.date || tanggalHariIni(), type: 'Kegiatan' }, ...list])
    setModal(null)
    tampilkanNotifikasi(`${item ? 'Perubahan' : 'Data'} berhasil disimpan.`)
  }

  async function hapusData(page, id) {
    const disetujui = await tampilkanKonfirmasi({ judul: 'Hapus data ini?', pesan: 'Data terkait yang sudah tersimpan akan tetap ada.', jenis: 'warning', labelKonfirmasi: 'Ya, hapus' })
    if (!disetujui) return
    const setter = { Tugas: aturDaftarTugas, 'Mata Pelajaran': aturDaftarMataPelajaran, Catatan: aturDaftarCatatan, Pengingat: aturDaftarPengingat, Kalender: aturDaftarAktivitas }[page]
    if (!setter) return false
    setter((list) => list.filter((item) => item.id !== id))
    tampilkanNotifikasi('Data berhasil dihapus.')
    return true
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

  async function aturUlangDataAplikasi() {
    const disetujui = await tampilkanKonfirmasi({ judul: 'Hapus seluruh data StudyFlow?', pesan: 'Semua tugas, mata pelajaran, catatan, pengingat, aktivitas, dan riwayat fokus akan dihapus permanen. Pengaturan aplikasi, foto profil, logo, dan motivasi harian tetap tersimpan. Tindakan ini tidak dapat dibatalkan.', jenis: 'warning', frasaKonfirmasi: 'HAPUS SEMUA DATA', labelKonfirmasi: 'Hapus Permanen' })
    if (!disetujui) return

    // Simpan data koleksi kosong sebelum memperbarui state agar data lama terhapus dari penyimpanan.
    const kunciKoleksiBelajar = ['studyflow_tasks', 'studyflow_subjects', 'studyflow_notes', 'studyflow_reminders', 'studyflow_activities', 'studyflow_focus_history']
    try {
      kunciKoleksiBelajar.forEach((kunci) => localStorage.setItem(kunciPenyimpanan(sessionUser.id, kunci), '[]'))
      localStorage.setItem(kunciPenyimpanan(sessionUser.id, 'studyflow_focus_sessions'), '0')
      localStorage.setItem(kunciPenyimpanan(sessionUser.id, 'studyflow_timer_running'), 'false')
      localStorage.setItem(kunciPenyimpanan(sessionUser.id, 'studyflow_timer_mode'), JSON.stringify('Fokus'))
      localStorage.setItem(kunciPenyimpanan(sessionUser.id, 'studyflow_timer_seconds'), JSON.stringify(25 * 60))
      localStorage.setItem(kunciPenyimpanan(sessionUser.id, 'studyflow_timer_duration_seconds'), JSON.stringify(25 * 60))
      if (localStorage.getItem('studyflow_local_owner') === String(sessionUser.id)) {
        [...kunciKoleksiBelajar, 'studyflow_courses'].forEach((kunci) => localStorage.removeItem(kunci))
      }
    } catch {
      tampilkanNotifikasi('Data belum dapat dihapus. Periksa ruang penyimpanan browser lalu coba lagi.', 'error')
      return
    }

    aturDaftarTugas([]); aturDaftarMataPelajaran([]); aturDaftarCatatan([]); aturDaftarPengingat([]); aturDaftarAktivitas([]); aturJumlahSesiFokus(0); aturRiwayatFokus([]); aturTimerBerjalan(false); aturModeTimer('Fokus'); aturSisaDetik(25 * 60); aturDurasiTimerDetik(25 * 60)
    tampilkanNotifikasi('Semua data StudyFlow berhasil dihapus.')
  }

  return <div className={`app-shell ${apakahBilahSampingTerlipat ? 'sidebar-collapsed' : ''}`}>
    <BilahSamping halamanAktif={halamanAktif} onNavigate={aturHalamanAktif} isOpen={apakahBilahSampingTerbuka} onClose={() => aturBilahSamping(false)} userName={pengaturan.name} userPhoto={pengaturan.profilePhoto} onProfileClick={() => aturModalProfil(true)} userSummary={[pengaturan.educationLevel, pengaturan.classLevel, pengaturan.institution].filter(Boolean).join(' ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ') || 'Ruang belajarmu'} />
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label={apakahBilahSampingTerlipat ? 'Tampilkan menu' : 'Buka navigasi'} onClick={ubahTampilanBilahSamping}><Menu size={21}/></button><div className="mobile-brand"><span className="brand-logo-wrap"><img className="brand-logo" src={logoStudyFlow} alt=""/></span><strong>StudyFlow</strong></div><div className="breadcrumb">Ruang belajar <ChevronRight size={15}/> <strong>{halamanAktif}</strong></div><div className="topbar-actions"><span className="today-pill"><CalendarDays size={16}/>{new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(tanggalSaatIni)}</span><button className="icon-button theme-toggle" aria-label={apakahTemaGelap ? "Gunakan tema terang" : "Gunakan tema gelap"} title={apakahTemaGelap ? "Gunakan tema terang" : "Gunakan tema gelap"} onClick={() => aturPengaturan((value) => ({ ...value, theme: apakahTemaGelap ? 'light' : 'dark' }))}>{apakahTemaGelap ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-button notification-button" aria-label="Pengingat" title="Pengingat" onClick={() => aturHalamanAktif('Pengingat')}><Bell size={19}/>{daftarPengingat.some((item) => !item.done) && <i/>}</button><button className="icon-button auth-logout" type="button" aria-label="Keluar" title="Keluar" onClick={async () => { const disetujui = await tampilkanKonfirmasi({ judul: 'Keluar dari StudyFlow?', pesan: 'Anda perlu masuk kembali untuk melanjutkan belajar.', jenis: 'warning', labelKonfirmasi: 'Keluar' }); if (disetujui) onLogout() }}><LogOut size={18}/></button><AvatarProfil className="avatar-small" name={pengaturan.name} photo={pengaturan.profilePhoto} onClick={() => aturModalProfil(true)}/></div></header>
      <section className="page-content" key={halamanAktif}>
        {halamanAktif === 'Dashboard' && <Dasbor name={pengaturan.name} daftarTugas={daftarTugasTerurut} daftarMataPelajaran={daftarMataPelajaran} daftarAktivitas={daftarAktivitas} jumlahTugasAktif={jumlahTugasAktif} jumlahTugasSelesai={jumlahTugasSelesai} progress={progress} riwayatFokus={riwayatFokus} now={tanggalSaatIni} onToggleTask={ubahStatusTugas} onAddTask={() => bukaFormulirTambah('Tugas')} onNavigate={aturHalamanAktif} onStartFocus={() => { aturHalamanAktif('Focus Mode'); mulaiFokusDariDasbor() }} animateStats={halamanAktif === 'Dashboard'}/>}
        {pageToData[halamanAktif] && <HalamanData page={halamanAktif} data={({ Tugas: daftarTugasTerurut, 'Mata Pelajaran': daftarMataPelajaran, Catatan: daftarCatatan, Pengingat: [...daftarPengingat].sort((a,b) => (a.date || '').localeCompare(b.date || '')) })[halamanAktif]} kataPencarian={kataPencarian} aturKataPencarian={aturKataPencarian} filter={filterTugas} setFilter={aturFilterTugas} filterMataPelajaran={filterMataPelajaran} aturFilterMataPelajaran={aturFilterMataPelajaran} onAdd={() => bukaFormulirTambah()} onEdit={(item) => bukaFormulirTambah(halamanAktif, item)} onDelete={(id) => hapusData(halamanAktif, id)} onToggle={(id) => halamanAktif === 'Tugas' ? ubahStatusTugas(id) : aturDaftarPengingat((list) => list.map((entry) => entry.id === id ? { ...entry, done: !entry.done } : entry))} onExportPdf={halamanAktif === 'Tugas' ? () => cetakPdf('tugas') : halamanAktif === 'Catatan' ? () => cetakPdf('catatan') : undefined}/>}
        {halamanAktif === 'Kalender' && <HalamanKalender daftarTugas={daftarTugas} daftarMataPelajaran={daftarMataPelajaran} daftarAktivitas={daftarAktivitas} selisihBulan={selisihBulan} aturSelisihBulan={aturSelisihBulan} now={tanggalSaatIni} onAdd={() => bukaFormulirTambah('Kalender')} onEditActivity={(item) => bukaFormulirTambah('Kalender', item)} onDeleteActivity={(id) => hapusData('Kalender', id)} onExportPdf={() => cetakPdf('kegiatan')}/>}
        {halamanAktif === 'Focus Mode' && <HalamanFokus mode={modeTimer} seconds={sisaDetik} running={timerBerjalan} sessions={jumlahSesiFokus} history={riwayatFokus} focusMinutes={pengaturan.focusMinutes || 25} shortBreak={pengaturan.shortBreak || 5} longBreak={pengaturan.longBreak || 15} onMode={ubahModeTimer} onRun={mulaiTimerFokus} onPause={() => aturTimerBerjalan(false)} onReset={() => { aturTimerBerjalan(false); ubahModeTimer(modeTimer) }}/ >}
        {halamanAktif === 'Progress Belajar' && <HalamanProgres daftarTugas={daftarTugas} daftarMataPelajaran={daftarMataPelajaran} sessions={jumlahSesiFokus} riwayatFokus={riwayatFokus} daftarAktivitas={daftarAktivitas} now={tanggalSaatIni}/>}
        {halamanAktif === 'Pengaturan' && <HalamanPengaturan pengaturan={pengaturan} aturPengaturan={aturPengaturan} akun={sessionUser} onChangeEmail={gantiEmailAkun} onChangePassword={gantiPasswordAkun} onReset={aturUlangDataAplikasi} tampilkanNotifikasi={tampilkanNotifikasi}/>}
      </section>
    </main>
    {modal && <FormulirData modal={modal} daftarMataPelajaran={daftarMataPelajaran} tampilkanNotifikasi={tampilkanNotifikasi} onClose={() => setModal(null)} onSave={simpanData}/>}
    {modalProfilTerbuka && <ModalFotoProfil name={pengaturan.name} photo={pengaturan.profilePhoto || ''} onClose={() => aturModalProfil(false)} onSave={(profilePhoto) => { aturPengaturan((value) => ({ ...value, profilePhoto })); aturModalProfil(false); tampilkanNotifikasi(profilePhoto ? 'Foto profil berhasil diperbarui.' : 'Foto profil dihapus.') }}/>} 
    <NavigasiMobile halamanAktif={halamanAktif} onNavigate={aturHalamanAktif}/>
    <PusatPemberitahuan notifikasi={notifikasi} konfirmasi={konfirmasi} tutupNotifikasi={tutupNotifikasi} tampilkanNotifikasi={tampilkanNotifikasi} selesaikanKonfirmasi={selesaikanKonfirmasi}/>
  </div>
}

function Aplikasi() {
  const [statusAutentikasi, aturStatusAutentikasi] = useState('memuat')
  const [sessionUser, aturSessionUser] = useState(null)
  const [pesanNotifikasi, aturPesanNotifikasi] = useState(null)

  const tampilkanNotifikasiAutentikasi = useCallback((pesan, jenis = 'success') => {
    aturPesanNotifikasi({ id: Date.now(), pesan, jenis })
  }, [])

  useEffect(() => {
    let masihAktif = true
    fetch('/api/auth/check-session.php', { method: 'GET', credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(async (respons) => {
        const hasil = await respons.json()
        if (!respons.ok || !hasil.berhasil) throw new Error(hasil.pesan || 'Status sesi belum dapat diperiksa.')
        if (masihAktif) {
          if (hasil.authenticated && hasil.user?.id) {
            siapkanPenyimpananPengguna(hasil.user.id)
            aturSessionUser(hasil.user)
            aturStatusAutentikasi('masuk')
          } else {
            aturSessionUser(null)
            aturStatusAutentikasi('keluar')
          }
        }
      })
      .catch(() => {
        if (!masihAktif) return
        aturStatusAutentikasi('keluar')
        tampilkanNotifikasiAutentikasi('Sesi belum dapat diperiksa. Pastikan server PHP aktif, lalu masuk kembali.', 'error')
      })
    return () => { masihAktif = false }
  }, [tampilkanNotifikasiAutentikasi])

  async function keluar() {
    try {
      const respons = await fetch('/api/auth/logout.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })
      const hasil = await respons.json()
      if (!respons.ok || !hasil.berhasil) throw new Error(hasil.pesan || 'Belum berhasil keluar.')
      aturSessionUser(null)
      aturStatusAutentikasi('keluar')
      tampilkanNotifikasiAutentikasi(hasil.pesan, 'success')
    } catch (kesalahan) {
      tampilkanNotifikasiAutentikasi(kesalahan instanceof TypeError ? 'Tidak dapat terhubung ke server untuk keluar.' : kesalahan.message, 'error')
    }
  }

  return <>
    {statusAutentikasi === 'memuat' && <main className="auth-screen"><div className="auth-loading" role="status">Memeriksa sesi StudyFlow...</div></main>}
    {statusAutentikasi === 'keluar' && <HalamanAutentikasi onBerhasilMasuk={(pengguna) => { siapkanPenyimpananPengguna(pengguna.id); aturSessionUser(pengguna); aturStatusAutentikasi('masuk') }} tampilkanNotifikasi={tampilkanNotifikasiAutentikasi}/>}
    {statusAutentikasi === 'masuk' && sessionUser && <AplikasiTerlindungi sessionUser={sessionUser} onSessionUserChange={aturSessionUser} onLogout={keluar}/>}
    <PusatPemberitahuan notifikasi={pesanNotifikasi} konfirmasi={null} tutupNotifikasi={() => aturPesanNotifikasi(null)} tampilkanNotifikasi={tampilkanNotifikasiAutentikasi} selesaikanKonfirmasi={() => {}}/>
  </>
}

export default Aplikasi


