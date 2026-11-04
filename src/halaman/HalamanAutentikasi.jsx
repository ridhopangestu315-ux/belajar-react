import { useState } from 'react'
import { ArrowRight, LoaderCircle, LockKeyhole } from 'lucide-react'
import InputPassword from '../komponen/InputPassword.jsx'

const logoStudyFlow = `${import.meta.env.BASE_URL}assets/logo-studyflow.png`

export default function HalamanAutentikasi({ onBerhasilMasuk, tampilkanNotifikasi, csrfToken }) {
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
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ name: nama, email, password }),
      })
      let hasil
      try {
        hasil = await respons.json()
      } catch {
        throw new Error('Permintaan belum dapat diproses. Coba lagi beberapa saat.')
      }
      if (!respons.ok || !hasil.berhasil) throw new Error(hasil.pesan || 'Permintaan belum berhasil. Coba lagi.')
      tampilkanNotifikasi(hasil.pesan, 'success')
      onBerhasilMasuk(hasil.user, hasil.csrfToken)
    } catch (kesalahan) {
      tampilkanNotifikasi(kesalahan instanceof TypeError
        ? 'Koneksi ke server gagal. Coba lagi beberapa saat.'
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
    <section className={`auth-card ${sedangDaftar ? 'auth-card-register' : 'auth-card-login'}`} aria-labelledby="judul-autentikasi">
      <div className="auth-brand"><span className="auth-logo"><img src={logoStudyFlow} alt=""/></span><span>StudyFlow</span></div>
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
        <label className={`auth-field ${!sedangDaftar ? 'auth-login-password' : ''}`}>
          <span>Kata sandi</span>
          <InputPassword key={mode} name="password" value={password} onChange={(event) => aturPassword(event.target.value)} autoComplete={sedangDaftar ? 'new-password' : 'current-password'} minLength={sedangDaftar ? 8 : undefined} maxLength={72} required placeholder={sedangDaftar ? 'Minimal 8 karakter' : 'Masukkan kata sandi'} />
        </label>
        <aside className="auth-password-note" role="note">
          <LockKeyhole size={16} aria-hidden="true"/>
          <span>{sedangDaftar ? 'Fitur lupa kata sandi belum tersedia. Simpan dan ingat kata sandi yang kamu buat.' : 'Fitur lupa kata sandi belum ada, inget2 yak passwordnya 🗿'}</span>
        </aside>
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
