// Mengubah tanggal menjadi kunci YYYY-MM-DD berdasarkan waktu lokal.
export function ubahKeKunciTanggalLokal(tanggal = new Date()) {
  const tahun = tanggal.getFullYear()
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0')
  const hari = String(tanggal.getDate()).padStart(2, '0')
  return `${tahun}-${bulan}-${hari}`
}

// Menambahkan sejumlah hari tanpa menggeser tanggal akibat zona waktu.
export function tambahHariLokal(tanggal, jumlahHari) {
  const tanggalHasil = new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate())
  tanggalHasil.setDate(tanggalHasil.getDate() + jumlahHari)
  return tanggalHasil
}

export function ubahDariKunciTanggalLokal(kunciTanggal) {
  const [tahun, bulan, hari] = kunciTanggal.split('-').map(Number)
  return new Date(tahun, bulan - 1, hari)
}

// Mengambil daftar kunci tanggal untuk beberapa hari terakhir.
export function ambilKunciTanggalTerbaru(tanggalAkhir = new Date(), jumlahHari = 7) {
  return Array.from({ length: jumlahHari }, (_, indeks) => ubahKeKunciTanggalLokal(tambahHariLokal(tanggalAkhir, indeks - jumlahHari + 1)))
}

export function hitungSelisihHariLokal(kunciAwal, kunciAkhir) {
  const bagianAwal = kunciAwal.split('-').map(Number)
  const bagianAkhir = kunciAkhir.split('-').map(Number)
  return Math.round((Date.UTC(bagianAkhir[0], bagianAkhir[1] - 1, bagianAkhir[2]) - Date.UTC(bagianAwal[0], bagianAwal[1] - 1, bagianAwal[2])) / 86400000)
}
