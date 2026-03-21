import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../supabase'

type Property = { id: string; created_at: string; name: string; address: string | null; description: string | null; user_id: string; cover_url: string | null }
type Inspection = { id: string; created_at: string; property_id: string; type: 'exit'; status: 'pending' | 'processing' | 'completed' | 'failed'; user_id: string; report_url: string | null }
type Tab = 'properties' | 'inspections'
type ModalType = 'none' | 'addProperty' | 'addInspection'

const PLAN_LIMIT = 999

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
  const [saving, setSaving] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

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

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleAddProperty() {
    if (!propName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    let cover_url = null
    if (coverFile) {
      const path = `${user.id}/${Date.now()}-${coverFile.name}`
      const { data } = await supabase.storage.from('property-covers').upload(path, coverFile)
      if (data) {
        const { data: urlData } = supabase.storage.from('property-covers').getPublicUrl(path)
        cover_url = urlData.publicUrl
      }
    }
    const { data: newProp, error } = await supabase.from('properties').insert({
      name: propName, address: propAddress || null, description: propDesc || null, user_id: user.id, cover_url,
    }).select().single()
    setSaving(false)
    if (!error && newProp) {
      setPropName(''); setPropAddress(''); setPropDesc('')
      setCoverFile(null); setCoverPreview(null)
      setModal('none')
      fetchAll()
      navigate(`/property/${newProp.id}/setup`)
    }
  }

  async function handleAddInspection() {
    if (!selectedPropertyId) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('inspections').insert({
      property_id: selectedPropertyId, type: 'exit', status: 'pending', user_id: user.id,
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setSelectedPropertyId(''); setModal('none')
      navigate(`/inspection/${data.id}/upload`)
    }
  }

  const getStatusColor = (status: string) => ({
    pending: { bg: '#FFF3CD', color: '#856404', label: 'Pendente' },
    processing: { bg: '#CCE5FF', color: '#004085', label: 'Processando' },
    completed: { bg: '#D4EDDA', color: '#155724', label: 'Concluída' },
    failed: { bg: '#FDECEA', color: '#C0392B', label: 'Erro' },
  }[status] || { bg: '#eee', color: '#333', label: status })

  const planUsed = inspections.filter(i => {
    const d = new Date(i.created_at), now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const planPercent = Math.min((planUsed / PLAN_LIMIT) * 100, 100)

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', color: 'var(--navy)', outline: 'none', fontFamily: 'DM Sans, sans-serif' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }
  const btnG: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(46,204,138,0.3)' }
  const btnO: React.CSSProperties = { padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, background: 'transparent', color: 'var(--navy)', border: '1.5px solid var(--border)', cursor: 'pointer' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <Navbar />
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverSelect} />

      <style>{`
        .dash-inner { padding: 100px 48px 80px; max-width: 1200px; margin: 0 auto; }
        .dash-stats { display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr; gap: 16px; margin-bottom: 32px; }
        .prop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        @media (max-width: 768px) {
          .dash-inner { padding: 80px 16px 60px; }
          .dash-stats { grid-template-columns: 1fr 1fr; }
          .prop-grid { grid-template-columns: 1fr; }
          .dash-header { flex-direction: column; gap: 12px; align-items: flex-start !important; }
          .dash-header button { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="dash-inner">

        {/* Header */}
        <div className="dash-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px', marginBottom: '4px' }}>Dashboard</h1>
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Gerencie seus imóveis e vistorias</p>
          </div>
          <button style={btnG} onClick={() => setModal(tab === 'properties' ? 'addProperty' : 'addInspection')}>
            + {tab === 'properties' ? 'Novo Imóvel' : 'Nova Vistoria'}
          </button>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          {[
            { label: 'Imóveis', value: properties.length, icon: '🏠' },
            { label: 'Vistorias', value: inspections.length, icon: '📋' },
            { label: 'Concluídas', value: inspections.filter(i => i.status === 'completed').length, icon: '✅' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>{stat.icon}</span>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{stat.label}</div>
              </div>
            </div>
          ))}

          {/* Plano */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Plano Starter</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>{planUsed}</span>
                  <span> / {PLAN_LIMIT} vistorias</span>
                </div>
              </div>
              <div style={{ padding: '3px 10px', borderRadius: '100px', background: 'var(--green-glow)', color: 'var(--green-dark)', fontSize: '12px', fontWeight: 600 }}>
                {PLAN_LIMIT - planUsed} restantes
              </div>
            </div>
            <div style={{ height: '5px', background: 'var(--cream)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${planPercent}%`, background: 'var(--green)', borderRadius: '3px' }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)', marginBottom: '20px', width: 'fit-content' }}>
          {(['properties', 'inspections'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: '9px', fontSize: '14px', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--navy)' : 'transparent',
              color: tab === t ? 'white' : 'var(--muted)',
            }}>
              {t === 'properties' ? '🏠 Imóveis' : '📋 Vistorias'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>⏳ Carregando...</div>
        ) : (
          <>
            {/* PROPERTIES */}
            {tab === 'properties' && (
              properties.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '20px', border: '1.5px dashed var(--border)', padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>Nenhum imóvel cadastrado</h3>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '28px' }}>Adicione seu primeiro imóvel para começar</p>
                  <button style={btnG} onClick={() => setModal('addProperty')}>+ Adicionar imóvel</button>
                </div>
              ) : (
                <div className="prop-grid">
                  {properties.map(p => (
                    <div key={p.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                      onClick={() => navigate(`/property/${p.id}`)}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(11,45,82,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{ height: '160px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #e8f0f7, #d0dde9)' }}>
                        {p.cover_url ? (
                          <img src={p.cover_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.4 }}>🏠</div>
                        )}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button style={{ background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--navy)' }}
                            onClick={() => navigate(`/property/${p.id}/setup`)}>⚙️</button>
                          <button style={{ background: 'rgba(46,204,138,0.92)', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: 'var(--navy)' }}
                            onClick={() => { setSelectedPropertyId(p.id); setModal('addInspection') }}>+ Vistoria</button>
                        </div>
                      </div>
                      <div style={{ padding: '16px 18px' }}>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>{p.name}</h3>
                        {p.address && <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>📍 {p.address}</p>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '12px' }}>
                          <span style={{ color: 'var(--muted)' }}>{inspections.filter(i => i.property_id === p.id).length} vistoria(s)</span>
                          <span style={{ color: 'var(--navy)', fontWeight: 600 }}>Ver detalhes →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* INSPECTIONS */}
            {tab === 'inspections' && (
              inspections.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '20px', border: '1.5px dashed var(--border)', padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>Nenhuma vistoria realizada</h3>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '28px' }}>Inicie sua primeira vistoria</p>
                  <button style={btnG} onClick={() => setModal('addInspection')}>+ Nova vistoria</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {inspections.map(insp => {
                    const sc = getStatusColor(insp.status)
                    const prop = properties.find(p => p.id === insp.property_id)
                    return (
                      <div key={insp.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(11,45,82,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                        onClick={() => navigate(`/inspection/${insp.id}/upload`)}
                      >
                        <div style={{ width: '64px', height: '64px', flexShrink: 0, background: 'var(--cream)', overflow: 'hidden' }}>
                          {prop?.cover_url ? (
                            <img src={prop.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🚪</div>
                          )}
                        </div>
                        <div style={{ flex: 1, padding: '12px 16px' }}>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}>
                            {prop?.name || 'Imóvel'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                            Saída • {new Date(insp.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div style={{ paddingRight: '16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                            {sc.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      {modal !== 'none' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,45,82,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setModal('none')}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 80px rgba(11,45,82,0.25)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            {modal === 'addProperty' && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '20px' }}>Novo Imóvel</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={lbl}>Foto de capa</label>
                    {coverPreview ? (
                      <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: '120px' }}>
                        <img src={coverPreview} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => coverInputRef.current?.click()} style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(11,45,82,0.8)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                          🔄 Trocar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => coverInputRef.current?.click()} style={{ width: '100%', height: '100px', borderRadius: '10px', border: '2px dashed var(--border)', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                        <span style={{ fontSize: '24px' }}>📷</span>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Adicionar foto de capa</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <label style={lbl}>Nome *</label>
                    <input style={inp} placeholder="Ex: Apartamento 301" value={propName} onChange={e => setPropName(e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Endereço</label>
                    <input style={inp} placeholder="Ex: Rua Principal, 123" value={propAddress} onChange={e => setPropAddress(e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Descrição</label>
                    <textarea style={{ ...inp, resize: 'vertical', minHeight: '64px' }} placeholder="Descrição..." value={propDesc} onChange={e => setPropDesc(e.target.value)} />
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--green-glow)', fontSize: '13px', color: 'var(--navy)' }}>
                    📸 Após salvar você configurará os cômodos e fotos originais
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ ...btnO, flex: 1 }} onClick={() => { setModal('none'); setCoverFile(null); setCoverPreview(null) }}>Cancelar</button>
                    <button style={{ ...btnG, flex: 2, justifyContent: 'center' }} onClick={handleAddProperty} disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar →'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {modal === 'addInspection' && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '20px' }}>Nova Vistoria de Saída</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={lbl}>Imóvel *</label>
                    <select style={{ ...inp, background: 'white' }} value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
                      <option value="">Selecione um imóvel</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--green-glow)', fontSize: '13px', color: 'var(--navy)' }}>
                    📸 As fotos serão comparadas com as originais pela IA
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ ...btnO, flex: 1 }} onClick={() => setModal('none')}>Cancelar</button>
                    <button style={{ ...btnG, flex: 2, justifyContent: 'center' }} onClick={handleAddInspection} disabled={saving}>
                      {saving ? 'Criando...' : 'Iniciar vistoria'}
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