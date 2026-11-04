import { useCallback, useEffect, useRef, useState } from 'react'

// Menyimpan nilai di React dan LocalStorage agar tetap ada setelah halaman dimuat ulang.
// Mengambil data tersimpan, memeriksa jenisnya, lalu menjaga state tetap sinkron.
export function usePenyimpananLokal(kunci, nilaiAwal) {
  const [nilai, aturNilai] = useState(() => {
    try {
      const nilaiTersimpan = localStorage.getItem(kunci)
      if (nilaiTersimpan === null) return nilaiAwal
      const nilaiTerurai = JSON.parse(nilaiTersimpan)
      if (Array.isArray(nilaiAwal) && !Array.isArray(nilaiTerurai)) return nilaiAwal
      if (nilaiAwal && typeof nilaiAwal === 'object' && !Array.isArray(nilaiAwal) && (!nilaiTerurai || typeof nilaiTerurai !== 'object' || Array.isArray(nilaiTerurai))) return nilaiAwal
      if (typeof nilaiAwal === 'number' && (typeof nilaiTerurai !== 'number' || !Number.isFinite(nilaiTerurai))) return nilaiAwal
      if (typeof nilaiAwal === 'boolean' && typeof nilaiTerurai !== 'boolean') return nilaiAwal
      if (typeof nilaiAwal === 'string' && typeof nilaiTerurai !== 'string') return nilaiAwal
      return nilaiTerurai
    } catch {
      return nilaiAwal
    }
  })

  // Kunci lokal adalah cache per akun. Nilai server selalu dimuat lebih dulu
  // dan menjadi otoritatif; cache lama hanya dikirim saat server belum punya data.
  const jenisServer = kunci.replace(/^studyflow_user_\d+_/, 'studyflow_')
  const jenisDidukung = /^studyflow_(tasks|subjects|courses|notes|reminders|activities|settings|profile_photo|focus_history|focus_sessions)$/.test(jenisServer)
  const [siapServer, aturSiapServer] = useState(!jenisDidukung)
  const [nomorPerubahan, aturNomorPerubahan] = useState(0)
  const dirty = useRef(false)
  const nilaiRef = useRef(nilai)

  useEffect(() => { nilaiRef.current = nilai }, [nilai])

  const aturNilaiDenganSinkronisasi = useCallback((pembaruan) => {
    dirty.current = true
    aturNomorPerubahan((nomor) => nomor + 1)
    aturNilai(pembaruan)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(kunci, JSON.stringify(nilai))
    } catch {
      // Jika penyimpanan penuh atau mati, sesi tetap dapat digunakan.
    }
  }, [kunci, nilai])

  useEffect(() => {
    if (!jenisDidukung) return undefined
    let aktif = true
    const bacaServer = async (awal = false) => {
      const pemuatanAwal = awal || !siapServer
      try {
        const respons = await fetch('/api/data.php', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
        const hasil = await respons.json()
        if (!respons.ok || !hasil.berhasil || !hasil.data) throw new Error('Penyimpanan server tidak tersedia.')
        if (!aktif) return
        if (Object.prototype.hasOwnProperty.call(hasil.data, jenisServer)) {
          const dariServer = hasil.data[jenisServer]
          if (pemuatanAwal || !dirty.current) {
            aturNilai(dariServer)
            nilaiRef.current = dariServer
            dirty.current = false
          }
        } else if (pemuatanAwal) {
          // Migrasi lokal satu kali hanya ketika akun belum memiliki nilai server.
          const simpan = await fetch('/api/data.php', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': window.studyflowCsrfToken || '' },
            body: JSON.stringify({ data: { [jenisServer]: nilaiRef.current }, migrasi: true }),
          })
          if (!simpan.ok) throw new Error('Migrasi data lokal gagal.')
        }
        if (pemuatanAwal && aktif) aturSiapServer(true)
      } catch (kesalahan) {
        if (pemuatanAwal && aktif) {
          // Jangan mengunggah cache ke server saat pembacaan awal gagal.
          aturSiapServer(false)
          window.dispatchEvent(new CustomEvent('studyflow:sync-error', { detail: kesalahan.message }))
        }
      }
    }
    void bacaServer(true)
    const polling = window.setInterval(() => { void bacaServer(false) }, 30_000)
    const saatFokus = () => { if (document.visibilityState === 'visible') void bacaServer(false) }
    document.addEventListener('visibilitychange', saatFokus)
    return () => { aktif = false; window.clearInterval(polling); document.removeEventListener('visibilitychange', saatFokus) }
  }, [jenisDidukung, jenisServer, siapServer])

  useEffect(() => {
    if (!jenisDidukung || !siapServer || !dirty.current) return undefined
    let aktif = true
    const jeda = window.setTimeout(async () => {
      const snapshot = nilaiRef.current
      try {
        const respons = await fetch('/api/data.php', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': window.studyflowCsrfToken || '' },
          body: JSON.stringify({ data: { [jenisServer]: snapshot } }),
        })
        const hasil = await respons.json()
        if (!respons.ok || !hasil.berhasil) throw new Error(hasil.pesan || 'Data belum tersimpan ke server.')
        if (aktif && nilaiRef.current === snapshot) dirty.current = false
      } catch (kesalahan) {
        window.dispatchEvent(new CustomEvent('studyflow:sync-error', { detail: kesalahan.message }))
      }
    }, 350)
    return () => { aktif = false; window.clearTimeout(jeda) }
  }, [jenisDidukung, jenisServer, siapServer, nomorPerubahan])

  return [nilai, aturNilaiDenganSinkronisasi]
}
