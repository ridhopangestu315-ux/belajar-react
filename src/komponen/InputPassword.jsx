import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function InputPassword({ controlClassName = '', inputClassName, ...inputProps }) {
  const [terlihat, aturTerlihat] = useState(false)

  return <span className={`auth-password-control ${controlClassName}`}>
    <input {...inputProps} className={inputClassName} type={terlihat ? 'text' : 'password'} />
    <button className="auth-password-toggle" type="button" aria-label={terlihat ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={terlihat} onMouseDown={(event) => event.preventDefault()} onClick={() => aturTerlihat((nilai) => !nilai)}>{terlihat ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
  </span>
}
