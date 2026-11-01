import { useState } from 'react'
import { Bell, Database, Monitor, Settings2, ShieldCheck, Timer, Trash2, UserRound } from 'lucide-react'
import PengantarHalaman from '../komponen/PengantarHalaman.jsx'
import InputPassword from '../komponen/InputPassword.jsx'

export function HalamanPengaturan({ pengaturan, aturPengaturan, akun, onChangeEmail, onChangePassword, onReset, tampilkanNotifikasi }) {
  const [emailBaru, aturEmailBaru] = useState('')
  const [verifikasiEmail, aturVerifikasiEmail] = useState('')
  const [passwordLama, aturPasswordLama] = useState('')
  const [passwordBaru, aturPasswordBaru] = useState('')
  const [konfirmasiPassword, aturKonfirmasiPassword] = useState('')
  const [sedangMenyimpanEmail, aturSedangMenyimpanEmail] = useState(false)
  const [sedangMenyimpanPassword, aturSedangMenyimpanPassword] = useState(false)
  const educationOptions = ['SMP', 'SMA', 'SMK', 'Perguruan Tinggi', 'Belajar Mandiri', 'Lainnya']

  function ubahPengaturan(name, value) {
    aturPengaturan((current) => ({ ...current, [name]: value }))
  }

  async function simpanEmail(event) {
    event.preventDefault()
    aturSedangMenyimpanEmail(true)
    try {
      await onChangeEmail({ email: emailBaru, password: verifikasiEmail })
      aturEmailBaru('')
      aturVerifikasiEmail('')
    } catch (kesalahan) {
      tampilkanNotifikasi(kesalahan.message, 'error')
    } finally {
      aturSedangMenyimpanEmail(false)
    }
  }

  async function simpanPassword(event) {
    event.preventDefault()
    if (passwordBaru !== konfirmasiPassword) {
      tampilkanNotifikasi('Konfirmasi password baru belum sama.', 'error')
      return
    }
    aturSedangMenyimpanPassword(true)
    try {
      await onChangePassword({ current_password: passwordLama, new_password: passwordBaru, confirm_password: konfirmasiPassword })
      aturPasswordLama('')
      aturPasswordBaru('')
      aturKonfirmasiPassword('')
    } catch (kesalahan) {
      tampilkanNotifikasi(kesalahan.message, 'error')
    } finally {
      aturSedangMenyimpanPassword(false)
    }
  }

  return <div className="non-dashboard-page">
    <PengantarHalaman halaman="Pengaturan" judul="Pengaturan" deskripsi="Kelola akun, preferensi, dan data belajar dalam satu tempat." Ikon={Settings2}/>
    <div className="settings-sections">
      <section className="panel settings-section settings-account-section">
        <div className="settings-section-heading"><span><UserRound size={19}/></span><div><h2>Profil dan Akun</h2><p>Informasi profil dan alamat email akunmu.</p></div></div>
        <div className="settings-form-grid">
          <label className="field-label">Nama pengguna<input className="form-control" value={pengaturan.name || ''} placeholder="Nama panggilan (opsional)" onChange={(event) => ubahPengaturan('name', event.target.value)} /></label>
          <label className="field-label">Jenjang pendidikan<select className="form-control" value={pengaturan.educationLevel || ''} onChange={(event) => ubahPengaturan('educationLevel', event.target.value)}><option value="">Pilih jenjang</option>{educationOptions.map((level) => <option key={level}>{level}</option>)}</select></label>
          <label className="field-label">Kelas atau tingkat<input className="form-control" value={pengaturan.classLevel || ''} placeholder="Contoh: Kelas 8" onChange={(event) => ubahPengaturan('classLevel', event.target.value)} /></label>
          <label className="field-label">Sekolah atau institusi<input className="form-control" value={pengaturan.institution || ''} placeholder="Opsional" onChange={(event) => ubahPengaturan('institution', event.target.value)} /></label>
        </div>
        <form className="settings-inline-form" onSubmit={simpanEmail}>
          <label className="field-label">Email saat ini<input className="form-control" type="email" value={akun?.email || ''} readOnly /></label>
          <label className="field-label">Email baru<input className="form-control" type="email" value={emailBaru} onChange={(event) => aturEmailBaru(event.target.value)} maxLength={254} required autoComplete="email" /></label>
          <label className="field-label">Password untuk verifikasi<InputPassword inputClassName="form-control" name="email-password" value={verifikasiEmail} onChange={(event) => aturVerifikasiEmail(event.target.value)} required autoComplete="current-password" placeholder="Password saat ini" /></label>
          <button className="secondary-button settings-submit" type="submit" disabled={sedangMenyimpanEmail}>{sedangMenyimpanEmail ? 'Menyimpan…' : 'Ganti email'}</button>
        </form>
      </section>

      <section className="panel settings-section settings-security-section">
        <div className="settings-section-heading"><span><ShieldCheck size={19}/></span><div><h2>Keamanan Akun</h2><p>Gunakan password unik minimal 8 karakter.</p></div></div>
        <form className="settings-form-grid" onSubmit={simpanPassword}>
          <label className="field-label">Password lama<InputPassword inputClassName="form-control" name="current-password" value={passwordLama} onChange={(event) => aturPasswordLama(event.target.value)} required autoComplete="current-password" placeholder="Password saat ini" /></label>
          <label className="field-label">Password baru<InputPassword inputClassName="form-control" name="new-password" value={passwordBaru} onChange={(event) => aturPasswordBaru(event.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Minimal 8 karakter" /></label>
          <label className="field-label">Konfirmasi password baru<InputPassword inputClassName="form-control" name="confirm-password" value={konfirmasiPassword} onChange={(event) => aturKonfirmasiPassword(event.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Ulangi password baru" /></label>
          <div className="settings-form-action"><button className="primary-button" type="submit" disabled={sedangMenyimpanPassword}>{sedangMenyimpanPassword ? 'Menyimpan…' : 'Ganti password'}</button></div>
        </form>
      </section>

      <section className="panel settings-section settings-theme-section">
        <div className="settings-section-heading"><span><Monitor size={19}/></span><div><h2>Tampilan</h2><p>Atur kenyamanan tampilan StudyFlow.</p></div></div>
        <label className="field-label settings-control-label">Tema aplikasi<select className="form-control" value={pengaturan.theme || 'light'} onChange={(event) => ubahPengaturan('theme', event.target.value)}><option value="light">Terang</option><option value="dark">Gelap</option><option value="system">Sistem</option></select></label>
      </section>

      <section className="panel settings-section settings-notification-section">
        <div className="settings-section-heading"><span><Bell size={19}/></span><div><h2>Notifikasi</h2><p>Atur pemberitahuan di aplikasi.</p></div></div>
        <label className="settings-toggle"><span><strong>Notifikasi aplikasi</strong><small>Tampilkan pemberitahuan saat kamu berinteraksi dengan StudyFlow.</small></span><input type="checkbox" checked={pengaturan.notifications !== false} onChange={(event) => ubahPengaturan('notifications', event.target.checked)}/></label>
      </section>

      <section className="panel settings-section settings-focus-section">
        <div className="settings-section-heading"><span><Timer size={19}/></span><div><h2>Pengaturan Focus Mode</h2><p>Atur durasi sesi fokus dan waktu istirahat.</p></div></div>
        <div className="settings-form-grid settings-focus-grid">
          <label className="field-label">Fokus (menit)<input className="form-control" type="number" min="1" max="90" value={pengaturan.focusMinutes || 25} onChange={(event) => ubahPengaturan('focusMinutes', Math.min(90, Math.max(1, Number(event.target.value))))} /></label>
          <label className="field-label">Istirahat pendek<input className="form-control" type="number" min="1" max="30" value={pengaturan.shortBreak || 5} onChange={(event) => ubahPengaturan('shortBreak', Math.min(30, Math.max(1, Number(event.target.value))))} /></label>
          <label className="field-label">Istirahat panjang<input className="form-control" type="number" min="1" max="60" value={pengaturan.longBreak || 15} onChange={(event) => ubahPengaturan('longBreak', Math.min(60, Math.max(1, Number(event.target.value))))} /></label>
        </div>
      </section>

      <section className="panel settings-section settings-data-section">
        <div className="settings-section-heading"><span><Database size={19}/></span><div><h2>Manajemen Data</h2><p>Data belajar akun ini disimpan di browser yang sedang digunakan.</p></div></div>
        <div className="settings-data-action"><div><strong>Hapus semua data belajar</strong><small>Tugas, catatan, mata pelajaran, pengingat, dan riwayat fokus.</small></div><button className="danger-button" onClick={onReset}><Trash2 size={17}/>Hapus semua data</button></div>
      </section>
    </div>
  </div>
}
