import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Logo from '../components/Logo'

export default function Welcome() {
  const navigate = useNavigate()
  const [name, setName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const fullName = data.user?.user_metadata?.full_name
        || data.user?.email?.split('@')[0]
        || 'usuário'
      setName(fullName)
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,204,138,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-100px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(11,45,82,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'white', borderRadius: '24px', padding: '56px 48px',
        width: '100%', maxWidth: '520px', textAlign: 'center',
        boxShadow: '0 24px 80px rgba(11,45,82,0.12), 0 0 0 1px rgba(11,45,82,0.06)',
        position: 'relative', zIndex: 1,
        animation: 'fadeInUp 0.5s ease both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <Logo size="lg" />
        </div>

        {/* Checkmark animation */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'var(--green-glow)', border: '2px solid rgba(46,204,138,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px', fontSize: '36px',
          animation: 'fadeInUp 0.5s 0.1s ease both',
        }}>
          🎉
        </div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800,
          color: 'var(--navy)', marginBottom: '12px', letterSpacing: '-0.5px',
          animation: 'fadeInUp 0.5s 0.2s ease both',
        }}>
          Olá, {name}!
        </h1>

        <p style={{
          fontSize: '16px', lineHeight: 1.7, color: 'var(--muted)',
          marginBottom: '40px', animation: 'fadeInUp 0.5s 0.3s ease both',
        }}>
          Sua conta foi criada com sucesso.<br />
          Bem-vindo ao <strong style={{ color: 'var(--navy)' }}>VisuCheck</strong> — suas vistorias mais inteligentes começam agora.
        </p>

        {/* Feature highlights */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
          marginBottom: '40px', animation: 'fadeInUp 0.5s 0.4s ease both',
        }}>
          {[
            { icon: '🏠', text: 'Cadastre seus imóveis' },
            { icon: '📸', text: 'Fotografe os ambientes' },
            { icon: '🤖', text: 'IA compara e detecta diferenças' },
            { icon: '📋', text: 'Relatório em PDF automático' },
          ].map(item => (
            <div key={item.text} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '10px',
              background: 'var(--cream)', textAlign: 'left',
            }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '14px', color: 'var(--navy)', fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            fontSize: '15px', fontWeight: 600,
            background: 'var(--green)', color: 'var(--navy)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 16px rgba(46,204,138,0.35)',
            transition: 'all 0.2s',
            animation: 'fadeInUp 0.5s 0.5s ease both',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          Ir para o Dashboard →
        </button>
      </div>
    </div>
  )
}