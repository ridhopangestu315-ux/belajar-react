import { Check, Clock3, GraduationCap, Search, Sparkles } from 'lucide-react'

export default function NavigasiMobile({ halamanAktif, onNavigate }) {
  const items = [{ page:'Dashboard', label:'Dasbor', icon:Sparkles }, { page:'Tugas', label:'Tugas', icon:Check }, { page:'Focus Mode', label:'Fokus', icon:Clock3 }, { page:'Catatan', label:'Catatan', icon:Search }, { page:'Mata Pelajaran', label:'Pelajaran', icon:GraduationCap }]
  return <nav className="mobile-bottom-nav" aria-label="Navigasi utama">{items.map(({ page, label, icon:Icon }) => <button key={page} className={halamanAktif === page ? 'active' : ''} onClick={() => onNavigate(page)} aria-current={halamanAktif === page ? 'page' : undefined}><Icon size={19}/><span>{label}</span></button>)}</nav>
}
