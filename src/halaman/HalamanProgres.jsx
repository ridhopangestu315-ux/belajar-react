import { Activity, CalendarDays, Check, CheckCircle2, Clock3, Target, Timer } from 'lucide-react'
import { TampilanKosong, KartuStatistik } from '../komponen/KomponenBelajar.jsx'
import PengantarHalaman from '../komponen/PengantarHalaman.jsx'
import { ambilKunciTanggalTerbaru, ubahDariKunciTanggalLokal, ubahKeKunciTanggalLokal as tanggalHariIni } from '../fungsi-bantuan/tanggal.js'

export function HalamanProgres({ daftarTugas, daftarMataPelajaran, sessions, riwayatFokus, daftarAktivitas, now }) {
  const completed = daftarTugas.filter((task) => task.done).length
  const percent = daftarTugas.length ? Math.round(completed / daftarTugas.length * 100) : 0
  const activityCount = daftarAktivitas.filter((item) => item.date === tanggalHariIni()).length
  const weekActivity = ambilKunciTanggalTerbaru(now).map((key) => ({ key, label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(ubahDariKunciTanggalLokal(key)), count: daftarAktivitas.filter((item) => item.date === key).length }))
  const maxDailyActivity = Math.max(...weekActivity.map((day) => day.count), 1)
  const activeStudyDays = weekActivity.filter((day) => day.count > 0).length
  const focusRecords = riwayatFokus.filter((session) => session.type === 'Fokus')
  const totalFocusMinutes = focusRecords.reduce((total, session) => total + session.durationSeconds / 60, 0)
  const weekKeys = new Set(ambilKunciTanggalTerbaru(now))
  const weeklyFocusRecords = focusRecords.filter((session) => weekKeys.has(session.completedDate))
  const menitFokusMingguan = weeklyFocusRecords.reduce((total, session) => total + session.durationSeconds / 60, 0)
  return <div className="non-dashboard-page">
    <PengantarHalaman halaman="Progress Belajar" judul="Progress belajar" deskripsi="Pantau perkembangan dan kebiasaan belajarmu." Ikon={Activity}/>
    <div className="stats-grid progress-summary-grid">
      <KartuStatistik title="Total tugas" value={daftarTugas.length} hint="Tercatat" icon={<CheckCircle2 />} tone="purple" />
      <KartuStatistik title="Tugas selesai" value={completed} hint={`${percent}% dari total`} icon={<Check />} tone="green" />
      <KartuStatistik title="Belum selesai" value={daftarTugas.length - completed} hint="Masih bisa dikerjakan" icon={<Clock3 />} tone="blue" />
      <KartuStatistik title="Sesi fokus" value={Math.max(sessions, focusRecords.length)} hint="Jumlah sesi tersimpan" icon={<Target />} tone="orange" />
      <KartuStatistik title="Total waktu fokus" value={`${(totalFocusMinutes / 60).toFixed(1)} jam`} hint="Berdasarkan riwayat sesi" icon={<Timer />} tone="terracotta" />
      <KartuStatistik title="Fokus minggu ini" value={`${(menitFokusMingguan / 60).toFixed(1)} jam`} hint={`${weeklyFocusRecords.length} sesi dalam 7 hari`} icon={<Clock3 />} tone="green" />
      <KartuStatistik title="Hari aktif" value={activeStudyDays} hint="Dari 7 hari terakhir" icon={<CalendarDays />} tone="purple" />
    </div>
    <div className="dashboard-grid progress-grid">
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">PENYELESAIAN</p><h2>Ringkasan tugas</h2></div></div>
        <div className="big-progress"><div className="big-progress-bar"><span style={{ width: `${percent}%` }} /></div><strong>{percent}%</strong></div>
        <p className="muted">{completed} dari {daftarTugas.length} tugas sudah selesai.</p>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">AKTIVITAS</p><h2>Hari ini</h2></div></div>
        <div className="activity-summary"><span className="summary-number">{activityCount}</span><p>aktivitas tercatat hari ini</p></div>
        {weekActivity.some((day) => day.count > 0) ? <div className="activity-bars">{weekActivity.map((day) => <div key={day.key} title={`${day.count} aktivitas`}><span style={{ height: `${Math.max(day.count / maxDailyActivity * 100, 8)}%` }} /><small>{day.label}</small></div>)}</div> : <TampilanKosong text="Aktivitas minggu ini akan muncul setelah kamu belajar." />}
      </section>
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">MATA PELAJARAN</p><h2>Tugas per mata pelajaran</h2></div></div>
        {daftarMataPelajaran.length ? <div className="subject-progress-list">{daftarMataPelajaran.map((subject) => {
          const subjectTasks = daftarTugas.filter((task) => task.subject === subject.name)
          const done = subjectTasks.filter((task) => task.done).length
          return <div key={subject.id}><div><span>{subject.name}</span><span>{done}/{subjectTasks.length}</span></div><div className="big-progress-bar"><span style={{ width: `${subjectTasks.length ? done / subjectTasks.length * 100 : 0}%`, background: subject.color || undefined }} /></div></div>
        })}</div> : <TampilanKosong text="Tambahkan mata pelajaran untuk melihat statistiknya." />}
      </section>
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">DURASI BELAJAR</p><h2>Fokus bertahap</h2></div></div>
        <div className="activity-summary"><span className="summary-number">{Math.round(totalFocusMinutes)}</span><p>menit fokus tercatat dalam riwayat</p></div>
        <p className="muted">Riwayat durasi mulai dihitung dari sesi yang selesai setelah pembaruan ini; hitungan sesi lama tetap tersimpan.</p>
      </section>
    </div>
  </div>
}
