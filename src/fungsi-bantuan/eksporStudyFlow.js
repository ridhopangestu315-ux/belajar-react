import { cetakLaporanPdf, escapeHtmlPdf, teksPdf } from './cetakPdf.js'

function kartu(judul, isi, kelas = '') {
  return `<article class="${kelas}"><h2>${escapeHtmlPdf(judul)}</h2>${isi}</article>`
}

export function eksporTugasPdf({ pengguna, tugas }) {
  const bagian = tugas.map((item) => kartu(item.title || 'Tugas tanpa judul', `<div class="description">${teksPdf(item.description || 'Tidak ada deskripsi.')}</div><div class="meta"><div><span class="label">Mata pelajaran:</span> ${escapeHtmlPdf(item.subject || 'Tanpa mata pelajaran')}</div><div><span class="label">Deadline:</span> ${escapeHtmlPdf(item.deadline || 'Belum ditentukan')}</div><div><span class="label">Prioritas:</span> ${escapeHtmlPdf(item.priority || 'Sedang')}</div><div><span class="label">Status:</span> ${escapeHtmlPdf(item.status || (item.done ? 'Selesai' : 'Belum dikerjakan'))}</div></div>`, 'task')).join('')
  return cetakLaporanPdf({ judul: 'Laporan Tugas StudyFlow', namaPengguna: pengguna, bagian, kosong: tugas.length === 0 })
}

export function eksporCatatanPdf({ pengguna, catatan }) {
  const bagian = catatan.map((item) => kartu(item.title || 'Catatan tanpa judul', `<div class="note-content">${teksPdf(item.description || 'Catatan ini belum memiliki isi.')}</div><p class="note-dates">Dibuat: ${escapeHtmlPdf(item.createdAt || 'Tidak tersedia')} · Diperbarui: ${escapeHtmlPdf(item.updatedAt || item.createdAt || 'Tidak tersedia')}</p>`, 'note')).join('')
  return cetakLaporanPdf({ judul: 'Kumpulan Catatan StudyFlow', namaPengguna: pengguna, bagian, kosong: catatan.length === 0 })
}

export function eksporKegiatanPdf({ pengguna, kegiatan }) {
  const bagian = kegiatan.map((item) => kartu(item.title || 'Kegiatan tanpa judul', `<div class="description">${teksPdf(item.description || 'Tidak ada keterangan.')}</div><div class="meta"><div><span class="label">Mata pelajaran:</span> ${escapeHtmlPdf(item.subject || 'Tidak terkait')}</div><div><span class="label">Tanggal:</span> ${escapeHtmlPdf(item.date || 'Tidak ditentukan')}</div><div><span class="label">Waktu mulai:</span> ${escapeHtmlPdf(item.startTime || item.time || 'Tidak ditentukan')}</div><div><span class="label">Waktu selesai:</span> ${escapeHtmlPdf(item.endTime || 'Tidak ditentukan')}</div></div>`, 'activity')).join('')
  return cetakLaporanPdf({ judul: 'Laporan Kegiatan Belajar StudyFlow', namaPengguna: pengguna, bagian, kosong: kegiatan.length === 0 })
}
