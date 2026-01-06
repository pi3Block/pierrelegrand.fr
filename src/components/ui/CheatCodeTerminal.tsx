import { useState, useRef, useEffect } from 'react'

interface CheatCodeTerminalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (code: string) => void
  isLoading: boolean
  error: string | null
  success: string | null
}

export function CheatCodeTerminal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  success,
}: CheatCodeTerminalProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setInput('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSubmit(input.trim())
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Terminal */}
      <div className="terminal-overlay">
        <div style={{ marginBottom: '16px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
          ENTREZ VOTRE CODE
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="CODE_SECRET"
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />
        </form>

        {isLoading && (
          <div className="terminal-message" style={{ color: 'var(--color-primary)' }}>
            Validation...
          </div>
        )}

        {error && <div className="terminal-message error">{error}</div>}

        {success && <div className="terminal-message success">{success}</div>}

        <div
          style={{
            marginTop: '16px',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            opacity: 0.6,
          }}
        >
          ESC pour fermer
        </div>
      </div>
    </>
  )
}
