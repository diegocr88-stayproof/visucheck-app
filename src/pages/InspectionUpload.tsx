import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'

type Room = { id: string; name: string; is_custom: boolean }
type Item = { id: string; name: string }
type PhotoSlot = { position: string; label: string; guide: string; file?: File; preview?: string }

const POSITIONS = [
  { position: 'north', label: 'Canto 1', guide: 'Frente esquerda do cômodo' },
  { position: 'east', label: 'Canto 2', guide: 'Frente direita do cômodo' },
  { position: 'west', label: 'Canto 3', guide: 'Fundo esquerda do cômodo' },
  { position: 'south', label: 'Canto 4', guide: 'Fundo direita do cômodo' },
]

export default function InspectionUpload() {
  const { inspectionId } = useParams()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [currentSection, setCurrentSection] = useState<'rooms' | 'items'>('rooms')
  const [roomPhotos, setRoomPhotos] = useState<Record<string, PhotoSlot[]>>({})
  const [itemPhotos, setItemPhotos] = useState<Record<string, PhotoSlot[]>>({})
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeSlot, setActiveSlot] = useState<{ type: 'room' | 'item'; id: string; position: string } | null>(null)

  useEffect(() => {
    if (inspectionId) fetchData()
  }, [inspectionId])

  async function fetchData() {
    setLoading(true)
    const { data: insp } = await supabase.from('inspections').select('*').eq('id', inspectionId).single()
    if (!insp) return
    setInspection(insp)
    const { data: prop } = await supabase.from('properties').select('*').eq('id', insp.property_id).single()
    setProperty(prop)
    const { data: roomsData } = await supabase.from('rooms').select('*').eq('property_id', insp.property_id)
    const { data: itemsData } = await supabase.from('items').select('*').eq('property_id', insp.property_id)
    setRooms(roomsData || [])
    setItems(itemsData || [])
    const rPhotos: Record<string, PhotoSlot[]> = {}
    ;(roomsData || []).forEach(room => { rPhotos[room.id] = POSITIONS.map(p => ({ ...p })) })
    setRoomPhotos(rPhotos)
    const iPhotos: Record<string, PhotoSlot[]> = {}
    ;(itemsData || []).forEach(item => { iPhotos[item.id] = [{ position: '1', label: 'Foto 1', guide: 'Foto do objeto' }] })
    setItemPhotos(iPhotos)
    setLoading(false)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeSlot) return
    const preview = URL.createObjectURL(file)
    if (activeSlot.type === 'room') {
      setRoomPhotos(prev => ({ ...prev, [activeSlot.id]: prev[activeSlot.id].map(slot => slot.position === activeSlot.position ? { ...slot, file, preview } : slot) }))
    } else {
      setItemPhotos(prev => ({ ...prev, [activeSlot.id]: prev[activeSlot.id].map(slot => slot.position === activeSlot.position ? { ...slot, file, preview } : slot) }))
    }
    e.target.value = ''
  }

  function openFilePicker(type: 'room' | 'item', id: string, position: string) {
    setActiveSlot({ type, id, position })
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  function addItemPhoto(itemId: string) {
    setItemPhotos(prev => {
      const current = prev[itemId] || []
      const nextNum = current.length + 1
      return { ...prev, [itemId]: [...current, { position: String(nextNum), label: `Foto ${nextNum}`, guide: 'Foto adicional do objeto' }] }
    })
  }

  function removeItemPhoto(itemId: string, position: string) {
    setItemPhotos(prev => ({ ...prev, [itemId]: prev[itemId].filter(s => s.position !== position) }))
  }

  async function uploadAllAndFinish() {
    if (!inspectionId) return
    setFinishing(true)
    const uploads: Promise<any>[] = []

    for (const room of rooms) {
      const slots = roomPhotos[room.id] || []
      for (const slot of slots) {
        if (!slot.file) continue
        const path = `${inspectionId}/rooms/${room.id}/${slot.position}-${Date.now()}.jpg`
        uploads.push(
          supabase.storage.from('inspection-photos').upload(path, slot.file).then(async () => {
            const { data: urlData } = supabase.storage.from('inspection-photos').getPublicUrl(path)
            await supabase.from('inspection_photos').insert({
              inspection_id: inspectionId, room_id: room.id,
              position: slot.position, photo_url: urlData.publicUrl, storage_path: path,
            })
          })
        )
      }
    }

    for (const item of items) {
      const slots = itemPhotos[item.id] || []
      for (const slot of slots) {
        if (!slot.file) continue
        const path = `${inspectionId}/items/${item.id}/${slot.position}-${Date.now()}.jpg`
        uploads.push(
          supabase.storage.from('inspection-photos').upload(path, slot.file).then(async () => {
            const { data: urlData } = supabase.storage.from('inspection-photos').getPublicUrl(path)
            await supabase.from('inspection_photos').insert({
              inspection_id: inspectionId, item_id: item.id,
              position: slot.position, photo_url: urlData.publicUrl, storage_path: path,
            })
          })
        )
      }
    }

    await Promise.all(uploads)
    await supabase.from('inspections').update({ status: 'processing' }).eq('id', inspectionId)
    setFinishing(false)
  }

  const currentRoom = rooms[currentRoomIndex]
  const totalRooms = rooms.length
  const roomsDone = rooms.filter(r => roomPhotos[r.id]?.some(s => s.file)).length

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)' } as React.CSSProperties,
    inner: { paddingTop: '100px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', maxWidth: '900px', margin: '0 auto' } as React.CSSProperties,
    card: { background: 'white', borderRadius: '20px', border: '1px solid var(--border)', padding: '32px' } as React.CSSProperties,
    btnGreen: { padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(46,204,138,0.3)' } as React.CSSProperties,
    btnNavy: { padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: 'var(--navy)', color: 'white', border: 'none', cursor: 'pointer' } as React.CSSProperties,
    btnOutline: { padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, background: 'transparent', color: 'var(--navy)', border: '1.5px solid var(--border)', cursor: 'pointer' } as React.CSSProperties,
  }

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: 'var(--muted)' }}>Carregando vistoria...</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <Navbar />
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} />

      <div style={s.inner}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Voltar ao Dashboard
          </button>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px', marginBottom: '4px' }}>
            Vistoria de Saída
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--muted)' }}>
            {property?.name} • {new Date(inspection?.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Progress */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Progresso</span>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{roomsDone}/{totalRooms} cômodos fotografados</span>
          </div>
          <div style={{ height: '6px', background: 'var(--cream)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--green)', borderRadius: '3px', width: `${totalRooms > 0 ? (roomsDone / totalRooms) * 100 : 0}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)', marginBottom: '24px', width: 'fit-content' }}>
          {[
            { key: 'rooms', label: `🏠 Cômodos (${rooms.length})` },
            { key: 'items', label: `📦 Objetos (${items.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setCurrentSection(t.key as any)} style={{
              padding: '9px 20px', borderRadius: '9px', fontSize: '14px', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: currentSection === t.key ? 'var(--navy)' : 'transparent',
              color: currentSection === t.key ? 'white' : 'var(--muted)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ROOMS */}
        {currentSection === 'rooms' && rooms.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {rooms.map((room, i) => {
                const hasPhotos = roomPhotos[room.id]?.some(s => s.file)
                return (
                  <button key={room.id} onClick={() => setCurrentRoomIndex(i)} style={{
                    padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
                    border: currentRoomIndex === i ? '2px solid var(--navy)' : '1.5px solid var(--border)',
                    background: currentRoomIndex === i ? 'var(--navy)' : hasPhotos ? 'var(--green-glow)' : 'white',
                    color: currentRoomIndex === i ? 'white' : 'var(--navy)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    {hasPhotos && <span style={{ fontSize: '10px' }}>✅</span>}
                    {room.name}
                  </button>
                )
              })}
            </div>

            {currentRoom && (
              <div style={s.card}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>{currentRoom.name}</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>Tire 4 fotos — uma em cada canto do cômodo</p>

                {/* Guide visual */}
                <div style={{ background: 'var(--cream)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
                    Guia de posicionamento
                  </div>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '280px', margin: '0 auto', aspectRatio: '1' }}>
                    <div style={{ position: 'absolute', inset: '52px', background: 'white', border: '2.5px solid var(--navy)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ position: 'absolute', bottom: '-2.5px', left: '35%', width: '18%', height: '3px', background: 'var(--cream)' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: '35%', width: '18%', height: '12px', borderRight: '2px solid var(--navy)', borderRadius: '0 0 10px 0', background: 'transparent' }} />
                      <div style={{ fontSize: '22px' }}>🛋️</div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)' }}>{currentRoom.name}</div>
                      <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '12px', color: 'var(--muted)' }}>↘</div>
                      <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '12px', color: 'var(--muted)' }}>↙</div>
                      <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '12px', color: 'var(--muted)' }}>↗</div>
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '12px', color: 'var(--muted)' }}>↖</div>
                    </div>
                    {[
                      { pos: 'north', label: 'Canto 1', style: { top: '0px', left: '0px' }, dir: 'Frente esq.' },
                      { pos: 'east', label: 'Canto 2', style: { top: '0px', right: '0px' }, dir: 'Frente dir.' },
                      { pos: 'west', label: 'Canto 3', style: { bottom: '0px', left: '0px' }, dir: 'Fundo esq.' },
                      { pos: 'south', label: 'Canto 4', style: { bottom: '0px', right: '0px' }, dir: 'Fundo dir.' },
                    ].map(cam => {
                      const slot = (roomPhotos[currentRoom.id] || []).find(s => s.position === cam.pos)
                      const hasPhoto = !!slot?.file
                      return (
                        <div key={cam.pos} style={{ position: 'absolute', ...cam.style, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}
                          onClick={() => openFilePicker('room', currentRoom.id, cam.pos)}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: hasPhoto ? 'var(--green)' : 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(11,45,82,0.25)', transition: 'all 0.2s' }}>
                            {hasPhoto ? '✅' : '📷'}
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--navy)', background: 'white', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{cam.label}</div>
                          <div style={{ fontSize: '8px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{cam.dir}</div>
                        </div>
                      )
                    })}
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)', marginTop: '16px' }}>
                    📷 Clique em cada câmera para tirar a foto
                  </p>
                </div>

                {/* 4 photo slots */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {(roomPhotos[currentRoom.id] || []).map(slot => (
                    <div key={slot.position}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '4px' }}>{slot.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>{slot.guide}</div>
                      {slot.preview ? (
                        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3' }}>
                          <img src={slot.preview} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => openFilePicker('room', currentRoom.id, slot.position)} style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(11,45,82,0.8)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                            🔄 Trocar
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => openFilePicker('room', currentRoom.id, slot.position)} style={{ width: '100%', aspectRatio: '4/3', borderRadius: '12px', border: '2px dashed var(--border)', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.background = 'rgba(11,45,82,0.03)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--cream)' }}>
                          <span style={{ fontSize: '28px' }}>📸</span>
                          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Tirar / Enviar foto</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                  <button style={s.btnOutline} onClick={() => setCurrentRoomIndex(i => Math.max(0, i - 1))} disabled={currentRoomIndex === 0}>← Anterior</button>
                  {currentRoomIndex < rooms.length - 1 ? (
                    <button style={s.btnNavy} onClick={() => setCurrentRoomIndex(i => i + 1)}>Próximo cômodo →</button>
                  ) : (
                    <button style={s.btnGreen} onClick={() => setCurrentSection('items')}>Ver objetos →</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ITEMS */}
        {currentSection === 'items' && (
          <>
            {items.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
                <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>Nenhum objeto cadastrado</p>
                <button style={s.btnOutline} onClick={() => navigate(`/property/${property?.id}/setup`)}>Configurar objetos</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {items.map(item => (
                  <div key={item.id} style={s.card}>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px' }}>📦 {item.name}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      {(itemPhotos[item.id] || []).map(slot => (
                        <div key={slot.position}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>{slot.label}</div>
                          {slot.preview ? (
                            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}>
                              <img src={slot.preview} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button onClick={() => removeItemPhoto(item.id, slot.position)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(192,57,43,0.9)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                            </div>
                          ) : (
                            <button onClick={() => openFilePicker('item', item.id, slot.position)} style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', border: '2px dashed var(--border)', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                              <span style={{ fontSize: '22px' }}>📸</span>
                              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Adicionar</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button style={s.btnOutline} onClick={() => addItemPhoto(item.id)}>+ Adicionar foto</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Finish */}
        <div style={{ marginTop: '32px', padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>Finalizar e analisar</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{roomsDone} de {totalRooms} cômodos com fotos</div>
          </div>
          <button style={{ ...s.btnGreen, fontSize: '15px', padding: '13px 28px' }}
            disabled={finishing}
            onClick={async () => {
              await uploadAllAndFinish()
              navigate(`/inspection/${inspectionId}/analysis`)
            }}>
            {finishing ? '⏳ Enviando fotos...' : '🤖 Analisar com IA →'}
          </button>
        </div>
      </div>
    </div>
  )
}