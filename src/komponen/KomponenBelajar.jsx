import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, ChevronRight, Sparkles } from 'lucide-react'
import { hitungSelisihHariLokal, ubahKeKunciTanggalLokal } from '../fungsi-bantuan/tanggal.js'

export function KartuStatistik({ title, value, hint, icon, tone }) { return <article className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><span className="stat-title">{title}</span><strong className="stat-value">{value}</strong><span className="stat-hint">{hint}</span></div></article> }
export function HitungNaik({ value, active }) {
  const [displayValue, setDisplayValue] = useState(0)
  useEffect(() => {
    if (!active || value === 0) return undefined
    let frame
    const start = performance.now()
    const tick = (now) => {
      const percent = Math.min((now - start) / 650, 1)
      setDisplayValue(Math.round(value * percent))
      if (percent < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, value])
  return active ? displayValue : value
}
export function TampilanKosong({ text, actionLabel, onAction }) { return <div className="empty-state"><span className="empty-mark"><Sparkles size={18}/></span><p>{text}</p>{onAction && <button className="text-button empty-action" onClick={onAction}>{actionLabel}<ChevronRight size={15}/></button>}</div> }
export function BarisTugas({ task, onToggle }) {
  const tanggalHariIni = ubahKeKunciTanggalLokal()
  const late = task.deadline && task.deadline < tanggalHariIni
  const daysUntil = task.deadline ? hitungSelisihHariLokal(tanggalHariIni, task.deadline) : Infinity
  const soon = task.deadline && !late && daysUntil < 3
  return <div className={`task-row ${task.done ? 'task-done' : ''}`}><button className="check-button" aria-label={task.done ? 'Tandai belum selesai' : 'Tandai selesai'} onClick={() => onToggle(task.id)}>{task.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button><div className="task-main"><strong>{task.title}</strong><span>{task.subject || 'Tanpa mata pelajaran'} · <span className={late ? 'deadline-late' : soon ? 'deadline-soon' : ''}>{task.deadline ? new Date(`${task.deadline}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Tanpa deadline'}</span></span></div><span className={`priority priority-${(task.priority || 'sedang').toLowerCase()}`}>{task.priority || 'Sedang'}</span></div>
}
