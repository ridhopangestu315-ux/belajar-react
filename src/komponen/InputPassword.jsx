import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function InputPassword({ controlClassName = '', inputClassName, ...inputProps }) {
  const [desktop, aturDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches)
  const [terlihat, aturTerlihat] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const perbaruiUkuran = () => {
      aturDesktop(mediaQuery.matches)
      if (!mediaQuery.matches) aturTerlihat(false)
    }
    perbaruiUkuran()
    mediaQuery.addEventListener('change', perbaruiUkuran)
    return () => mediaQuery.removeEventListener('change', perbaruiUkuran)
  }, [])

  return <span className={`auth-password-control ${controlClassName}`}>
    <input {...inputProps} className={inputClassName} type={desktop && terlihat ? 'text' : 'password'} />
    {desktop && <button className="auth-password-toggle" type="button" aria-label={terlihat ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={terlihat} onMouseDown={(event) => event.preventDefault()} onClick={() => aturTerlihat((nilai) => !nilai)}>{terlihat ? <EyeOff size={19}/> : <Eye size={19}/>}</button>}
  </span>
}
