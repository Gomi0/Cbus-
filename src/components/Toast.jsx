import { X } from 'lucide-react'
import { useToast } from '../context/ToastContext'

const styles = {
  success: 'bg-green-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  warning: 'bg-yellow-500',
}
const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }

export default function Toast() {
  const { toasts, remove } = useToast()
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`${styles[t.type]} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 min-w-64 max-w-sm pointer-events-auto`}
        >
          <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {icons[t.type]}
          </span>
          <span className="flex-1 text-sm">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-white/70 hover:text-white flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
