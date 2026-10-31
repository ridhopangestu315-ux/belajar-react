export default function PengantarHalaman({ halaman, judul, deskripsi, Ikon, aksi }) {
  return <header className="page-intro">
    <p className="page-intro-breadcrumb">STUDYFLOW / {halaman.toUpperCase()}</p>
    <div className="page-intro-main">
      <span className="page-intro-icon" aria-hidden="true"><Ikon size={30} strokeWidth={1.8} /></span>
      <div className="page-intro-copy">
        <h1>{judul}</h1>
        <p>{deskripsi}</p>
      </div>
      {aksi && <div className="page-intro-action">{aksi}</div>}
    </div>
  </header>
}
