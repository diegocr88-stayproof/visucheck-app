import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Home() {
  const navigate = useNavigate()
  const revealRefs = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.12 }
    )
    revealRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const addReveal = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <Navbar />

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'grid',
        gridTemplateColumns: '1fr 1fr', alignItems: 'center',
        padding: '120px 48px 80px', gap: '64px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '-80px', right: '-120px',
            width: '600px', height: '600px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46,204,138,0.12) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-100px', left: '-80px',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(11,45,82,0.08) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(11,45,82,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(11,45,82,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
        </div>

        {/* Left content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '100px',
            background: 'var(--green-glow)',
            border: '1px solid rgba(46,204,138,0.3)',
            fontSize: '13px', fontWeight: 500, color: 'var(--green-dark)',
            marginBottom: '28px',
            animation: 'fadeInUp 0.6s ease both',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--green)', animation: 'pulse 2s ease infinite',
            }} />
            Tecnologia de IA para vistorias imobiliárias
          </div>

          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 800,
            lineHeight: 1.08, letterSpacing: '-2px', color: 'var(--navy)',
            marginBottom: '24px', animation: 'fadeInUp 0.6s 0.1s ease both',
          }}>
            Vistorias de saída<br />
            sem{' '}
            <span style={{ color: 'var(--green-dark)', position: 'relative', display: 'inline-block' }}>
              disputas
              <span style={{
                position: 'absolute', bottom: '4px', left: 0, right: 0,
                height: '4px', background: 'var(--green)',
                borderRadius: '2px', opacity: 0.5,
              }} />
            </span>
          </h1>

          <p style={{
            fontSize: '17px', lineHeight: 1.7, color: 'var(--muted)',
            maxWidth: '480px', marginBottom: '40px',
            animation: 'fadeInUp 0.6s 0.2s ease both',
          }}>
            Compare fotos de entrada e saída com IA. O VisuCheck identifica itens faltantes,
            danos e alterações — e gera o relatório automaticamente.
          </p>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            marginBottom: '52px', animation: 'fadeInUp 0.6s 0.3s ease both',
          }}>
            <button onClick={() => navigate('/dashboard')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '13px 28px', borderRadius: '8px', fontSize: '15px',
              fontWeight: 600, background: 'var(--green)', color: 'var(--navy)',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 16px rgba(46,204,138,0.35)',
              transition: 'all 0.2s',
            }}>
              Criar conta grátis
            </button>
            <button style={{
              padding: '13px 28px', borderRadius: '8px', fontSize: '15px',
              fontWeight: 500, background: 'transparent', color: 'var(--navy)',
              border: '1.5px solid var(--border)', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              Ver demonstração
            </button>
          </div>

          <div style={{
            display: 'flex', gap: '40px',
            animation: 'fadeInUp 0.6s 0.4s ease both',
          }}>
            {[
              { num: '98%', label: 'Precisão da IA' },
              { num: '<3min', label: 'Por vistoria' },
              { num: 'PDF', label: 'Relatório automático' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{
                  fontFamily: 'Syne, sans-serif', fontSize: '28px',
                  fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px',
                }}>{stat.num}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Comparison Card */}
        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeInRight 0.8s 0.2s ease both' }}>
          {/* Float card top */}
          <div style={{
            position: 'absolute', top: '-24px', left: '-32px',
            background: 'white', borderRadius: '14px', padding: '14px 18px',
            boxShadow: '0 8px 32px rgba(11,45,82,0.15)',
            border: '1px solid rgba(11,45,82,0.06)',
            animation: 'float 3s ease-in-out infinite', zIndex: 10,
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🔍</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>IA Analisando...</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Sala de estar • 3 itens</div>
          </div>

          {/* Main comparison card */}
          <div style={{
            background: 'white', borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(11,45,82,0.18), 0 0 0 1px rgba(11,45,82,0.06)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: 'Syne, sans-serif', fontSize: '13px',
                fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.5px', textTransform: 'uppercase',
              }}>Análise Comparativa</span>
              <span style={{
                padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                background: 'var(--green-glow)', color: 'var(--green-dark)',
                border: '1px solid rgba(46,204,138,0.25)',
              }}>IA Ativa</span>
            </div>

            {/* Photos side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '280px', position: 'relative' }}>
              {/* Before */}
              <div style={{ background: 'linear-gradient(135deg, #e8f0f7, #d0dde9)', position: 'relative', overflow: 'hidden' }}>
                <span style={{
                  position: 'absolute', top: '12px', left: '12px',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                  fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                  background: 'rgba(11,45,82,0.12)', color: 'var(--navy)',
                }}>ENTRADA</span>
                <svg width="100%" height="100%" viewBox="0 0 240 240" preserveAspectRatio="xMidYMax meet">
                  <rect x="0" y="200" width="240" height="40" fill="#c8d8e8" opacity="0.5"/>
                  <rect x="20" y="145" width="140" height="55" rx="8" fill="#a8bdd4"/>
                  <rect x="20" y="140" width="140" height="20" rx="4" fill="#8faabf"/>
                  <rect x="38" y="148" width="35" height="28" rx="4" fill="#b8ccdd" opacity="0.8"/>
                  <rect x="80" y="148" width="35" height="28" rx="4" fill="#b8ccdd" opacity="0.8"/>
                  <rect x="122" y="148" width="22" height="28" rx="4" fill="#b8ccdd" opacity="0.8"/>
                  <rect x="175" y="170" width="50" height="28" rx="4" fill="#c0a882"/>
                  <line x1="178" y1="198" x2="178" y2="215" stroke="#b09070" strokeWidth="2"/>
                  <line x1="221" y1="198" x2="221" y2="215" stroke="#b09070" strokeWidth="2"/>
                  <line x1="205" y1="55" x2="205" y2="165" stroke="#94a3b8" strokeWidth="3"/>
                  <ellipse cx="205" cy="55" rx="20" ry="9" fill="#f0e68c" opacity="0.7"/>
                  <rect x="58" y="44" width="68" height="48" rx="3" fill="#c4d4e0" stroke="#a0b4c0" strokeWidth="1.5"/>
                  <ellipse cx="190" cy="152" rx="12" ry="5" fill="#8aba7a" opacity="0.7"/>
                  <rect x="185" y="157" width="8" height="10" rx="2" fill="#c0906a"/>
                </svg>
              </div>

              {/* After */}
              <div style={{ background: 'linear-gradient(135deg, #f0f7f4, #d5ede5)', position: 'relative', overflow: 'hidden' }}>
                <span style={{
                  position: 'absolute', top: '12px', left: '12px',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                  fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                  background: 'rgba(46,204,138,0.18)', color: 'var(--green-dark)',
                }}>SAÍDA</span>
                <svg width="100%" height="100%" viewBox="0 0 240 240" preserveAspectRatio="xMidYMax meet">
                  <rect x="0" y="200" width="240" height="40" fill="#c8d8e8" opacity="0.5"/>
                  <rect x="15" y="143" width="140" height="57" rx="8" fill="#a8bdd4"/>
                  <rect x="15" y="138" width="140" height="20" rx="4" fill="#8faabf"/>
                  <rect x="33" y="148" width="35" height="28" rx="4" fill="#b8ccdd" opacity="0.8"/>
                  <rect x="75" y="148" width="35" height="28" rx="4" fill="#b8ccdd" opacity="0.8"/>
                  <ellipse cx="105" cy="108" rx="16" ry="10" fill="#b8a89a" opacity="0.35"/>
                  <line x1="205" y1="55" x2="205" y2="165" stroke="#94a3b8" strokeWidth="3"/>
                  <ellipse cx="205" cy="55" rx="20" ry="9" fill="#f0e68c" opacity="0.7"/>
                  <rect x="58" y="44" width="68" height="48" rx="3" fill="#c4d4e0" stroke="#e05050" strokeWidth="2"/>
                </svg>
                {/* Damage markers */}
                <div style={{
                  position: 'absolute', left: '33%', top: '62%', width: '28%', height: '20%',
                  border: '2px solid #F43F5E', borderRadius: '6px',
                  background: 'rgba(244,63,94,0.08)', animation: 'markerPop 0.4s 0.3s ease both',
                }}>
                  <div style={{
                    position: 'absolute', top: '-20px', left: 0,
                    background: '#F43F5E', color: 'white', fontSize: '9px',
                    fontWeight: 700, padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap',
                  }}>Mesa faltante</div>
                </div>
                <div style={{
                  position: 'absolute', left: '25%', top: '18%', width: '30%', height: '22%',
                  border: '2px solid #F59E0B', borderRadius: '6px',
                  background: 'rgba(245,158,11,0.08)', animation: 'markerPop 0.4s 0.6s ease both',
                }}>
                  <div style={{
                    position: 'absolute', top: '-20px', left: 0,
                    background: '#F59E0B', color: 'white', fontSize: '9px',
                    fontWeight: 700, padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap',
                  }}>Mancha na parede</div>
                </div>
              </div>

              {/* Divider */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: '50%',
                width: '2px', background: 'white', transform: 'translateX(-50%)', zIndex: 10,
              }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '32px', height: '32px', background: 'white',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 12px rgba(11,45,82,0.2)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M5 6l-3 2 3 2M11 6l3 2-3 2" stroke="#0B2D52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* AI overlay */}
              <div style={{
                position: 'absolute', bottom: '12px', right: '12px',
                background: 'var(--navy)', color: 'white', fontSize: '11px',
                fontWeight: 600, padding: '6px 12px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10,
              }}>
                <span style={{
                  width: '6px', height: '6px', background: 'var(--green)',
                  borderRadius: '50%', animation: 'pulse 1.5s ease infinite',
                }} />
                IA processando
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 20px', background: '#f8fafc',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                {[
                  { color: '#F43F5E', label: '2 danos' },
                  { color: '#F59E0B', label: '1 item faltante' },
                  { color: 'var(--green)', label: '6 itens ok' },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.color }} />
                    {f.label}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Ver relatório →</span>
            </div>
          </div>

          {/* Float card bottom */}
          <div style={{
            position: 'absolute', bottom: '-20px', right: '-32px',
            background: 'white', borderRadius: '14px', padding: '14px 18px',
            boxShadow: '0 8px 32px rgba(11,45,82,0.15)',
            border: '1px solid rgba(11,45,82,0.06)',
            animation: 'float 3s 1.5s ease-in-out infinite', zIndex: 10,
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>📄</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Relatório gerado</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>PDF • 12 páginas • Agora</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="features" style={{ padding: '100px 48px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div ref={addReveal} className="reveal" style={{ marginBottom: '72px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green-dark)', marginBottom: '16px' }}>
              <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--green)', borderRadius: '1px' }} />
              Como funciona
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--navy)', lineHeight: 1.1, marginBottom: '12px' }}>
              Três passos.<br />Vistoria completa.
            </h2>
            <p style={{ fontSize: '17px', lineHeight: 1.7, color: 'var(--muted)', maxWidth: '520px' }}>
              Do upload ao relatório em PDF, o VisuCheck automatiza todo o processo de comparação de imóveis.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
            {[
              { icon: '📸', title: 'Fotografe os ambientes', desc: 'Registre cada cômodo na entrada do locatário. As fotos-matriz ficam armazenadas com segurança, organizadas por imóvel.' },
              { icon: '🤖', title: 'IA compara as imagens', desc: 'Na saída, envie as fotos e a IA analisa par a par: itens faltantes, danos, manchas e alterações são identificados automaticamente.' },
              { icon: '📋', title: 'Relatório em PDF', desc: 'Receba um laudo profissional com fotos lado a lado, marcações das divergências e descrição detalhada de cada ocorrência.' },
            ].map((step, i) => (
              <div key={step.title} ref={addReveal} className="reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px',
                  background: 'var(--cream)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', marginBottom: '28px', position: 'relative',
                  transition: 'all 0.3s', cursor: 'default',
                }}>
                  {step.icon}
                  <div style={{
                    position: 'absolute', bottom: '-4px', right: '-4px',
                    width: '20px', height: '20px', background: 'var(--green)', borderRadius: '6px',
                  }} />
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '10px', letterSpacing: '-0.5px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--muted)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES DARK */}
      <section id="recursos" style={{ padding: '100px 48px', background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,204,138,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div ref={addReveal} className="reveal">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '16px' }}>
              <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--green)', borderRadius: '1px' }} />
              Diferenciais
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', color: 'white', lineHeight: 1.1, marginBottom: '16px' }}>
              Tecnologia feita para imóveis de temporada
            </h2>
            <p style={{ fontSize: '17px', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>
              O VisuCheck entende o contexto do Airbnb, Booking e aluguel direto — sem configuração complexa.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '🎯', title: 'Detecção por ângulo livre', desc: 'A IA reconhece objetos mesmo em posições diferentes entre a foto de entrada e saída.' },
                { icon: '⚡', title: 'Resultado em minutos', desc: 'Análise completa de um apartamento de 2 quartos em menos de 3 minutos.' },
                { icon: '🛡️', title: 'Relatório com validade jurídica', desc: 'Laudos com data, hora e evidências fotográficas para cobrança de danos.' },
                { icon: '🏠', title: 'Multi-imóvel e multi-usuário', desc: 'Gerencie vários imóveis e vistoriadores em um único painel centralizado.' },
              ].map(f => (
                <div key={f.title} style={{
                  display: 'flex', gap: '16px', alignItems: 'flex-start',
                  padding: '20px', borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.04)',
                  cursor: 'default', transition: 'all 0.3s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(46,204,138,0.3)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateX(6px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'
                }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(46,204,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{f.title}</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.5)' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report card visual */}
          <div ref={addReveal} className="reveal" style={{ transitionDelay: '0.2s' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '32px' }}>
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                <div style={{ background: 'var(--navy)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 800, color: 'white' }}>
                    Visu<span style={{ color: 'var(--green)' }}>Check</span>
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Relatório de Saída • 21/03/2026</span>
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
                    Checklist — Sala de Estar
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { icon: '✅', text: 'Sofá 3 lugares — presente e sem danos', bg: 'var(--cream)', color: 'var(--navy)' },
                      { icon: '✅', text: 'Luminária de pé — presente', bg: 'var(--cream)', color: 'var(--navy)' },
                      { icon: '❌', text: 'Mesa de centro — não encontrada', bg: '#FDECEA', color: '#C0392B' },
                      { icon: '⚠️', text: 'Parede — mancha identificada (40cm)', bg: '#FFF3CD', color: '#856404' },
                      { icon: '❌', text: 'Almofada decorativa — 1 unidade faltante', bg: '#FDECEA', color: '#C0392B' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', background: item.bg, color: item.color }}>
                        <span>{item.icon}</span> {item.text}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', padding: '14px 16px', background: 'var(--green-glow)', border: '1px solid rgba(46,204,138,0.25)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Condição geral do imóvel</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--green-dark)' }}>64%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '100px 48px', background: 'var(--cream)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div ref={addReveal} className="reveal" style={{ marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green-dark)', marginBottom: '16px' }}>
              <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--green)', borderRadius: '1px' }} />
              Planos
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--navy)', lineHeight: 1.1, marginBottom: '16px' }}>
              Simples. Transparente.<br />Sem surpresas.
            </h2>
            <p style={{ fontSize: '17px', lineHeight: 1.7, color: 'var(--muted)', maxWidth: '520px', margin: '0 auto' }}>
              Escolha o plano ideal para o seu volume de vistorias. Cancele quando quiser.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'start' }}>
            {[
              {
                name: 'Starter', desc: 'Para anfitriões individuais', price: '99',
                features: ['Até 5 imóveis', '20 vistorias/mês', 'Relatórios em PDF', 'Comparativo com IA', 'Suporte por e-mail'],
                featured: false, cta: 'Começar grátis',
              },
              {
                name: 'Professional', desc: 'Para gestores de propriedades', price: '499',
                features: ['Até 50 imóveis', 'Vistorias ilimitadas', 'Assinatura digital', 'Checklist personalizado', 'Multi-usuário (5)', 'Suporte prioritário'],
                featured: true, cta: 'Começar agora',
              },
              {
                name: 'Enterprise', desc: 'Para imobiliárias e plataformas', price: null,
                features: ['Imóveis ilimitados', 'API dedicada', 'Integração com PMS', 'White-label', 'SLA garantido', 'Suporte 24/7'],
                featured: false, cta: 'Falar com vendas',
              },
            ].map((plan, i) => (
              <div key={plan.name} ref={addReveal} className="reveal" style={{
                transitionDelay: `${i * 0.15}s`,
                background: plan.featured ? 'var(--navy)' : 'white',
                borderRadius: '20px',
                border: plan.featured ? '1.5px solid var(--navy)' : '1.5px solid var(--border)',
                padding: '36px 32px',
                textAlign: 'left',
                position: 'relative',
                transform: plan.featured ? 'translateY(-8px)' : 'none',
                boxShadow: plan.featured ? '0 24px 60px rgba(11,45,82,0.3)' : 'none',
                transition: 'all 0.3s',
              }}>
                {plan.featured && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--green)', color: 'var(--navy)',
                    fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '100px',
                    whiteSpace: 'nowrap',
                  }}>Mais popular</div>
                )}
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: plan.featured ? 'white' : 'var(--navy)', marginBottom: '4px' }}>{plan.name}</div>
                <div style={{ fontSize: '13px', color: plan.featured ? 'rgba(255,255,255,0.55)' : 'var(--muted)', marginBottom: '28px' }}>{plan.desc}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
                  {plan.price ? (
                    <>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: plan.featured ? 'rgba(255,255,255,0.6)' : 'var(--muted)' }}>R$</span>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '44px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: plan.featured ? 'white' : 'var(--navy)' }}>{plan.price}</span>
                      <span style={{ fontSize: '13px', color: plan.featured ? 'rgba(255,255,255,0.5)' : 'var(--muted)', alignSelf: 'flex-end', paddingBottom: '6px' }}>/mês</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: 800, letterSpacing: '-1px', color: 'var(--navy)' }}>Sob consulta</span>
                  )}
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: plan.featured ? 'rgba(255,255,255,0.8)' : 'var(--text)' }}>
                      <span style={{ fontSize: '16px' }}>✅</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/dashboard')} style={{
                  width: '100%', padding: '13px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: plan.featured ? 'var(--green)' : 'transparent',
                  color: plan.featured ? 'var(--navy)' : 'var(--navy)',
                  border: plan.featured ? 'none' : '1.5px solid var(--border)',
                  transition: 'all 0.2s',
                } as React.CSSProperties}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', background: 'white', textAlign: 'center' }}>
        <div ref={addReveal} className="reveal" style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--navy)', lineHeight: 1.1, marginBottom: '16px' }}>
            Elimine disputas de vistoria de uma vez por todas
          </h2>
          <p style={{ fontSize: '17px', lineHeight: 1.7, color: 'var(--muted)', marginBottom: '40px' }}>
            Junte-se a proprietários, imobiliárias e vistoriadores que já automatizaram suas vistorias com VisuCheck.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
              background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 16px rgba(46,204,138,0.35)', transition: 'all 0.2s',
            }}>Criar conta grátis</button>
            <button style={{
              padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: 500,
              background: 'transparent', color: 'var(--navy)',
              border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s',
            }}>Agendar demonstração</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: 'var(--navy)', padding: '48px 48px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px', gap: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 5h12M3 9h8M3 13h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: 'white' }}>
                  Visu<span style={{ color: 'var(--green)' }}>Check</span>
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '10px', maxWidth: '200px', lineHeight: 1.5 }}>
                Vistorias inteligentes para imóveis de temporada.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '64px' }}>
              {[
                { title: 'Produto', links: ['Como funciona', 'Recursos', 'Planos', 'Changelog'] },
                { title: 'Empresa', links: ['Sobre nós', 'Blog', 'Parceiros', 'Contato'] },
                { title: 'Legal', links: ['Privacidade', 'Termos de uso', 'Segurança', 'Cookies'] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>{col.title}</div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {col.links.map(link => (
                      <li key={link}>
                        <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            <span>© 2026 VisuCheck. Todos os direitos reservados.</span>
            <span>Feito com ❤️ no Brasil</span>
          </div>
        </div>
      </footer>
    </div>
  )
}