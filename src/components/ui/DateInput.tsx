import { useEffect, useRef, useState } from 'react'
import { formatDate } from '@/utils/date'

/** Chuyển dd/mm/yyyy → yyyy-mm-dd */
function toIso(display: string): string {
  const [d, m, y] = display.split('/')
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function isValidDisplay(v: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(v) && !isNaN(Date.parse(toIso(v)))
}

interface DateInputProps {
  value: string          // iso yyyy-mm-dd
  onChange: (iso: string) => void
  className?: string
  placeholder?: string
}

export default function DateInput({ value, onChange, className = '', placeholder }: DateInputProps) {
  const [display, setDisplay] = useState(formatDate(value))
  const hiddenRef = useRef<HTMLInputElement>(null)

  // Sync khi value thay đổi từ bên ngoài (ví dụ reset form)
  useEffect(() => {
    setDisplay(formatDate(value))
  }, [value])

  function handleDisplayChange(text: string) {
    // Auto-insert / khi gõ
    const digits = text.replace(/\D/g, '')
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8)

    setDisplay(formatted)

    if (isValidDisplay(formatted)) {
      onChange(toIso(formatted))
    } else if (formatted === '') {
      onChange('')
    }
  }

  function handleBlur() {
    // Nếu user nhập chưa đúng thì revert
    if (display && !isValidDisplay(display)) {
      setDisplay(formatDate(value))
    }
  }

  function openNativePicker() {
    hiddenRef.current?.showPicker?.()
  }

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => handleDisplayChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder ?? 'dd/mm/yyyy'}
        maxLength={10}
        className={`w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      />
      {/* Calendar icon to open native picker */}
      <button
        type="button"
        tabIndex={-1}
        onClick={openNativePicker}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      {/* Hidden native date input for picker */}
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={handleNativeChange}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  )
}
