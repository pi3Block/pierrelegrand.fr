import { useState, useCallback, useEffect } from 'react'
import { validateCode } from '@api/codes'
import { useGameStore } from '@stores/gameStore'

export function useCheatCode() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const unlockFeatures = useGameStore((s) => s.unlockFeatures)

  // Listen for backtick key to open terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === 'Dead') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        setError(null)
        setSuccess(null)
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const submitCode = useCallback(
    async (code: string) => {
      if (!code.trim()) return

      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const result = await validateCode(code)

      if (result.valid && result.level !== undefined && result.features) {
        unlockFeatures(result.level, result.features)
        setSuccess(`Code activé ! Niveau ${result.level} débloqué.`)

        // Auto-close after success
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(null)
        }, 2000)
      } else {
        setError(result.error || 'Code invalide')
      }

      setIsLoading(false)
    },
    [unlockFeatures]
  )

  return {
    isOpen,
    setIsOpen,
    isLoading,
    error,
    success,
    submitCode,
  }
}
