import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Home() {
  const navigate = useNavigate()
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal').forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div style={{ background: 'white', overflowX: 'hidden' }}>
      <Navbar />
      <style>{`
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .plans-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 700px; margin: 0 auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .section-pad { padding: 80px 48px; max-width: 1200px; margin: 0 auto; }
        .hero-title { font-family: Syne, sans-serif; font-size: 56px; font-weight: 800; line-height: 1.1; letter-spacing: -2px; color: var(--navy); }
        .hero-sub { font-size: 18px; color: var(--muted); line-height: 1.6; margin: 20px 0 32px; max-width: 480px; }
        .section-title { font-family: Syne, sans-serif; font-size: 36px; font-weight: 800; color: var(--navy); letter-spacing: -1px; margin-bottom: 12px; }
        .section-sub { font-size: 16px; color: var(--muted); margin-bottom: 48px; }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr; gap: 32px; }
          .steps-grid { grid-template-columns: 1fr; gap: 20px; }
          .features-grid { grid-template-columns: 1fr; gap: 16px; }
          .plans-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
          .section-pad { padding: 56px 20px; }
          .hero-title { font-size: 36px; letter-spacing: -1px; }
          .hero-sub { font-size: 16px; }
          .section-title { font-size: 28px; }
          .section-sub { font-size: 14px; margin-bottom: 32px; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* ─── HERO ─── */}
      <div style={{ background: 'linear-gradient(160deg, #0B2D52 0%, #143D6B 60%, #0d3558 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '64px' }}>
        <div className="section-pad" style={{ width: '100%', maxWidth: '1200px' }}>
          <div className="hero-grid">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(46,204,138,0.15)', border: '1px solid rgba(46,204,138,0.3)', borderRadius: '100px', padding: '6px 16px', marginBottom: '28px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
                <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 500 }}>Tecnologia de IA para vistorias imobiliárias</span>
              </div>
              <h1 className="hero-title" style={{ color: 'white' }}>
                Vistorias de saída<br />sem <span style={{ color: 'var(--green)' }}>disputas</span>
              </h1>
              <p className="hero-sub" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Compare fotos de entrada e saída com IA. O VisuCheck identifica itens faltantes, danos e alterações — e gera o relatório automaticamente.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/login')} style={{ padding: '14px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 700, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(46,204,138,0.4)' }}>
                  Criar conta grátis
                </button>
                <button onClick={() => navigate('/login')} style={{ padding: '14px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 500, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  Ver demonstração
                </button>
              </div>
              <div className="stats-grid" style={{ marginTop: '48px' }}>
                {[
                  { value: '98%', label: 'Precisão da IA' },
                  { value: '<3min', label: 'Por vistoria' },
                  { value: 'PDF', label: 'Relatório automático' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800, color: 'white' }}>{s.value}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual */}
            <div className="hide-mobile" style={{ position: 'relative' }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>ANÁLISE COMPARATIVA</span>
                  <span style={{ padding: '4px 10px', borderRadius: '100px', background: 'var(--green-glow)', color: 'var(--green-dark)', fontSize: '12px', fontWeight: 600 }}>IA Ativa</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {['ENTRADA', 'SAÍDA'].map((label, i) => (
                    <div key={label} style={{ borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ background: i === 0 ? '#f0f4f8' : '#fff0f0', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                          <rect x="10" y="60" width="100" height="50" rx="4" fill={i === 0 ? '#d0dde9' : '#f5c0c0'} />
                          <rect x="20" y="30" width="40" height="35" rx="3" fill={i === 0 ? '#b8c8d8' : '#e8a0a0'} />
                          <rect x="70" y="40" width="30" height="25" rx="3" fill={i === 0 ? '#b8c8d8' : '#e8a0a0'} />
                          {i === 1 && <rect x="60" y="55" width="35" height="25" rx="3" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 2" />}
                        </svg>
                        {i === 1 && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#EF4444', color: 'white', fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>Mesa faltante</div>
                        )}
                      </div>
                      <div style={{ padding: '6px 10px', background: i === 0 ? 'var(--navy)' : '#EF4444' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '12px', fontSize: '12px' }}>
                  <span>🔴 2 danos</span>
                  <span>🟡 1 item faltante</span>
                  <span>🟢 6 itens ok</span>
                </div>
              </div>

              {/* Floating badges */}
              <div style={{ position: 'absolute', top: '-16px', left: '-16px', background: 'white', borderRadius: '14px', padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--green-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🔍</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)' }}>IA Analisando...</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Sala de estar • 3 itens</div>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: '-16px', right: '-16px', background: 'white', borderRadius: '14px', padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)' }}>📄 Relatório gerado</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>PDF • 12 páginas • Agora</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── COMO FUNCIONA ─── */}
      <div style={{ background: 'var(--cream)' }}>
        <div className="section-pad reveal">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: 'var(--green-dark)', textTransform: 'uppercase', marginBottom: '12px' }}>COMO FUNCIONA</div>
            <h2 className="section-title">Três passos.<br />Vistoria completa.</h2>
            <p className="section-sub">Do upload ao relatório em PDF, o VisuCheck automatiza todo o processo de comparação de imóveis.</p>
          </div>
          <div className="steps-grid">
            {[
              { num: '01', icon: '📸', title: 'Fotografe os ambientes', desc: 'Registre cada cômodo na entrada do imóvel. As fotos ficam armazenadas com segurança, organizadas por imóvel.' },
              { num: '02', icon: '🤖', title: 'IA compara as imagens', desc: 'Na saída, envie as fotos e a IA analisa par a par. Itens faltantes, danos e alterações são identificados automaticamente.' },
              { num: '03', icon: '📄', title: 'Relatório em PDF', desc: 'Receba um laudo profissional em PDF, com fotos lado a lado, todas as divergências e descrição detalhada de cada ocorrência.' },
            ].map(step => (
              <div key={step.num} style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--green-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                    {step.icon}
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--green-dark)', letterSpacing: '1px' }}>{step.num}</div>
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <div style={{ background: 'var(--navy)' }}>
        <div className="section-pad reveal">
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: 'var(--green)', textTransform: 'uppercase', marginBottom: '12px' }}>RECURSOS</div>
            <h2 className="section-title" style={{ color: 'white' }}>Tecnologia feita para imóveis de temporada</h2>
            <p className="section-sub" style={{ color: 'rgba(255,255,255,0.6)' }}>O VisuCheck é projetado para a rotina do anfitrião moderno. Rápido, sem configurações complexas.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: '🔍', title: 'Detecção com IA', desc: 'Compara automaticamente fotos de entrada e saída, identificando cada diferença com precisão.' },
              { icon: '⚡', title: 'Resultado em minutos', desc: 'A análise completa é concluída em menos de 3 minutos, mesmo com dezenas de fotos.' },
              { icon: '📄', title: 'Relatório com valor jurídico', desc: 'Laudos com fotos lado a lado, data e hora, com força de comprovação para disputas.' },
              { icon: '🏘️', title: 'Multi-imóvel e multi-usuário', desc: 'Gerencie múltiplos imóveis em uma única conta, com controle total de cada propriedade.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(46,204,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PLANOS ─── */}
      <div style={{ background: 'var(--cream)' }}>
        <div className="section-pad reveal">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: 'var(--green-dark)', textTransform: 'uppercase', marginBottom: '12px' }}>PLANOS</div>
            <h2 className="section-title">Simples. Transparente.<br />Bem apreçado.</h2>
            <p className="section-sub">Escolha o plano ideal para o seu volume de vistorias. Cancele quando quiser.</p>
          </div>
          <div className="plans-grid">
            {[
              {
                name: 'Starter', price: 'R$ 99', period: '/mês', highlight: false,
                features: ['Até 3 imóveis', '20 vistorias/mês', 'Relatórios em PDF', 'Comparação com IA', 'Suporte por e-mail'],
              },
              {
                name: 'Profissional', price: 'R$ 499', period: '/mês', highlight: true,
                features: ['Até 50 imóveis', 'Vistorias ilimitadas', 'Assinatura digital', 'Alertas personalizados', 'Multi-usuário (5)', 'Suporte prioritário'],
              },
            ].map(plan => (
              <div key={plan.name} style={{ background: plan.highlight ? 'var(--navy)' : 'white', borderRadius: '20px', padding: '32px', border: plan.highlight ? 'none' : '1px solid var(--border)', position: 'relative', boxShadow: plan.highlight ? '0 20px 60px rgba(11,45,82,0.3)' : 'none' }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--green)', color: 'var(--navy)', fontSize: '11px', fontWeight: 700, padding: '4px 16px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                    MAIS POPULAR
                  </div>
                )}
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: plan.highlight ? 'white' : 'var(--navy)', marginBottom: '8px' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: 800, color: plan.highlight ? 'white' : 'var(--navy)' }}>{plan.price}</span>
                  <span style={{ fontSize: '14px', color: plan.highlight ? 'rgba(255,255,255,0.6)' : 'var(--muted)' }}>{plan.period}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: plan.highlight ? 'rgba(255,255,255,0.85)' : 'var(--navy)' }}>
                      <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, background: plan.highlight ? 'var(--green)' : 'transparent', color: plan.highlight ? 'var(--navy)' : 'var(--navy)', border: plan.highlight ? 'none' : '1.5px solid var(--border)', cursor: 'pointer' }}>
                  Começar grátis
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA FINAL ─── */}
      <div style={{ background: 'var(--navy)' }}>
        <div className="section-pad reveal" style={{ textAlign: 'center' }}>
          <h2 className="section-title" style={{ color: 'white', marginBottom: '16px' }}>
            Elimine disputas de<br />vistoria de uma vez por todas
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.65)', marginBottom: '36px', maxWidth: '500px', margin: '0 auto 36px' }}>
            Junte-se a proprietários, imobiliárias e construtoras que já automatizaram suas vistorias com VisuCheck.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={{ padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 700, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(46,204,138,0.4)' }}>
              Criar conta grátis
            </button>
            <button onClick={() => navigate('/login')} style={{ padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 500, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
              Agendar demonstração
            </button>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ background: '#07203A', padding: '40px 24px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                Visu<span style={{ color: 'var(--green)' }}>Check</span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', maxWidth: '220px', lineHeight: 1.6 }}>
                Vistorias inteligentes para imóveis de temporada.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              {[
                { title: 'Produto', links: ['Recursos', 'Planos', 'Segurança'] },
                { title: 'Empresa', links: ['Sobre', 'Blog', 'Contato'] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>{col.title}</div>
                  {col.links.map(link => (
                    <div key={link} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', cursor: 'pointer' }}>{link}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2025 VisuCheck. Todos os direitos reservados.</span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Feito com IA 🤖</span>
          </div>
        </div>
      </div>
    </div>
  )
}