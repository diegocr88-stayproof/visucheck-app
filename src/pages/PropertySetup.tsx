import { useState, useEffect } from 'react'
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

export default function PropertySetup() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState<any>(null)
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [customRooms, setCustomRooms] = useState<string[]>([])
  const [newRoom, setNewRoom] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [customItems, setCustomItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'rooms' | 'items'>('rooms')

  useEffect(() => {
    if (propertyId) {
      supabase.from('properties').select('*').eq('id', propertyId).single()
        .then(({ data }) => setProperty(data))
    }
  }, [propertyId])

  function toggleRoom(id: string) {
    setSelectedRooms(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  function toggleItem(id: string) {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
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

  async function handleSave() {
    if (!propertyId) return
    setSaving(true)

    // Monta lista de cômodos
    const roomsToInsert = [
      ...selectedRooms.map(id => ({
        property_id: propertyId,
        name: SUGGESTED_ROOMS.find(r => r.id === id)?.label || id,
        is_custom: false,
      })),
      ...customRooms.map(name => ({
        property_id: propertyId,
        name,
        is_custom: true,
      })),
    ]

    // Monta lista de objetos
    const itemsToInsert = [
      ...selectedItems.map(id => ({
        property_id: propertyId,
        name: SUGGESTED_ITEMS.find(i => i.id === id)?.label || id,
      })),
      ...customItems.map(name => ({
        property_id: propertyId,
        name,
      })),
    ]

    // Deleta anteriores e insere novos
    await supabase.from('rooms').delete().eq('property_id', propertyId)
    await supabase.from('items').delete().eq('property_id', propertyId)

    if (roomsToInsert.length > 0) {
      await supabase.from('rooms').insert(roomsToInsert)
    }
    if (itemsToInsert.length > 0) {
      await supabase.from('items').insert(itemsToInsert)
    }

    setSaving(false)
    navigate('/dashboard')
  }

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)' } as React.CSSProperties,
    inner: { paddingTop: '100px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', maxWidth: '800px', margin: '0 auto' } as React.CSSProperties,
    card: { background: 'white', borderRadius: '20px', border: '1px solid var(--border)', padding: '40px' } as React.CSSProperties,
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' } as React.CSSProperties,
    chip: (selected: boolean) => ({
      padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
      border: selected ? '2px solid var(--navy)' : '1.5px solid var(--border)',
      background: selected ? 'rgba(11,45,82,0.05)' : 'white',
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '14px', fontWeight: selected ? 600 : 400,
      color: selected ? 'var(--navy)' : 'var(--muted)',
      transition: 'all 0.2s',
    } as React.CSSProperties),
    input: { flex: 1, padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '14px', color: 'var(--navy)', outline: 'none', fontFamily: 'DM Sans, sans-serif' } as React.CSSProperties,
    btnGreen: { padding: '11px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer' } as React.CSSProperties,
    btnNavy: { padding: '11px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: 'var(--navy)', color: 'white', border: 'none', cursor: 'pointer' } as React.CSSProperties,
    btnOutline: { padding: '11px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, background: 'transparent', color: 'var(--navy)', border: '1.5px solid var(--border)', cursor: 'pointer' } as React.CSSProperties,
    tag: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', background: 'var(--cream)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--navy)' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.inner}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Voltar ao Dashboard
          </button>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px', marginBottom: '8px' }}>
            Configurar imóvel
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--muted)' }}>
            {property?.name} — defina os cômodos e objetos para as vistorias
          </p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[
            { key: 'rooms', label: '1. Cômodos' },
            { key: 'items', label: '2. Objetos' },
          ].map(s2 => (
            <div key={s2.key} style={{
              padding: '8px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
              background: step === s2.key ? 'var(--navy)' : 'white',
              color: step === s2.key ? 'white' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}>
              {s2.label}
            </div>
          ))}
        </div>

        <div style={s.card}>
          {/* STEP 1: ROOMS */}
          {step === 'rooms' && (
            <>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                Quais cômodos tem o imóvel?
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>
                Selecione os sugeridos e adicione cômodos personalizados se necessário.
              </p>

              {/* Suggested rooms */}
              <div style={s.grid}>
                {SUGGESTED_ROOMS.map(room => (
                  <div key={room.id} style={s.chip(selectedRooms.includes(room.id))} onClick={() => toggleRoom(room.id)}>
                    <span style={{ fontSize: '20px' }}>{room.icon}</span>
                    <span>{room.label}</span>
                  </div>
                ))}
              </div>

              {/* Custom rooms */}
              {customRooms.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {customRooms.map((room, i) => (
                    <div key={i} style={s.tag}>
                      {room}
                      <button onClick={() => setCustomRooms(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add custom room */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  style={s.input} placeholder="+ Adicionar cômodo personalizado"
                  value={newRoom} onChange={e => setNewRoom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomRoom()}
                />
                <button style={s.btnOutline} onClick={addCustomRoom}>Adicionar</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                <button style={s.btnNavy} onClick={() => setStep('items')}>
                  Próximo: Objetos →
                </button>
              </div>
            </>
          )}

          {/* STEP 2: ITEMS */}
          {step === 'items' && (
            <>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                Quais objetos deseja registrar?
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>
                Objetos específicos recebem fotos individuais para comparação detalhada.
              </p>

              {/* Suggested items */}
              <div style={s.grid}>
                {SUGGESTED_ITEMS.map(item => (
                  <div key={item.id} style={s.chip(selectedItems.includes(item.id))} onClick={() => toggleItem(item.id)}>
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Custom items */}
              {customItems.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {customItems.map((item, i) => (
                    <div key={i} style={s.tag}>
                      {item}
                      <button onClick={() => setCustomItems(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add custom item */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  style={s.input} placeholder="+ Adicionar objeto personalizado"
                  value={newItem} onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                />
                <button style={s.btnOutline} onClick={addCustomItem}>Adicionar</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                <button style={s.btnOutline} onClick={() => setStep('rooms')}>
                  ← Voltar
                </button>
                <button style={s.btnGreen} onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : '✓ Salvar configuração'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}