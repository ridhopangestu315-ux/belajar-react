import AvatarProfil from './AvatarProfil.jsx'
import { BookOpen, CalendarDays, CheckSquare, ChevronLeft, Clock3, LayoutDashboard, NotebookPen, Settings, Bell, ChartNoAxesColumnIncreasing } from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Mata Pelajaran', icon: BookOpen },
  { label: 'Tugas', icon: CheckSquare },
  { label: 'Kalender', icon: CalendarDays },
  { label: 'Catatan', icon: NotebookPen },
  { label: 'Focus Mode', icon: Clock3 },
  { label: 'Progress Belajar', icon: ChartNoAxesColumnIncreasing },
  { label: 'Pengingat', icon: Bell },
  { label: 'Pengaturan', icon: Settings },
]

export default function BilahSamping({ halamanAktif, onNavigate, isOpen, onClose, userName = '', userSummary = 'Ruang belajarmu', userPhoto = '', onProfileClick }) {
  return <>
    {isOpen && <button className="sidebar-scrim" aria-label="Tutup navigasi" onClick={onClose} />}
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-logo-wrap"><img className="brand-logo" src="/assets/logo-studyflow.png" alt=""/></span><span>Study<span className="brand-accent">Flow</span></span><button className="mobile-close" aria-label="Tutup menu" onClick={onClose}><ChevronLeft size={20}/></button></div>
      <p className="nav-caption">MENU UTAMA</p>
      <nav>{menuItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-link ${halamanAktif === label ? 'active' : ''}`} onClick={() => { onNavigate(label); onClose() }}><Icon size={19} strokeWidth={1.8}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-note"><strong>Nggak harus sempurna, yang penting konsisten. {'\u2728'}</strong><span>Small progress is still progress.</span></div>
      <div className="sidebar-profile"><AvatarProfil name={userName} photo={userPhoto} onClick={onProfileClick}/><div><strong>{userName || 'StudyFlow'}</strong><span>{userSummary}</span></div><span className="online-dot"/></div>
    </aside>
  </>
}
