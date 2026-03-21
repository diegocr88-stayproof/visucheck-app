import { useNavigate } from 'react-router-dom'

export default function Logo({ size = 'md', light = false }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const navigate = useNavigate()

  const sizes = {
    sm: { mark: 28, font: '16px', radius: '6px' },
    md: { mark: 36, font: '20px', radius: '8px' },
    lg: { mark: 44, font: '26px', radius: '10px' },
  }
  const s = sizes[size]

  return (
    <div
      onClick={() => navigate('/')}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textDecoration: 'none' }}
    >
      <div style={{
        width: s.mark, height: s.mark,
        background: light ? 'rgba(255,255,255,0.15)' : 'var(--navy)',
        borderRadius: s.radius,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
        border: light ? '1px solid rgba(255,255,255,0.2)' : 'none',
      }}>
        <div style={{
          position: 'absolute', bottom: '-4px', right: '-4px',
          width: s.mark * 0.5, height: s.mark * 0.5,
          background: 'var(--green)', borderRadius: '4px',
        }} />
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ position: 'relative', zIndex: 1 }}>
          <path d="M3 5h12M3 9h8M3 13h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="15" cy="13" r="2" fill="white"/>
        </svg>
      </div>
      <span style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: s.font,
        fontWeight: 800,
        color: light ? 'white' : 'var(--navy)',
        letterSpacing: '-0.5px',
      }}>
        Visu<span style={{ color: 'var(--green)' }}>Check</span>
      </span>
    </div>
  )
}