const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface CodeResponse {
  valid: boolean
  level?: number
  features?: string[]
  error?: string
}

export async function validateCode(code: string): Promise<CodeResponse> {
  try {
    const response = await fetch(`${API_URL}/codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase() }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { valid: false, error: data.error || 'Code invalide' }
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    return { valid: false, error: 'Erreur de connexion au serveur' }
  }
}
