import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: '72px',
      background: 'rgba(244,246,249,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: scrolled ? '0 2px 24px rgba(11,45,82,0.1)' : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      <Logo size="md" />

      {isHome && (
        <ul style={{
          display: 'flex', alignItems: 'center', gap: '36px',
          listStyle: 'none', margin: 0, padding: 0,
        }}>
          {[
            { label: 'Como funciona', href: '#features' },
            { label: 'Recursos', href: '#recursos' },
            { label: 'Planos', href: '#pricing' },
          ].map(item => (
            <li key={item.label}>
              <a href={item.href} style={{
                fontSize: '14px', fontWeight: 500,
                color: 'var(--muted)', textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 22px', borderRadius: '8px',
            fontSize: '14px', fontWeight: 500,
            background: 'transparent', color: 'var(--navy)',
            border: 'none', cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(11,45,82,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          Entrar
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 22px', borderRadius: '8px',
            fontSize: '14px', fontWeight: 500,
            background: 'var(--navy)', color: 'white',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(11,45,82,0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--navy-mid)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--navy)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Começar grátis
        </button>
      </div>
    </nav>
  )
}