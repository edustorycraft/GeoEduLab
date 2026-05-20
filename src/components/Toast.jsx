import React from 'react'

export default function Toast({ id, message, type = 'success', onClose }) {
  const [visible, setVisible] = React.useState(true)
  const [exiting, setExiting] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => {
        setVisible(false)
        onClose?.(id)
      }, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [id, onClose])

  const colors = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-eng-600 text-white',
  }

  const icons = { success: '\u2713', error: '\u2717', info: '\u2139' }

  return visible ? (
    <div
      className={`${colors[type]} px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 min-w-[240px] max-w-md transition-all duration-300 ${exiting ? 'opacity-0 translate-y-[-10px]' : 'opacity-100 translate-y-0'}`}
      role="alert"
    >
      <span className="text-lg">{icons[type]}</span>
      <span>{message}</span>
    </div>
  ) : null
}
