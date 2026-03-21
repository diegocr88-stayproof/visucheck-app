import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'
import { analyzeRoomPhotos, analyzeItemPhotos } from '../services/geminiAnalysis'

type AnalysisResult = {
  condition: 'good' | 'warning' | 'critical'
  score: number
  findings: { type: string; severity: string; description: string; location: string }[]
  summary: string
}

type Room = { id: string; name: string }
type Item = { id: string; name: string }
type Photo = { id: string; room_id: string | null; item_id: string | null; position: string; photo_url: string }

type RoomAnalysis = {
  room: Room
  status: 'pending' | 'analyzing' | 'done' | 'error'
  result?: AnalysisResult
}

type ItemAnalysis = {
  item: Item
  status: 'pending' | 'analyzing' | 'done' | 'error'
  result?: AnalysisResult
}

export default function InspectionAnalysis() {
  const { inspectionId } = useParams()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [roomAnalyses, setRoomAnalyses] = useState<RoomAnalysis[]>([])
  const [itemAnalyses, setItemAnalyses] = useState<ItemAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [done, setDone] = useState(false)
  const [overallScore, setOverallScore] = useState(0)

  useEffect(() => { if (inspectionId) fetchData() }, [inspectionId])

  async function fetchData() {
    setLoading(true)
    const { data: insp } = await supabase.from('inspections').select('*').eq('id', inspectionId).single()
    if (!insp) return
    setInspection(insp)

    const { data: prop } = await supabase.from('properties').select('*').eq('id', insp.property_id).single()
    setProperty(prop)

    const { data: rooms } = await supabase.from('rooms').select('*').eq('property_id', insp.property_id)
    const { data: items } = await supabase.from('items').select('*').eq('property_id', insp.property_id)

    setRoomAnalyses((rooms || []).map(r => ({ room: r, status: 'pending' })))
    setItemAnalyses((items || []).map(i => ({ item: i, status: 'pending' })))
    setLoading(false)
  }

  async function startAnalysis() {
    if (!inspectionId || !inspection) return
    setAnalyzing(true)

    const { data: matrixPhotos } = await supabase.from('matrix_photos').select('*').eq('property_id', inspection.property_id)
    const { data: exitPhotos } = await supabase.from('inspection_photos').select('*').eq('inspection_id', inspectionId)

    const scores: number[] = []

    // Analisa cada cômodo
    for (let i = 0; i < roomAnalyses.length; i++) {
      const ra = roomAnalyses[i]

      setRoomAnalyses(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'analyzing' } : r
      ))

      const matrixForRoom = (matrixPhotos || [])
        .filter(p => p.room_id === ra.room.id)
        .map(p => ({ position: p.position, url: p.photo_url }))

      const exitForRoom = (exitPhotos || [])
        .filter(p => p.room_id === ra.room.id)
        .map(p => ({ position: p.position, url: p.photo_url }))

      if (matrixForRoom.length === 0 && exitForRoom.length === 0) {
        setRoomAnalyses(prev => prev.map((r, idx) =>
          idx === i ? { ...r, status: 'done', result: { score: 100, condition: 'good', summary: 'Sem fotos para comparar.', findings: [] } } : r
        ))
        continue
      }

      try {
        const result = await analyzeRoomPhotos(ra.room.name, matrixForRoom, exitForRoom)
        scores.push(result.score)
        setRoomAnalyses(prev => prev.map((r, idx) =>
          idx === i ? { ...r, status: 'done', result } : r
        ))
      } catch {
        setRoomAnalyses(prev => prev.map((r, idx) =>
          idx === i ? { ...r, status: 'error' } : r
        ))
      }
    }

    // Analisa cada objeto
    for (let i = 0; i < itemAnalyses.length; i++) {
      const ia = itemAnalyses[i]

      setItemAnalyses(prev => prev.map((item, idx) =>
        idx === i ? { ...item, status: 'analyzing' } : item
      ))

      const matrixForItem = (matrixPhotos || [])
        .filter(p => p.item_id === ia.item.id)
        .map(p => ({ url: p.photo_url }))

      const exitForItem = (exitPhotos || [])
        .filter(p => p.item_id === ia.item.id)
        .map(p => ({ url: p.photo_url }))

      if (matrixForItem.length === 0 && exitForItem.length === 0) {
        setItemAnalyses(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'done', result: { score: 100, condition: 'good', summary: 'Sem fotos para comparar.', findings: [] } } : item
        ))
        continue
      }

      try {
        const result = await analyzeItemPhotos(ia.item.name, matrixForItem, exitForItem)
        scores.push(result.score)
        setItemAnalyses(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'done', result } : item
        ))
      } catch {
        setItemAnalyses(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'error' } : item
        ))
      }
    }

    // Calcula score geral
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100
    setOverallScore(avg)

    // Atualiza status da vistoria
    await supabase.from('inspections').update({ status: 'completed' }).eq('id', inspectionId)

    setAnalyzing(false)
    setDone(true)
  }

  const getConditionColor = (condition: string) => ({
    good: { bg: '#D4EDDA', color: '#155724', label: 'Bom' },
    warning: { bg: '#FFF3CD', color: '#856404', label: 'Atenção' },
    critical: { bg: '#FDECEA', color: '#C0392B', label: 'Crítico' },
  }[condition] || { bg: '#eee', color: '#333', label: condition })

  const getSeverityColor = (severity: string) => ({
    low: '#F59E0B',
    medium: '#EF4444',
    high: '#991B1B',
  }[severity] || '#999')

  const getTypeLabel = (type: string) => ({
    missing_item: '📦 Item faltante',
    physical_damage: '🔨 Dano físico',
    stain: '🫧 Mancha/Sujeira',
    general_condition: '📊 Condição geral',
  }[type] || type)

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)' } as React.CSSProperties,
    inner: { paddingTop: '100px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', maxWidth: '900px', margin: '0 auto' } as React.CSSProperties,
    card: { background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', marginBottom: '16px' } as React.CSSProperties,
    btnGreen: { padding: '13px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 16px rgba(46,204,138,0.35)' } as React.CSSProperties,
    btnOutline: { padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, background: 'transparent', color: 'var(--navy)', border: '1.5px solid var(--border)', cursor: 'pointer' } as React.CSSProperties,
  }

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: 'var(--muted)' }}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.inner}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate(`/inspection/${inspectionId}/upload`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Voltar para upload
          </button>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px', marginBottom: '6px' }}>
            Análise com IA
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--muted)' }}>
            {property?.name} • Vistoria de Saída
          </p>
        </div>

        {/* Score geral quando done */}
        {done && (
          <div style={{ background: overallScore >= 75 ? '#D4EDDA' : overallScore >= 50 ? '#FFF3CD' : '#FDECEA', borderRadius: '20px', padding: '32px', marginBottom: '24px', textAlign: 'center', border: `1px solid ${overallScore >= 75 ? '#C3E6CB' : overallScore >= 50 ? '#FFEEBA' : '#F5C6CB'}` }}>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: overallScore >= 75 ? '#155724' : overallScore >= 50 ? '#856404' : '#C0392B', marginBottom: '8px' }}>
              Condição Geral do Imóvel
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '64px', fontWeight: 800, color: overallScore >= 75 ? '#155724' : overallScore >= 50 ? '#856404' : '#C0392B', lineHeight: 1 }}>
              {overallScore}%
            </div>
            <div style={{ fontSize: '15px', color: overallScore >= 75 ? '#155724' : overallScore >= 50 ? '#856404' : '#C0392B', marginTop: '8px' }}>
              {overallScore >= 75 ? '✅ Imóvel em boas condições' : overallScore >= 50 ? '⚠️ Imóvel com pontos de atenção' : '🚨 Imóvel com danos significativos'}
            </div>
          </div>
        )}

        {/* Start button */}
        {!analyzing && !done && (
          <div style={{ ...s.card, textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
              Pronto para analisar
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '8px' }}>
              A IA irá comparar as fotos de saída com as fotos originais de cada cômodo e objeto.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '32px' }}>
              {roomAnalyses.length} cômodo(s) e {itemAnalyses.length} objeto(s) serão analisados
            </p>
            <button style={s.btnGreen} onClick={startAnalysis}>
              🤖 Iniciar análise com IA
            </button>
          </div>
        )}

        {/* Analysis progress */}
        {(analyzing || done) && (
          <>
            {/* Rooms */}
            {roomAnalyses.length > 0 && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px' }}>
                  🏠 Cômodos
                </h2>
                {roomAnalyses.map((ra, i) => (
                  <div key={ra.room.id} style={s.card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: ra.result ? '16px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '22px' }}>
                          {ra.status === 'pending' && '⏳'}
                          {ra.status === 'analyzing' && '🔄'}
                          {ra.status === 'done' && '✅'}
                          {ra.status === 'error' && '❌'}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>{ra.room.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            {ra.status === 'pending' && 'Aguardando...'}
                            {ra.status === 'analyzing' && 'Analisando com IA...'}
                            {ra.status === 'done' && 'Análise concluída'}
                            {ra.status === 'error' && 'Erro na análise'}
                          </div>
                        </div>
                      </div>
                      {ra.result && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 800, color: ra.result.score >= 75 ? '#155724' : ra.result.score >= 50 ? '#856404' : '#C0392B' }}>
                            {ra.result.score}%
                          </span>
                          <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, ...getConditionColor(ra.result.condition) }}>
                            {getConditionColor(ra.result.condition).label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Analyzing spinner */}
                    {ra.status === 'analyzing' && (
                      <div style={{ height: '4px', background: 'var(--cream)', borderRadius: '2px', overflow: 'hidden', marginTop: '12px' }}>
                        <div style={{ height: '100%', background: 'var(--green)', borderRadius: '2px', width: '60%', animation: 'pulse 1.5s ease infinite' }} />
                      </div>
                    )}

                    {/* Results */}
                    {ra.result && (
                      <>
                        <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: ra.result.findings.length > 0 ? '16px' : '0', fontStyle: 'italic' }}>
                          {ra.result.summary}
                        </p>
                        {ra.result.findings.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {ra.result.findings.map((f, fi) => (
                              <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'var(--cream)', border: `1px solid ${getSeverityColor(f.severity)}22` }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getSeverityColor(f.severity), flexShrink: 0, marginTop: '5px' }} />
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>{getTypeLabel(f.type)}</div>
                                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{f.description}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>📍 {f.location}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Items */}
            {itemAnalyses.length > 0 && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--navy)', margin: '24px 0 16px' }}>
                  📦 Objetos
                </h2>
                {itemAnalyses.map((ia, i) => (
                  <div key={ia.item.id} style={s.card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '22px' }}>
                          {ia.status === 'pending' && '⏳'}
                          {ia.status === 'analyzing' && '🔄'}
                          {ia.status === 'done' && '✅'}
                          {ia.status === 'error' && '❌'}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>{ia.item.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            {ia.status === 'pending' && 'Aguardando...'}
                            {ia.status === 'analyzing' && 'Analisando com IA...'}
                            {ia.status === 'done' && 'Análise concluída'}
                            {ia.status === 'error' && 'Erro na análise'}
                          </div>
                        </div>
                      </div>
                      {ia.result && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 800, color: ia.result.score >= 75 ? '#155724' : ia.result.score >= 50 ? '#856404' : '#C0392B' }}>
                            {ia.result.score}%
                          </span>
                          <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, ...getConditionColor(ia.result.condition) }}>
                            {getConditionColor(ia.result.condition).label}
                          </span>
                        </div>
                      )}
                    </div>

                    {ia.status === 'analyzing' && (
                      <div style={{ height: '4px', background: 'var(--cream)', borderRadius: '2px', overflow: 'hidden', marginTop: '12px' }}>
                        <div style={{ height: '100%', background: 'var(--green)', borderRadius: '2px', width: '60%', animation: 'pulse 1.5s ease infinite' }} />
                      </div>
                    )}

                    {ia.result && ia.result.findings.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                        {ia.result.findings.map((f, fi) => (
                          <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'var(--cream)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getSeverityColor(f.severity), flexShrink: 0, marginTop: '5px' }} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>{getTypeLabel(f.type)}</div>
                              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{f.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Done actions */}
            {done && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
                <button style={s.btnOutline} onClick={() => navigate('/dashboard')}>
                  Voltar ao Dashboard
                </button>
                <button style={s.btnGreen} onClick={() => navigate('/dashboard')}>
                  ✓ Concluir vistoria
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}