import { useEffect, useState } from 'react'

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

  useEffect(() => {
    try {
      localStorage.setItem(kunci, JSON.stringify(nilai))
    } catch {
      // Jika penyimpanan penuh atau mati, sesi tetap dapat digunakan.
    }
  }, [kunci, nilai])

  return [nilai, aturNilai]
}
