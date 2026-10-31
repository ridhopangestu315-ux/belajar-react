export default function AvatarProfil({ name, photo, className = '', onClick }) {
  const initials = (name || 'S').trim().slice(0, 1).toUpperCase() || 'S'
  return <button type="button" className={`avatar avatar-trigger ${className}`} onClick={onClick} aria-label="Ubah foto profil" title="Ubah foto profil">
    {photo ? <img src={photo} alt="Foto profil" /> : initials}
  </button>
}
