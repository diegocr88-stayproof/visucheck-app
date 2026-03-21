import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <Navbar />
      <div style={{
        paddingTop: '120px', paddingBottom: '80px',
        paddingLeft: '48px', paddingRight: '48px',
        maxWidth: '1200px', margin: '0 auto',
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: '36px',
            fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px',
            marginBottom: '8px',
          }}>
            Meus Imóveis
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--muted)' }}>
            Gerencie suas propriedades e vistorias
          </p>
        </div>

        {/* Empty state */}
        <div style={{
          background: 'white', borderRadius: '20px',
          border: '1.5px dashed var(--border)',
          padding: '80px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
          <h3 style={{
            fontFamily: 'Syne, sans-serif', fontSize: '22px',
            fontWeight: 700, color: 'var(--navy)', marginBottom: '8px',
          }}>
            Nenhum imóvel cadastrado ainda
          </h3>
          <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '32px' }}>
            Adicione seu primeiro imóvel para começar a realizar vistorias
          </p>
          <button style={{
            padding: '13px 28px', borderRadius: '8px',
            fontSize: '15px', fontWeight: 600,
            background: 'var(--green)', color: 'var(--navy)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 16px rgba(46,204,138,0.35)',
          }}>
            + Adicionar imóvel
          </button>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              fontSize: '14px', color: 'var(--muted)',
              background: 'none', border: 'none',
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            ← Voltar para a página inicial
          </button>
        </div>
      </div>
    </div>
  )
}