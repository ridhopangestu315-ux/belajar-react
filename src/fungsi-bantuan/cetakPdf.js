function aman(teks) {
  return String(teks ?? '').replace(/[&<>"']/g, (karakter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[karakter])
}

function nilai(teks) {
  return aman(teks).replace(/\r?\n/g, '<br>')
}

export function cetakLaporanPdf({ judul, namaPengguna, bagian, kosong = false }) {
  const jendelaCetak = window.open('', '_blank')
  if (!jendelaCetak) return false
  jendelaCetak.opener = null
  const waktuCetak = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())
  jendelaCetak.document.open()
  jendelaCetak.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${aman(judul)}</title><style>
    @page{size:A4;margin:18mm 16mm 20mm;@bottom-right{content:"Halaman " counter(page) " dari " counter(pages);font:9pt Arial,sans-serif;color:#78665d}}
    *{box-sizing:border-box}body{margin:0;color:#30231e;font:10.5pt/1.55 Arial,sans-serif;background:#fff}header{border-bottom:3px solid #9d2818;padding:0 0 13px;margin-bottom:18px}header:before{content:"STUDYFLOW";display:block;color:#9d2818;letter-spacing:2px;font-weight:700;font-size:9pt;margin-bottom:7px}h1{font-size:22pt;line-height:1.2;margin:0 0 12px;color:#762113}header p{margin:3px 0;color:#6c5b53;font-size:9.5pt}.empty{padding:22px;border:1px solid #ead8ce;border-radius:10px;background:#fff8f3;color:#705e55;text-align:center}.task{border:1px solid #eadbd3;border-radius:9px;margin:0 0 11px;padding:12px;break-inside:avoid}.task h2,.note h2,.activity h2{font-size:13pt;margin:0 0 8px;color:#812717}.meta{display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;margin-top:8px;font-size:9.5pt}.label{font-weight:700;color:#65483d}.description{white-space:pre-wrap;overflow-wrap:anywhere}.note{border-bottom:1px solid #eadbd3;padding:0 0 15px;margin:0 0 15px}.note h2{break-after:avoid}.note-content{white-space:pre-wrap;overflow-wrap:anywhere;orphans:3;widows:3}.note-dates{margin-top:10px;color:#78665d;font-size:9pt}.activity{border:1px solid #eadbd3;border-radius:9px;margin:0 0 11px;padding:12px;break-inside:avoid}.empty,.task,.note,.activity{print-color-adjust:exact;-webkit-print-color-adjust:exact} @media screen{body{max-width:210mm;margin:24px auto;padding:20px;box-shadow:0 2px 25px #0002}header{margin-top:8px}} @media print{body{max-width:none}}
    </style></head><body><header><h1>${aman(judul)}</h1><p>Nama pengguna: <strong>${aman(namaPengguna || 'Pengguna StudyFlow')}</strong></p><p>Dicetak: ${aman(waktuCetak)}</p></header>${kosong ? '<div class="empty">Belum ada data untuk diekspor.</div>' : bagian}</body></html>`)
  jendelaCetak.document.close()
  window.setTimeout(() => {
    if (!jendelaCetak.closed) {
      jendelaCetak.focus()
      jendelaCetak.print()
    }
  }, 350)
  return true
}

export { aman as escapeHtmlPdf, nilai as teksPdf }
