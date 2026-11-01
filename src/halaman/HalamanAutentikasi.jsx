import { useState } from 'react'
import { ArrowRight, BookOpen, LoaderCircle } from 'lucide-react'

const logoStudyFlow = `${import.meta.env.BASE_URL}assets/logo-studyflow.png`

export default function HalamanAutentikasi({ onBerhasilMasuk, tampilkanNotifikasi }) {
  const [mode, aturMode] = useState('login')
  const [nama, aturNama] = useState('')
  const [email, aturEmail] = useState('')
  const [password, aturPassword] = useState('')
  const [sedangMengirim, aturSedangMengirim] = useState(false)
  const sedangDaftar = mode === 'register'

  async function kirimFormulir(event) {
    event.preventDefault()
    aturSedangMengirim(true)
    try {
      const respons = await fetch(`/api/auth/${sedangDaftar ? 'register' : 'login'}.php`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: nama, email, password }),
      })
      const hasil = await respons.json()
      if (!respons.ok || !hasil.berhasil) throw new Error(hasil.pesan || 'Permintaan belum berhasil. Coba lagi.')
      tampilkanNotifikasi(hasil.pesan, 'success')
      onBerhasilMasuk(hasil.user)
    } catch (kesalahan) {
      tampilkanNotifikasi(kesalahan instanceof TypeError
        ? 'Tidak dapat terhubung ke server. Pastikan PHP dan MySQL sedang berjalan.'
        : kesalahan.message, 'error')
    } finally {
      aturSedangMengirim(false)
    }
  }

  function ubahMode() {
    aturMode((sebelumnya) => sebelumnya === 'login' ? 'register' : 'login')
    aturPassword('')
  }

  return <main className="auth-screen">
    <section className="auth-card" aria-labelledby="judul-autentikasi">
      <div className="auth-brand"><span className="auth-logo"><img src={logoStudyFlow} alt=""/></span><span>StudyFlow</span></div>
      <div className="auth-intro-icon"><BookOpen size={22}/></div>
      <p className="auth-eyebrow">RUANG BELAJAR PRIBADIMU</p>
      <h1 id="judul-autentikasi">{sedangDaftar ? 'Mulai perjalanan belajarmu' : 'Senang melihatmu kembali'}</h1>
      <p className="auth-description">{sedangDaftar ? 'Buat akun untuk menyimpan ruang belajarmu.' : 'Masuk untuk melanjutkan rencana belajarmu.'}</p>

      <form className="auth-form" onSubmit={kirimFormulir}>
        {sedangDaftar && <label className="auth-field">
          <span>Nama</span>
          <input type="text" name="name" value={nama} onChange={(event) => aturNama(event.target.value)} autoComplete="name" maxLength={100} required placeholder="Nama lengkap" />
        </label>}
        <label className="auth-field">
          <span>Email</span>
          <input type="email" name="email" value={email} onChange={(event) => aturEmail(event.target.value)} autoComplete="email" maxLength={254} required placeholder="nama@email.com" />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input type="password" name="password" value={password} onChange={(event) => aturPassword(event.target.value)} autoComplete={sedangDaftar ? 'new-password' : 'current-password'} minLength={sedangDaftar ? 8 : undefined} maxLength={72} required placeholder={sedangDaftar ? 'Minimal 8 karakter' : 'Masukkan password'} />
        </label>
        <button className="auth-submit" type="submit" disabled={sedangMengirim}>
          {sedangMengirim ? <><LoaderCircle className="auth-spinner" size={18}/> Memproses...</> : <>{sedangDaftar ? 'Buat akun' : 'Masuk'} <ArrowRight size={18}/></>}
        </button>
      </form>

      <p className="auth-switch">{sedangDaftar ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
        <button type="button" onClick={ubahMode} disabled={sedangMengirim}>{sedangDaftar ? 'Masuk' : 'Daftar sekarang'}</button>
      </p>
      <p className="auth-footnote">Satu langkah kecil hari ini, kemajuan besar esok hari.</p>
    </section>
  </main>
}
