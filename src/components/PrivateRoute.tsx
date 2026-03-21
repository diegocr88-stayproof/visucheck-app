import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAllowed(true)
      } else {
        navigate('/login')
      }
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: 'var(--navy)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 1.5s ease infinite',
        }}>
          <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
            <path d="M3 5h12M3 9h8M3 13h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="15" cy="13" r="2" fill="#2ECC8A"/>
          </svg>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Verificando acesso...</p>
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}