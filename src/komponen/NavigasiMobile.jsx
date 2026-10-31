import { Check, Clock3, GraduationCap, Search, Sparkles } from 'lucide-react'

export default function NavigasiMobile({ halamanAktif, onNavigate }) {
  const items = [{ page:'Dashboard', label:'Dasbor', icon:Sparkles }, { page:'Tugas', label:'Tugas', icon:Check }, { page:'Focus Mode', label:'Fokus', icon:Clock3 }, { page:'Catatan', label:'Catatan', icon:Search }, { page:'Mata Pelajaran', label:'Pelajaran', icon:GraduationCap }]
  return <nav className="mobile-bottom-nav" aria-label="Navigasi utama">{items.map(({ page, label, icon:Icon }) => <button key={page} className={`mobile-nav-item ${halamanAktif === page ? 'active' : ''} ${page === 'Focus Mode' ? 'focus-nav-item' : ''}`} onClick={() => onNavigate(page)} aria-current={halamanAktif === page ? 'page' : undefined}><span className="mobile-nav-icon"><Icon size={19}/></span><span className="mobile-nav-label">{label}</span></button>)}</nav>
}
