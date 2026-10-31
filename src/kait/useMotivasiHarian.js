import { useEffect, useState } from 'react'
import { daftarMotivasiHarian } from '../data/motivasiHarian.js'

const MILIDETIK_PER_HARI = 24 * 60 * 60 * 1000

function pilihMotivasiHarian(tanggal) {
  // Titik awal tetap membuat motivasi yang sama tampil di hari lokal yang sama.
  const hariIni = Date.UTC(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate())
  const hariPertama = Date.UTC(2026, 0, 1)
  const selisihHari = Math.floor((hariIni - hariPertama) / MILIDETIK_PER_HARI)
  const indeks = ((selisihHari % daftarMotivasiHarian.length) + daftarMotivasiHarian.length) % daftarMotivasiHarian.length
  return daftarMotivasiHarian[indeks]
}

export function useMotivasiHarian() {
  const [tanggalSekarang, aturTanggalSekarang] = useState(() => new Date())

  useEffect(() => {
    const sekarang = new Date()
    const tengahMalamBerikutnya = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate() + 1)
    const waktuTunggu = Math.max(1, tengahMalamBerikutnya.getTime() - sekarang.getTime())
    const pengaturWaktu = window.setTimeout(() => aturTanggalSekarang(new Date()), waktuTunggu)

    return () => window.clearTimeout(pengaturWaktu)
  }, [tanggalSekarang])

  return pilihMotivasiHarian(tanggalSekarang)
}
