import { useState, useEffect } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    return id
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, addToast, removeToast }
}

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ id, message, type = 'success', onClose }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onClose?.(id), 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [id, onClose])

  const colors = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-eng-600 text-white',
  }

  const icons = { success: '\u2713', error: '\u2717', info: '\u2139' }

  return (
    <div
      className={`${colors[type]} px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 min-w-[220px] max-w-sm ${exiting ? 'opacity-0 translate-y-[-10px]' : ''}`}
      role="alert"
    >
      <span className="text-base font-bold">{icons[type]}</span>
      <span className="truncate">{message}</span>
      <button
        onClick={() => onClose?.(id)}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
