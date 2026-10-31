import { Sparkles, Trash2 } from 'lucide-react'

export function SettingsPage({ settings, setSettings, onReset }) {
  const defaults = { name:'', educationLevel:'', classLevel:'', institution:'', theme:'light', focusMinutes:25, shortBreak:5, longBreak:15 }
  const educationOptions = ['SMP', 'SMA', 'SMK', 'Perguruan Tinggi', 'Belajar Mandiri', 'Lainnya']
  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }))
  }
  function resetSettings() {
    setSettings(defaults)
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
        <div className="settings-buttons"><button className="secondary-button" onClick={resetSettings}>Kembalikan pengaturan default</button><button className="danger-button" onClick={onReset}><Trash2 size={17} />Hapus semua data</button></div>
      </section>
      <aside className="panel settings-tip"><span className="focus-side-icon"><Sparkles size={20} /></span><h2>Belajar dengan caramu</h2><p>Informasi jenjang dan institusi bersifat opsional. StudyFlow tetap bisa digunakan untuk belajar mandiri.</p></aside>
    </div>
  </>
}
