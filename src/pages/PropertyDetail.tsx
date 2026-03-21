import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'

type Room = { id: string; name: string; is_custom: boolean }
type Item = { id: string; name: string }
type MatrixPhoto = { id: string; room_id: string | null; item_id: string | null; position: string; photo_url: string }
type Inspection = { id: string; created_at: string; type: string; status: string }

export default function PropertyDetail() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState<any>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [matrixPhotos, setMatrixPhotos] = useState<MatrixPhoto[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rooms' | 'items' | 'inspections'>('rooms')
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => { if (propertyId) fetchAll() }, [propertyId])

  async function fetchAll() {
    setLoading(true)
    const [
      { data: prop },
      { data: roomsData },
      { data: itemsData },
      { data: photos },
      { data: insps },
    ] = await Promise.all([
      supabase.from('properties').select('*').eq('id', propertyId).single(),
      supabase.from('rooms').select('*').eq('property_id', propertyId),
      supabase.from('items').select('*').eq('property_id', propertyId),
      supabase.from('matrix_photos').select('*').eq('property_id', propertyId),
      supabase.from('inspections').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }),
    ])
    setProperty(prop)
    setRooms(roomsData || [])
    setItems(itemsData || [])
    setMatrixPhotos(photos || [])
    setInspections(insps || [])
    setLoading(false)
  }

  const getRoomPhotos = (roomId: string) =>
    matrixPhotos.filter(p => p.room_id === roomId)

  const getItemPhotos = (itemId: string) =>
    matrixPhotos.filter(p => p.item_id === itemId)

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

  const positionLabel: Record<string, string> = {
    north: 'Canto 1', east: 'Canto 2', west: 'Canto 3', south: 'Canto 4',
  }

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)' } as React.CSSProperties,
    inner: { paddingTop: '100px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', maxWidth: '1100px', margin: '0 auto' } as React.CSSProperties,
    card: { background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' } as React.CSSProperties,
    btnGreen: { padding: '11px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(46,204,138,0.3)' } as React.CSSProperties,
    btnOutline: { padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, background: 'transparent', color: 'var(--navy)', border: '1.5px solid var(--border)', cursor: 'pointer' } as React.CSSProperties,
    btnNavy: { padding: '11px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, background: 'var(--navy)', color: 'white', border: 'none', cursor: 'pointer' } as React.CSSProperties,
  }

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: 'var(--muted)' }}>Carregando imóvel...</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <Navbar />

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Foto" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '24px', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div style={s.inner}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Voltar ao Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px', marginBottom: '6px' }}>
                {property?.name}
              </h1>
              {property?.address && <p style={{ fontSize: '15px', color: 'var(--muted)' }}>📍 {property.address}</p>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.btnOutline} onClick={() => navigate(`/property/${propertyId}/setup`)}>
                ⚙️ Editar configuração
              </button>
              <button style={s.btnGreen} onClick={() => navigate('/dashboard')}>
                + Nova vistoria
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { icon: '🏠', label: 'Cômodos', value: rooms.length },
            { icon: '📦', label: 'Objetos', value: items.length },
            { icon: '📋', label: 'Vistorias', value: inspections.length },
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
          {[
            { key: 'rooms', label: `🏠 Cômodos (${rooms.length})` },
            { key: 'items', label: `📦 Objetos (${items.length})` },
            { key: 'inspections', label: `📋 Vistorias (${inspections.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
              padding: '9px 20px', borderRadius: '9px', fontSize: '14px', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === t.key ? 'var(--navy)' : 'transparent',
              color: activeTab === t.key ? 'white' : 'var(--muted)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ROOMS TAB */}
        {activeTab === 'rooms' && (
          <>
            {rooms.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏠</div>
                <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>Nenhum cômodo configurado ainda</p>
                <button style={s.btnNavy} onClick={() => navigate(`/property/${propertyId}/setup`)}>Configurar agora</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {rooms.map(room => {
                  const photos = getRoomPhotos(room.id)
                  return (
                    <div key={room.id} style={s.card}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>
                          🏠 {room.name}
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', background: 'var(--cream)', padding: '4px 10px', borderRadius: '100px', border: '1px solid var(--border)' }}>
                          {photos.length} foto(s) original(is)
                        </span>
                      </div>

                      {photos.length === 0 ? (
                        <div style={{ padding: '24px', borderRadius: '10px', background: 'var(--cream)', textAlign: 'center', border: '1.5px dashed var(--border)' }}>
                          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Nenhuma foto original cadastrada</p>
                          <button style={{ ...s.btnOutline, marginTop: '12px', fontSize: '12px' }} onClick={() => navigate(`/property/${propertyId}/setup`)}>
                            Adicionar fotos
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                          {photos.map(photo => (
                            <div key={photo.id} style={{ cursor: 'pointer' }} onClick={() => setLightbox(photo.photo_url)}>
                              <div style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '4/3', background: 'var(--cream)', position: 'relative' }}>
                                <img src={photo.photo_url} alt={positionLabel[photo.position] || photo.position} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                                <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(11,45,82,0.8)', color: 'white', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                                  {positionLabel[photo.position] || photo.position}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ITEMS TAB */}
        {activeTab === 'items' && (
          <>
            {items.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
                <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>Nenhum objeto configurado ainda</p>
                <button style={s.btnNavy} onClick={() => navigate(`/property/${propertyId}/setup`)}>Configurar agora</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {items.map(item => {
                  const photos = getItemPhotos(item.id)
                  return (
                    <div key={item.id} style={s.card}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>
                          📦 {item.name}
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', background: 'var(--cream)', padding: '3px 8px', borderRadius: '100px', border: '1px solid var(--border)' }}>
                          {photos.length} foto(s)
                        </span>
                      </div>
                      {photos.length === 0 ? (
                        <div style={{ padding: '20px', borderRadius: '8px', background: 'var(--cream)', textAlign: 'center', border: '1.5px dashed var(--border)' }}>
                          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Sem fotos originais</p>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                          {photos.map(photo => (
                            <div key={photo.id} style={{ borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', cursor: 'pointer' }} onClick={() => setLightbox(photo.photo_url)}>
                              <img src={photo.photo_url} alt="Objeto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* INSPECTIONS TAB */}
        {activeTab === 'inspections' && (
          <>
            {inspections.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>Nenhuma vistoria realizada ainda</p>
                <button style={s.btnGreen} onClick={() => navigate('/dashboard')}>
                  + Criar primeira vistoria
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {inspections.map(insp => {
                  const sc = getStatusColor(insp.status)
                  return (
                    <div key={insp.id} style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(11,45,82,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                      onClick={() => navigate(`/inspection/${insp.id}/upload`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                          🚪
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--navy)' }}>
                            Vistoria de Saída
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                            {new Date(insp.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <span style={{ padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {getStatusLabel(insp.status)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}