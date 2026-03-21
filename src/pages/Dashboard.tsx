import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../supabase'

type Property = { id: string; created_at: string; name: string; address: string | null; description: string | null; user_id: string }
type Inspection = { id: string; created_at: string; property_id: string; type: 'entry' | 'exit'; status: 'pending' | 'processing' | 'completed' | 'failed'; user_id: string; report_url: string | null }
type Tab = 'properties' | 'inspections'
type ModalType = 'none' | 'addProperty' | 'addInspection'

export default function Dashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('properties')
  const [modal, setModal] = useState<ModalType>('none')
  const [properties, setProperties] = useState<Property[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [propName, setPropName] = useState('')
  const [propAddress, setPropAddress] = useState('')
  const [propDesc, setPropDesc] = useState('')
  const [inspType, setInspType] = useState<'entry' | 'exit'>('entry')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: props }, { data: insps }] = await Promise.all([
      supabase.from('properties').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('inspections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setProperties(props || [])
    setInspections(insps || [])
    setLoading(false)
  }

  async function handleAddProperty() {
    if (!propName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('properties').insert({
      name: propName,
      address: propAddress || null,
      description: propDesc || null,
      user_id: user.id,
    })
    setSaving(false)
    if (!error) {
      setPropName(''); setPropAddress(''); setPropDesc('')
      setModal('none')
      fetchAll()
    }
  }

  async function handleAddInspection() {
    if (!selectedPropertyId) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('inspections').insert({
      property_id: selectedPropertyId,
      type: inspType,
      status: 'pending',
      user_id: user.id,
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setSelectedPropertyId(''); setInspType('entry')
      setModal('none')
      navigate(`/inspection/${data.id}/upload`)
    }
  }

  const getStatusLabel = (status: string) => ({
    pending: 'Pendente', processing: 'Processando',
    completed: 'Concluída', failed: 'Erro',
  }[status] || status)

  const getStatusColor = (status: string) => ({
    pending: { bg: '#FFF3CD', color: '#856404' },
    processing: { bg: '#CCE5FF', color: '#004085' },
    completed: { bg: '#D4EDDA', color: '#155724' },
    failed: { bg: '#FDECEA', color: '#C0392B' },
  }[status] || { bg: '#eee', color: '#333' })

  const getPropertyName = (id: string) =>
    properties.find(p => p.id === id)?.name || 'Imóvel'

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)' } as React.CSSProperties,
    inner: { paddingTop: '100px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', maxWidth: '1200px', margin: '0 auto' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' } as React.CSSProperties,
    h1: { fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px', marginBottom: '6px' } as React.CSSProperties,
    sub: { fontSize: '15px', color: 'var(--muted)' } as React.CSSProperties,
    btnGreen: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(46,204,138,0.3)' } as React.CSSProperties,
    btnOutline: { padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, background: 'transparent', color: 'var(--navy)', border: '1.5px solid var(--border)', cursor: 'pointer' } as React.CSSProperties,
    card: { background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', transition: 'box-shadow 0.2s' } as React.CSSProperties,
    emptyBox: { background: 'white', borderRadius: '20px', border: '1.5px dashed var(--border)', padding: '80px 40px', textAlign: 'center' as const },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' } as React.CSSProperties,
    input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', color: 'var(--navy)', outline: 'none', fontFamily: 'DM Sans, sans-serif' } as React.CSSProperties,
    select: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', color: 'var(--navy)', outline: 'none', background: 'white', fontFamily: 'DM Sans, sans-serif' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.inner}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.h1}>Dashboard</h1>
            <p style={s.sub}>Gerencie seus imóveis e vistorias</p>
          </div>
          <button style={s.btnGreen}
            onClick={() => setModal(tab === 'properties' ? 'addProperty' : 'addInspection')}>
            + {tab === 'properties' ? 'Novo Imóvel' : 'Nova Vistoria'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Imóveis', value: properties.length, icon: '🏠' },
            { label: 'Vistorias', value: inspections.length, icon: '📋' },
            { label: 'Concluídas', value: inspections.filter(i => i.status === 'completed').length, icon: '✅' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '28px' }}>{stat.icon}</span>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)', marginBottom: '24px', width: 'fit-content' }}>
          {(['properties', 'inspections'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '9px 24px', borderRadius: '9px', fontSize: '14px', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t ? 'var(--navy)' : 'transparent',
              color: tab === t ? 'white' : 'var(--muted)',
            }}>
              {t === 'properties' ? '🏠 Imóveis' : '📋 Vistorias'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            Carregando...
          </div>
        ) : (
          <>
            {/* PROPERTIES TAB */}
            {tab === 'properties' && (
              <>
                {properties.length === 0 ? (
                  <div style={s.emptyBox}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                      Nenhum imóvel cadastrado
                    </h3>
                    <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '32px' }}>
                      Adicione seu primeiro imóvel para começar as vistorias
                    </p>
                    <button style={s.btnGreen} onClick={() => setModal('addProperty')}>
                      + Adicionar imóvel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {properties.map(p => (
                      <div key={p.id} style={{ ...s.card }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(11,45,82,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--green-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏠</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={s.btnOutline}
                              onClick={() => navigate(`/property/${p.id}/setup`)}>
                              ⚙️ Configurar
                            </button>
                            <button style={s.btnOutline}
                              onClick={() => { setSelectedPropertyId(p.id); setModal('addInspection') }}>
                              + Vistoria
                            </button>
                          </div>
                        </div>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>{p.name}</h3>
                        {p.address && <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>📍 {p.address}</p>}
                        {p.description && <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px', lineHeight: 1.5 }}>{p.description}</p>}
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)' }}>
                          {inspections.filter(i => i.property_id === p.id).length} vistoria(s) registrada(s)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* INSPECTIONS TAB */}
            {tab === 'inspections' && (
              <>
                {inspections.length === 0 ? (
                  <div style={s.emptyBox}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                      Nenhuma vistoria realizada
                    </h3>
                    <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '32px' }}>
                      Crie um imóvel e inicie sua primeira vistoria
                    </p>
                    <button style={s.btnGreen} onClick={() => setModal('addInspection')}>
                      + Nova vistoria
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {inspections.map(insp => {
                      const sc = getStatusColor(insp.status)
                      return (
                        <div key={insp.id} style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(11,45,82,0.12)')}
                          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                          onClick={() => navigate(`/inspection/${insp.id}/upload`)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                              {insp.type === 'entry' ? '🔑' : '🚪'}
                            </div>
                            <div>
                              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--navy)' }}>
                                {getPropertyName(insp.property_id)}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                                {insp.type === 'entry' ? 'Vistoria de Entrada' : 'Vistoria de Saída'} • {new Date(insp.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: sc.bg, color: sc.color }}>
                              {getStatusLabel(insp.status)}
                            </span>
                            {insp.report_url && (
                              <button style={s.btnOutline} onClick={e => { e.stopPropagation(); window.open(insp.report_url!) }}>
                                Ver relatório
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      {modal !== 'none' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(11,45,82,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }} onClick={() => setModal('none')}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '36px',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 24px 80px rgba(11,45,82,0.25)',
          }} onClick={e => e.stopPropagation()}>

            {modal === 'addProperty' && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '24px' }}>Novo Imóvel</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={s.label}>Nome do imóvel *</label>
                    <input style={s.input} placeholder="Ex: Apartamento 301" value={propName} onChange={e => setPropName(e.target.value)} />
                  </div>
                  <div>
                    <label style={s.label}>Endereço</label>
                    <input style={s.input} placeholder="Ex: Rua Principal, 123" value={propAddress} onChange={e => setPropAddress(e.target.value)} />
                  </div>
                  <div>
                    <label style={s.label}>Descrição</label>
                    <textarea style={{ ...s.input, resize: 'vertical', minHeight: '80px' }} placeholder="Descrição do imóvel..." value={propDesc} onChange={e => setPropDesc(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setModal('none')}>Cancelar</button>
                    <button style={{ ...s.btnGreen, flex: 2, justifyContent: 'center' }} onClick={handleAddProperty} disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar imóvel'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {modal === 'addInspection' && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '24px' }}>Nova Vistoria</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={s.label}>Imóvel *</label>
                    <select style={s.select} value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
                      <option value="">Selecione um imóvel</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Tipo de vistoria *</label>
                    <select style={s.select} value={inspType} onChange={e => setInspType(e.target.value as 'entry' | 'exit')}>
                      <option value="entry">🔑 Entrada</option>
                      <option value="exit">🚪 Saída</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setModal('none')}>Cancelar</button>
                    <button style={{ ...s.btnGreen, flex: 2, justifyContent: 'center' }} onClick={handleAddInspection} disabled={saving}>
                      {saving ? 'Salvando...' : 'Criar vistoria'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}