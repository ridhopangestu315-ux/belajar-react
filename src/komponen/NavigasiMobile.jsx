import { BookOpen, CheckSquare, Clock3, LayoutDashboard, NotebookPen } from 'lucide-react'

export default function NavigasiMobile({ halamanAktif, onNavigate }) {
  const items = [{ page:'Dashboard', label:'Dasbor', icon:LayoutDashboard }, { page:'Tugas', label:'Tugas', icon:CheckSquare }, { page:'Focus Mode', label:'Fokus', icon:Clock3 }, { page:'Catatan', label:'Catatan', icon:NotebookPen }, { page:'Mata Pelajaran', label:'Pelajaran', icon:BookOpen }]
  return <nav className="mobile-bottom-nav" aria-label="Navigasi utama">{items.map(({ page, label, icon:Icon }) => <button key={page} className={`mobile-nav-item ${halamanAktif === page ? 'active' : ''} ${page === 'Focus Mode' ? 'focus-nav-item' : ''}`} onClick={() => onNavigate(page)} aria-current={halamanAktif === page ? 'page' : undefined}><span className="mobile-nav-icon"><Icon size={19}/></span><span className="mobile-nav-label">{label}</span></button>)}</nav>
}
