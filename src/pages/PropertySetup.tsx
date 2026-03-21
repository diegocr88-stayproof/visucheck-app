import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'

const SUGGESTED_ROOMS = [
  { id: 'living_room', label: 'Sala de Estar', icon: '🛋️' },
  { id: 'bedroom', label: 'Quarto', icon: '🛏️' },
  { id: 'kitchen', label: 'Cozinha', icon: '🍳' },
  { id: 'bathroom', label: 'Banheiro', icon: '🚿' },
  { id: 'balcony', label: 'Varanda', icon: '🌅' },
  { id: 'laundry', label: 'Área de Serviço', icon: '🧺' },
  { id: 'hallway', label: 'Corredor', icon: '🚪' },
  { id: 'garage', label: 'Garagem', icon: '🚗' },
]

const SUGGESTED_ITEMS = [
  { id: 'fridge', label: 'Geladeira', icon: '🧊' },
  { id: 'microwave', label: 'Micro-ondas', icon: '📦' },
  { id: 'tv', label: 'Televisão', icon: '📺' },
  { id: 'washer', label: 'Máquina de Lavar', icon: '🌀' },
  { id: 'ac', label: 'Ar-condicionado', icon: '❄️' },
  { id: 'sofa', label: 'Sofá', icon: '🛋️' },
  { id: 'bed', label: 'Cama', icon: '🛏️' },
  { id: 'stove', label: 'Fogão', icon: '🔥' },
]

const POSITIONS = [
  { position: 'north', label: 'Parede Norte', guide: 'Foto da parede de frente ao entrar' },
  { position: 'south', label: 'Parede Sul', guide: 'Foto da parede dos fundos' },
  { position: 'east', label: 'Parede Leste', guide: 'Foto da parede à direita' },
  { position: 'west', label: 'Parede Oeste', guide: 'Foto da parede à esquerda' },
]

type Step = 'rooms' | 'matrix' | 'done'
type Room = { id: string; name: string; is_custom: boolean }
type Item = { id: string; name: string }
type PhotoSlot = { position: string; label: string; guide: string; file?: File; preview?: string }

export default function PropertySetup() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeSlot, setActiveSlot] = useState<{ type: 'room' | 'item'; id: string; position: string } | null>(null)

  const [property, setProperty] = useState<any>(null)
  const [step, setStep] = useState<Step>('rooms')

  // Step 1: rooms & items
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [customRooms, setCustomRooms] = useState<string[]>([])
  const [newRoom, setNewRoom] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [customItems, setCustomItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
  const [roomsTab, setRoomsTab] = useState<'rooms' | 'items'>('rooms')

  // Step 2: matrix photos
  const [savedRooms, setSavedRooms] = useState<Room[]>([])
  const [savedItems, setSavedItems] = useState<Item[]>([])
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [matrixSection, setMatrixSection] = useState<'rooms' | 'items'>('rooms')
  const [roomPhotos, setRoomPhotos] = useState<Record<string, PhotoSlot[]>>({})
  const [itemPhotos, setItemPhotos] = useState<Record<string, PhotoSlot[]>>({})

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (propertyId) {
      supabase.from('properties').select('*').eq('id', propertyId).single()
        .then(({ data }) => setProperty(data))
    }
  }, [propertyId])

  // ─── STEP 1 HANDLERS ───
  function toggleRoom(id: string) {
    setSelectedRooms(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }
  function toggleItem(id: string) {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }
  function addCustomRoom() {
    if (!newRoom.trim()) return
    setCustomRooms(prev => [...prev, newRoom.trim()])
    setNewRoom('')
  }
  function addCustomItem() {
    if (!newItem.trim()) return
    setCustomItems(prev => [...prev, newItem.trim()])
    setNewItem('')
  }

  async function saveRoomsAndNext() {
    if (!propertyId) return
    setSaving(true)

    const roomsToInsert = [
      ...selectedRooms.map(id => ({ property_id: propertyId, name: SUGGESTED_ROOMS.find(r => r.id === id)?.label || id, is_custom: false })),
      ...customRooms.map(name => ({ property_id: propertyId, name, is_custom: true })),
    ]
    const itemsToInsert = [
      ...selectedItems.map(id => ({ property_id: propertyId, name: SUGGESTED_ITEMS.find(i => i.id === id)?.label || id })),
      ...customItems.map(name => ({ property_id: propertyId, name })),
    ]

    await supabase.from('rooms').delete().eq('property_id', propertyId)
    await supabase.from('items').delete().eq('property_id', propertyId)
    if (roomsToInsert.length > 0) await supabase.from('rooms').insert(roomsToInsert)
    if (itemsToInsert.length > 0) await supabase.from('items').insert(itemsToInsert)

    // Carrega os cômodos salvos para a próxima etapa
    const { data: rooms } = await supabase.from('rooms').select('*').eq('property_id', propertyId)
    const { data: items } = await supabase.from('items').select('*').eq('property_id', propertyId)

    setSavedRooms(rooms || [])
    setSavedItems(items || [])

    // Inicializa slots de fotos
    const rPhotos: Record<string, PhotoSlot[]> = {}
    ;(rooms || []).forEach(room => {
      rPhotos[room.id] = POSITIONS.map(p => ({ ...p }))
    })
    setRoomPhotos(rPhotos)

    const iPhotos: Record<string, PhotoSlot[]> = {}
    ;(items || []).forEach(item => {
      iPhotos[item.id] = [{ position: '1', label: 'Foto 1', guide: 'Foto do objeto' }]
    })
    setItemPhotos(iPhotos)

    setSaving(false)
    setStep('matrix')
  }

  // ─── STEP 2 HANDLERS ───
  function openFilePicker(type: 'room' | 'item', id: string, position: string) {
    setActiveSlot({ type, id, position })
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeSlot) return
    const preview = URL.createObjectURL(file)
    if (activeSlot.type === 'room') {
      setRoomPhotos(prev => ({
        ...prev,
        [activeSlot.id]: prev[activeSlot.id].map(slot =>
          slot.position === activeSlot.position ? { ...slot, file, preview } : slot
        )
      }))
    } else {
      setItemPhotos(prev => ({
        ...prev,
        [activeSlot.id]: prev[activeSlot.id].map(slot =>
          slot.position === activeSlot.position ? { ...slot, file, preview } : slot
        )
      }))
    }
    e.target.value = ''
  }

  function addItemPhoto(itemId: string) {
    setItemPhotos(prev => {
      const current = prev[itemId] || []
      const nextNum = current.length + 1
      return { ...prev, [itemId]: [...current, { position: String(nextNum), label: `Foto ${nextNum}`, guide: 'Foto adicional' }] }
    })
  }

  async function saveMatrixAndFinish() {
    if (!propertyId) return
    setSaving(true)

    // Deleta fotos matriz antigas
    await supabase.from('matrix_photos').delete().eq('property_id', propertyId)

    const uploads: Promise<any>[] = []

    for (const room of savedRooms) {
      for (const slot of roomPhotos[room.id] || []) {
        if (!slot.file) continue
        const path = `matrix/${propertyId}/rooms/${room.id}/${slot.position}-${Date.now()}.jpg`
        uploads.push(
          supabase.storage.from('inspection-photos').upload(path, slot.file).then(async () => {
            const { data: urlData } = supabase.storage.from('inspection-photos').getPublicUrl(path)
            await supabase.from('matrix_photos').insert({
              property_id: propertyId,
              room_id: room.id,
              position: slot.position,
              photo_url: urlData.publicUrl,
              storage_path: path,
            })
          })
        )
      }
    }

    for (const item of savedItems) {
      for (const slot of itemPhotos[item.id] || []) {
        if (!slot.file) continue
        const path = `matrix/${propertyId}/items/${item.id}/${slot.position}-${Date.now()}.jpg`
        uploads.push(
          supabase.storage.from('inspection-photos').upload(path, slot.file).then(async () => {
            const { data: urlData } = supabase.storage.from('inspection-photos').getPublicUrl(path)
            await supabase.from('matrix_photos').insert({
              property_id: propertyId,
              item_id: item.id,
              position: slot.position,
              photo_url: urlData.publicUrl,
              storage_path: path,
            })
          })
        )
      }
    }

    await Promise.all(uploads)
    setSaving(false)
    navigate('/dashboard')
  }

  const currentRoom = savedRooms[currentRoomIndex]

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)' } as React.CSSProperties,
    inner: { paddingTop: '100px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', maxWidth: '860px', margin: '0 auto' } as React.CSSProperties,
    card: { background: 'white', borderRadius: '20px', border: '1px solid var(--border)', padding: '36px' } as React.CSSProperties,
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' } as React.CSSProperties,
    chip: (selected: boolean) => ({ padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', border: selected ? '2px solid var(--navy)' : '1.5px solid var(--border)', background: selected ? 'rgba(11,45,82,0.05)' : 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: selected ? 600 : 400, color: selected ? 'var(--navy)' : 'var(--muted)', transition: 'all 0.2s' } as React.CSSProperties),
    input: { flex: 1, padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '14px', color: 'var(--navy)', outline: 'none', fontFamily: 'DM Sans, sans-serif' } as React.CSSProperties,
    btnGreen: { padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(46,204,138,0.3)' } as React.CSSProperties,
    btnNavy: { padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: 'var(--navy)', color: 'white', border: 'none', cursor: 'pointer' } as React.CSSProperties,
    btnOutline: { padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, background: 'transparent', color: 'var(--navy)', border: '1.5px solid var(--border)', cursor: 'pointer' } as React.CSSProperties,
    tag: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', background: 'var(--cream)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--navy)' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <Navbar />
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} />

      <div style={s.inner}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Voltar ao Dashboard
          </button>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px', marginBottom: '6px' }}>
            Configurar imóvel
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--muted)' }}>{property?.name}</p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[
            { key: 'rooms', label: '1. Cômodos e Objetos' },
            { key: 'matrix', label: '2. Fotos Originais' },
          ].map(s2 => (
            <div key={s2.key} style={{
              padding: '8px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
              background: step === s2.key ? 'var(--navy)' : 'white',
              color: step === s2.key ? 'white' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}>{s2.label}</div>
          ))}
        </div>

        {/* ─── STEP 1: ROOMS & ITEMS ─── */}
        {step === 'rooms' && (
          <div style={s.card}>
            {/* Sub tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--cream)', borderRadius: '10px', padding: '4px', marginBottom: '28px', width: 'fit-content' }}>
              {[
                { key: 'rooms', label: '🏠 Cômodos' },
                { key: 'items', label: '📦 Objetos' },
              ].map(t => (
                <button key={t.key} onClick={() => setRoomsTab(t.key as any)} style={{
                  padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: roomsTab === t.key ? 'white' : 'transparent',
                  color: roomsTab === t.key ? 'var(--navy)' : 'var(--muted)',
                  boxShadow: roomsTab === t.key ? '0 1px 4px rgba(11,45,82,0.1)' : 'none',
                }}>{t.label}</button>
              ))}
            </div>

            {roomsTab === 'rooms' && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>Quais cômodos tem o imóvel?</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>Selecione os sugeridos e adicione personalizados se necessário.</p>
                <div style={s.grid}>
                  {SUGGESTED_ROOMS.map(room => (
                    <div key={room.id} style={s.chip(selectedRooms.includes(room.id))} onClick={() => toggleRoom(room.id)}>
                      <span style={{ fontSize: '20px' }}>{room.icon}</span>
                      <span>{room.label}</span>
                    </div>
                  ))}
                </div>
                {customRooms.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {customRooms.map((room, i) => (
                      <div key={i} style={s.tag}>
                        {room}
                        <button onClick={() => setCustomRooms(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '16px', lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={s.input} placeholder="+ Adicionar cômodo personalizado" value={newRoom} onChange={e => setNewRoom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomRoom()} />
                  <button style={s.btnOutline} onClick={addCustomRoom}>Adicionar</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
                  <button style={s.btnNavy} onClick={() => setRoomsTab('items')}>Próximo: Objetos →</button>
                </div>
              </>
            )}

            {roomsTab === 'items' && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>Quais objetos deseja registrar?</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>Objetos recebem fotos individuais para comparação detalhada.</p>
                <div style={s.grid}>
                  {SUGGESTED_ITEMS.map(item => (
                    <div key={item.id} style={s.chip(selectedItems.includes(item.id))} onClick={() => toggleItem(item.id)}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                {customItems.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {customItems.map((item, i) => (
                      <div key={i} style={s.tag}>
                        {item}
                        <button onClick={() => setCustomItems(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '16px', lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={s.input} placeholder="+ Adicionar objeto personalizado" value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomItem()} />
                  <button style={s.btnOutline} onClick={addCustomItem}>Adicionar</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
                  <button style={s.btnOutline} onClick={() => setRoomsTab('rooms')}>← Voltar</button>
                  <button style={s.btnGreen} onClick={saveRoomsAndNext} disabled={saving}>
                    {saving ? 'Salvando...' : '→ Próximo: Fotos Originais'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── STEP 2: MATRIX PHOTOS ─── */}
        {step === 'matrix' && (
          <>
            <div style={{ background: 'rgba(46,204,138,0.1)', border: '1px solid rgba(46,204,138,0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>📸</span>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>Fotos do estado original do imóvel</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Estas fotos serão a base de comparação para todas as vistorias futuras. Fotografe com cuidado!</div>
              </div>
            </div>

            {/* Section tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)', marginBottom: '20px', width: 'fit-content' }}>
              {[
                { key: 'rooms', label: `🏠 Cômodos (${savedRooms.length})` },
                { key: 'items', label: `📦 Objetos (${savedItems.length})` },
              ].map(t => (
                <button key={t.key} onClick={() => setMatrixSection(t.key as any)} style={{
                  padding: '9px 20px', borderRadius: '9px', fontSize: '14px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: matrixSection === t.key ? 'var(--navy)' : 'transparent',
                  color: matrixSection === t.key ? 'white' : 'var(--muted)',
                }}>{t.label}</button>
              ))}
            </div>

            {/* Rooms matrix */}
            {matrixSection === 'rooms' && savedRooms.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {savedRooms.map((room, i) => {
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
                    <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>Tire 4 fotos — uma em cada posição do cômodo</p>

                    {/* Guide visual — planta baixa */}
<div style={{ background: 'var(--cream)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
    Guia de posicionamento das fotos
  </div>
  <div style={{ position: 'relative', width: '100%', maxWidth: '360px', margin: '0 auto', aspectRatio: '1' }}>

    {/* Room floor plan */}
    <div style={{ position: 'absolute', inset: '48px', background: 'white', borderRadius: '4px', border: '2.5px solid var(--navy)', opacity: 0.9 }}>
      {/* Door */}
      <div style={{ position: 'absolute', bottom: '-2.5px', left: '30%', width: '20%', height: '3px', background: 'var(--cream)' }} />
      <div style={{ position: 'absolute', bottom: '0', left: '30%', width: '20%', height: '14px', borderRight: '2px solid var(--navy)', borderRadius: '0 0 12px 0', borderBottom: 'none', background: 'transparent' }} />
      {/* Floor label */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>🛋️</div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}>{currentRoom.name}</div>
        </div>
      </div>
      {/* Wall labels */}
      <div style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>PAREDE NORTE</div>
      <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>PAREDE SUL</div>
      <div style={{ position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>PAREDE OESTE</div>
      <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>PAREDE LESTE</div>
    </div>

    {/* Camera icons at each position */}
    {[
      { pos: 'north', label: 'Foto 1', top: '0px', left: '50%', transform: 'translateX(-50%)', arrow: '↓' },
      { pos: 'south', label: 'Foto 2', bottom: '0px', left: '50%', transform: 'translateX(-50%)', arrow: '↑' },
      { pos: 'west',  label: 'Foto 3', top: '50%', left: '0px',  transform: 'translateY(-50%)', arrow: '→' },
      { pos: 'east',  label: 'Foto 4', top: '50%', right: '0px', transform: 'translateY(-50%)', arrow: '←' },
    ].map(cam => {
      const slot = (roomPhotos[currentRoom.id] || []).find(s => s.position === cam.pos)
      const hasPhoto = !!slot?.file
      return (
        <div key={cam.pos} style={{
          position: 'absolute', top: cam.top, bottom: (cam as any).bottom,
          left: cam.left, right: (cam as any).right, transform: cam.transform,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          cursor: 'pointer',
        }} onClick={() => openFilePicker('room', currentRoom.id, cam.pos)}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: hasPhoto ? 'var(--green)' : 'var(--navy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', boxShadow: '0 4px 12px rgba(11,45,82,0.25)',
            border: hasPhoto ? '2px solid var(--green-dark)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {hasPhoto ? '✅' : '📷'}
          </div>
          <div style={{
            fontSize: '10px', fontWeight: 700,
            color: hasPhoto ? 'var(--green-dark)' : 'var(--navy)',
            background: 'white', padding: '2px 6px', borderRadius: '4px',
            border: '1px solid var(--border)',
          }}>{cam.label}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{cam.arrow}</div>
        </div>
      )
    })}
  </div>

  <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)', marginTop: '16px' }}>
    Clique em cada 📷 para tirar a foto daquela posição
  </p>
</div>

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
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--cream)' }}
                            >
                              <span style={{ fontSize: '28px' }}>📸</span>
                              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Tirar / Enviar foto</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
                      <button style={s.btnOutline} onClick={() => setCurrentRoomIndex(i => Math.max(0, i - 1))} disabled={currentRoomIndex === 0}>← Anterior</button>
                      {currentRoomIndex < savedRooms.length - 1 ? (
                        <button style={s.btnNavy} onClick={() => setCurrentRoomIndex(i => i + 1)}>Próximo cômodo →</button>
                      ) : (
                        <button style={s.btnGreen} onClick={() => setMatrixSection('items')}>Ver objetos →</button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Items matrix */}
            {matrixSection === 'items' && (
              <>
                {savedItems.length === 0 ? (
                  <div style={{ ...s.card, textAlign: 'center', padding: '48px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📦</div>
                    <p style={{ color: 'var(--muted)' }}>Nenhum objeto cadastrado</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {savedItems.map(item => (
                      <div key={item.id} style={s.card}>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px' }}>📦 {item.name}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          {(itemPhotos[item.id] || []).map(slot => (
                            <div key={slot.position}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>{slot.label}</div>
                              {slot.preview ? (
                                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}>
                                  <img src={slot.preview} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button onClick={() => openFilePicker('item', item.id, slot.position)} style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(11,45,82,0.8)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>🔄</button>
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
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>Salvar configuração</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>As fotos originais serão a base de todas as vistorias</div>
              </div>
              <button style={{ ...s.btnGreen, fontSize: '15px', padding: '13px 28px' }} onClick={saveMatrixAndFinish} disabled={saving}>
                {saving ? '⏳ Salvando...' : '✓ Concluir configuração'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}