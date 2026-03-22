import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'
import { generateInspectionReport } from '../services/generateReport'

type AnalysisResult = {
  condition: 'good' | 'warning' | 'critical'
  score: number
  findings: { type: string; severity: string; description: string; location: string }[]
  summary: string
  conformities: string[]
}

type RoomAnalysis = {
  room: { id: string; name: string }
  status: 'pending' | 'analyzing' | 'done' | 'error'
  progress: number
  progressLabel: string
  result?: AnalysisResult
  exitPhotos?: string[]
  matrixPhotos?: string[]
}

type ItemAnalysis = {
  item: { id: string; name: string }
  status: 'pending' | 'analyzing' | 'done' | 'error'
  progress: number
  result?: AnalysisResult
  exitPhotos?: string[]
  matrixPhotos?: string[]
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
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const progressIntervals = useRef<Record<string, any>>({})

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
    setRoomAnalyses((rooms || []).map(r => ({ room: r, status: 'pending', progress: 0, progressLabel: 'Aguardando...' })))
    setItemAnalyses((items || []).map(i => ({ item: i, status: 'pending', progress: 0, result: undefined })))
    setLoading(false)
  }

  function startProgressAnimation(id: string, labels: string[]) {
    let step = 0
    const steps = [
      { progress: 10, label: labels[0] || 'Iniciando análise...' },
      { progress: 25, label: labels[1] || 'Fotografando ambiente original...' },
      { progress: 45, label: labels[2] || 'Analisando estado atual...' },
      { progress: 65, label: labels[3] || 'Comparando inventários...' },
      { progress: 80, label: labels[4] || 'Identificando divergências...' },
      { progress: 92, label: labels[5] || 'Finalizando análise...' },
    ]

    progressIntervals.current[id] = setInterval(() => {
      if (step < steps.length) {
        const { progress, label } = steps[step]
        setRoomAnalyses(prev => prev.map(r =>
          r.room.id === id ? { ...r, progress, progressLabel: label } : r
        ))
        step++
      }
    }, 4000)
  }

  function stopProgressAnimation(id: string) {
    if (progressIntervals.current[id]) {
      clearInterval(progressIntervals.current[id])
      delete progressIntervals.current[id]
    }
  }

  async function startAnalysis() {
    if (!inspectionId || !inspection) return
    setAnalyzing(true)

    const { data: matrixPhotos } = await supabase.from('matrix_photos').select('*').eq('property_id', inspection.property_id)
    const { data: exitPhotos } = await supabase.from('inspection_photos').select('*').eq('inspection_id', inspectionId)

    const scores: number[] = []

    // Analisa cômodos
    for (let i = 0; i < roomAnalyses.length; i++) {
      const ra = roomAnalyses[i]

      setRoomAnalyses(prev => prev.map((r, idx) => idx === i ? {
        ...r, status: 'analyzing', progress: 5, progressLabel: 'Iniciando análise...'
      } : r))

      startProgressAnimation(ra.room.id, [
        'Iniciando análise...',
        'Criando inventário do estado original...',
        'Criando inventário do estado atual...',
        'Comparando os dois estados...',
        'Identificando divergências...',
        'Finalizando...',
      ])

      const matrixForRoom = (matrixPhotos || []).filter(p => p.room_id === ra.room.id).map(p => ({ position: p.position, url: p.photo_url }))
      const exitForRoom = (exitPhotos || []).filter(p => p.room_id === ra.room.id).map(p => ({ position: p.position, url: p.photo_url }))

      if (matrixForRoom.length === 0 && exitForRoom.length === 0) {
        stopProgressAnimation(ra.room.id)
        setRoomAnalyses(prev => prev.map((r, idx) => idx === i ? {
          ...r, status: 'done', progress: 100, progressLabel: 'Concluído',
          result: { score: 100, condition: 'good', summary: 'Sem fotos para comparar.', findings: [], conformities: [] },
          matrixPhotos: [], exitPhotos: [],
        } : r))
        continue
      }

      const matrixByPos: Record<string, string> = {}
      matrixForRoom.forEach(p => { matrixByPos[p.position] = p.url })
      const exitByPos: Record<string, string> = {}
      exitForRoom.forEach(p => { exitByPos[p.position] = p.url })

      try {
        const { data, error } = await supabase.functions.invoke('analyze-inspection', {
          body: { roomName: ra.room.name, matrixPhotos: matrixByPos, exitPhotos: exitByPos },
        })

        stopProgressAnimation(ra.room.id)

        if (error) throw error

        scores.push(data.score || 100)
        setRoomAnalyses(prev => prev.map((r, idx) => idx === i ? {
          ...r, status: 'done', progress: 100, progressLabel: 'Análise concluída!',
          result: data,
          matrixPhotos: matrixForRoom.map(p => p.url),
          exitPhotos: exitForRoom.map(p => p.url),
        } : r))
      } catch {
        stopProgressAnimation(ra.room.id)
        setRoomAnalyses(prev => prev.map((r, idx) => idx === i ? {
          ...r, status: 'error', progress: 0, progressLabel: 'Erro na análise'
        } : r))
      }
    }

    // Analisa objetos
    for (let i = 0; i < itemAnalyses.length; i++) {
      const ia = itemAnalyses[i]
      setItemAnalyses(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'analyzing', progress: 20 } : item))

      const matrixForItem = (matrixPhotos || []).filter(p => p.item_id === ia.item.id).map(p => ({ url: p.photo_url }))
      const exitForItem = (exitPhotos || []).filter(p => p.item_id === ia.item.id).map(p => ({ url: p.photo_url }))

      if (matrixForItem.length === 0 && exitForItem.length === 0) {
        setItemAnalyses(prev => prev.map((item, idx) => idx === i ? {
          ...item, status: 'done', progress: 100,
          result: { score: 100, condition: 'good', summary: 'Sem fotos para comparar.', findings: [], conformities: [] },
          matrixPhotos: [], exitPhotos: [],
        } : item))
        continue
      }

      const matrixByPos: Record<string, string> = {}
      matrixForItem.forEach((p, idx) => { matrixByPos[String(idx + 1)] = p.url })
      const exitByPos: Record<string, string> = {}
      exitForItem.forEach((p, idx) => { exitByPos[String(idx + 1)] = p.url })

      try {
        const { data, error } = await supabase.functions.invoke('analyze-inspection', {
          body: { roomName: ia.item.name, matrixPhotos: matrixByPos, exitPhotos: exitByPos },
        })

        if (error) throw error

        scores.push(data.score || 100)
        setItemAnalyses(prev => prev.map((item, idx) => idx === i ? {
          ...item, status: 'done', progress: 100, result: data,
          matrixPhotos: matrixForItem.map(p => p.url),
          exitPhotos: exitForItem.map(p => p.url),
        } : item))
      } catch {
        setItemAnalyses(prev => prev.map((item, idx) => idx === i ? {
          ...item, status: 'error', progress: 0
        } : item))
      }
    }

    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100
    setOverallScore(avg)
    await supabase.from('inspections').update({ status: 'completed' }).eq('id', inspectionId)
    setAnalyzing(false)
    setDone(true)
  }

  async function handleGeneratePDF() {
    setGeneratingPDF(true)
    const rooms = [
      ...roomAnalyses.filter(ra => ra.status === 'done' && ra.result).map(ra => ({
        name: ra.room.name, score: ra.result!.score, condition: ra.result!.condition,
        summary: ra.result!.summary, findings: ra.result!.findings, conformities: ra.result!.conformities,
        matrixPhotos: ra.matrixPhotos || [], exitPhotos: ra.exitPhotos || [],
      })),
      ...itemAnalyses.filter(ia => ia.status === 'done' && ia.result).map(ia => ({
        name: ia.item.name, score: ia.result!.score, condition: ia.result!.condition,
        summary: ia.result!.summary, findings: ia.result!.findings, conformities: ia.result!.conformities,
        matrixPhotos: ia.matrixPhotos || [], exitPhotos: ia.exitPhotos || [],
      })),
    ]
    await generateInspectionReport({
      propertyName: property?.name || 'Imóvel',
      propertyAddress: property?.address || '',
      inspectionDate: new Date(inspection?.created_at).toLocaleString('pt-BR'),
      overallScore,
      rooms,
    })
    setGeneratingPDF(false)
  }

  const getConditionColor = (condition: string) => ({
    good: { bg: '#D4EDDA', color: '#155724', border: '#C3E6CB', label: 'Bom' },
    warning: { bg: '#FFF3CD', color: '#856404', border: '#FFEEBA', label: 'Atenção' },
    critical: { bg: '#FDECEA', color: '#C0392B', border: '#F5C6CB', label: 'Crítico' },
  }[condition] || { bg: '#eee', color: '#333', border: '#ccc', label: condition })

  const getSeverityConfig = (severity: string) => ({
    low: { color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', label: 'Baixa' },
    medium: { color: '#991B1B', bg: '#FEE2E2', border: '#FECACA', label: 'Média' },
    high: { color: '#7F1D1D', bg: '#FDECEA', border: '#FCA5A5', label: 'Alta' },
  }[severity] || { color: '#333', bg: '#eee', border: '#ccc', label: severity })

  const getTypeLabel = (type: string) => ({
    missing_item: '📦 Item faltante',
    physical_damage: '🔨 Dano físico',
    stain: '🫧 Mancha/Sujeira',
    structural: '🏗️ Alteração estrutural',
    added_item: '➕ Item adicionado',
    general_condition: '📊 Condição geral',
  }[type] || type)

  const totalFindings = [...roomAnalyses, ...itemAnalyses].reduce((acc, a) => acc + (a.result?.findings.length || 0), 0)
  const totalConformities = [...roomAnalyses, ...itemAnalyses].reduce((acc, a) => acc + (a.result?.conformities.length || 0), 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: 'var(--muted)' }}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <Navbar />

      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Foto" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '24px', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <style>{`
        .analysis-inner { padding: 100px 48px 80px; max-width: 960px; margin: 0 auto; }
        @media (max-width: 768px) { .analysis-inner { padding: 80px 16px 60px; } }
        @keyframes progressPulse { 0%,100% { opacity:1 } 50% { opacity:0.6 } }
      `}</style>

      <div className="analysis-inner">

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate(`/inspection/${inspectionId}/upload`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Voltar para upload
          </button>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-1px', marginBottom: '4px' }}>
            Análise com IA
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--muted)' }}>
            {property?.name} • Vistoria de Saída • {new Date(inspection?.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Start button */}
        {!analyzing && !done && (
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border)', padding: '56px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>🤖</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>Pronto para analisar</h2>
            <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '6px' }}>
              A IA criará um inventário completo de cada ambiente e comparará com o estado original.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '36px' }}>
              {roomAnalyses.length} cômodo(s) e {itemAnalyses.length} objeto(s) • Cada análise leva ~30 segundos
            </p>
            <button onClick={startAnalysis} style={{ padding: '14px 36px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(46,204,138,0.4)' }}>
              🤖 Iniciar análise com IA
            </button>
          </div>
        )}

        {/* Overall score */}
        {done && (
          <div style={{ background: overallScore >= 75 ? 'var(--navy)' : overallScore >= 50 ? '#7C4F00' : '#7F1D1D', borderRadius: '20px', padding: '36px', marginBottom: '28px', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.7, marginBottom: '8px' }}>Condição geral do imóvel</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '72px', fontWeight: 800, lineHeight: 1, marginBottom: '8px' }}>{overallScore}%</div>
                  <div style={{ fontSize: '16px', opacity: 0.85 }}>
                    {overallScore >= 75 ? '✅ Imóvel em boas condições' : overallScore >= 50 ? '⚠️ Imóvel com pontos de atenção' : '🚨 Imóvel com danos significativos'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { value: totalFindings, label: 'Ocorrências' },
                    { value: totalConformities, label: 'Conformes' },
                    { value: roomAnalyses.length + itemAnalyses.length, label: 'Analisados' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px 20px', textAlign: 'center', minWidth: '100px' }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800 }}>{stat.value}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '24px', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${overallScore}%`, background: overallScore >= 75 ? 'var(--green)' : overallScore >= 50 ? '#F59E0B' : '#EF4444', borderRadius: '4px', transition: 'width 1s ease' }} />
              </div>
            </div>
          </div>
        )}

        {/* Rooms */}
        {(analyzing || done) && roomAnalyses.length > 0 && (
          <>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px' }}>🏠 Cômodos</h2>
            {roomAnalyses.map(ra => (
              <RoomCard key={ra.room.id} name={ra.room.name} status={ra.status} result={ra.result}
                progress={ra.progress} progressLabel={ra.progressLabel}
                matrixPhotos={ra.matrixPhotos || []} exitPhotos={ra.exitPhotos || []}
                onPhotoClick={setLightbox} getConditionColor={getConditionColor}
                getSeverityConfig={getSeverityConfig} getTypeLabel={getTypeLabel} />
            ))}
          </>
        )}

        {/* Items */}
        {(analyzing || done) && itemAnalyses.length > 0 && (
          <>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px', marginTop: '32px' }}>📦 Objetos</h2>
            {itemAnalyses.map(ia => (
              <RoomCard key={ia.item.id} name={ia.item.name} status={ia.status} result={ia.result}
                progress={ia.progress} progressLabel=""
                matrixPhotos={ia.matrixPhotos || []} exitPhotos={ia.exitPhotos || []}
                onPhotoClick={setLightbox} getConditionColor={getConditionColor}
                getSeverityConfig={getSeverityConfig} getTypeLabel={getTypeLabel} />
            ))}
          </>
        )}

        {/* Actions */}
        {done && (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '40px', flexWrap: 'wrap' }}>
            <button style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, background: 'transparent', color: 'var(--navy)', border: '1.5px solid var(--border)', cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </button>
            <button style={{ padding: '13px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, background: 'var(--navy)', color: 'white', border: 'none', cursor: 'pointer', opacity: generatingPDF ? 0.7 : 1 }}
              onClick={handleGeneratePDF} disabled={generatingPDF}>
              {generatingPDF ? '⏳ Gerando PDF...' : '📄 Baixar Relatório PDF'}
            </button>
            <button style={{ padding: '13px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 16px rgba(46,204,138,0.35)' }}
              onClick={() => navigate('/dashboard')}>
              ✓ Concluir vistoria
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RoomCard({ name, status, result, progress, progressLabel, matrixPhotos, exitPhotos, onPhotoClick, getConditionColor, getSeverityConfig, getTypeLabel }: {
  name: string; status: string; result?: any; progress: number; progressLabel: string
  matrixPhotos: string[]; exitPhotos: string[]
  onPhotoClick: (url: string) => void
  getConditionColor: (c: string) => any
  getSeverityConfig: (s: string) => any
  getTypeLabel: (t: string) => string
}) {
  const cc = result ? getConditionColor(result.condition) : null

  return (
    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 2px 12px rgba(11,45,82,0.06)' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: result ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '20px' }}>
            {status === 'pending' && '⏳'}
            {status === 'analyzing' && '🔄'}
            {status === 'done' && '✅'}
            {status === 'error' && '❌'}
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 700, color: 'var(--navy)' }}>{name}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '1px' }}>
              {status === 'pending' && 'Aguardando análise...'}
              {status === 'analyzing' && progressLabel}
              {status === 'done' && `${result?.findings?.length || 0} ocorrência(s) • ${result?.conformities?.length || 0} conforme(s)`}
              {status === 'error' && 'Erro na análise'}
            </div>
          </div>
        </div>
        {result && cc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800, color: cc.color, lineHeight: 1 }}>{result.score}%</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>condição</div>
            </div>
            <div style={{ padding: '6px 14px', borderRadius: '100px', background: cc.bg, color: cc.color, border: `1px solid ${cc.border}`, fontSize: '13px', fontWeight: 600 }}>
              {cc.label}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {status === 'analyzing' && (
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{progressLabel}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)' }}>{progress}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--cream)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--green), #1FA870)',
              borderRadius: '3px',
              transition: 'width 0.8s ease',
              animation: 'progressPulse 2s ease infinite',
            }} />
          </div>
        </div>
      )}

      {result && (
        <div style={{ padding: '24px' }}>
          {/* Summary */}
          <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--cream)', marginBottom: '24px', borderLeft: `4px solid ${cc?.color || 'var(--navy)'}` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>Resumo da análise</div>
            <p style={{ fontSize: '14px', color: 'var(--navy)', lineHeight: 1.65 }}>{result.summary}</p>
          </div>

          {/* Photos */}
          {(matrixPhotos.length > 0 || exitPhotos.length > 0) && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--navy)', display: 'inline-block' }} />
                    Estado original
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: matrixPhotos.length > 1 ? '1fr 1fr' : '1fr', gap: '8px' }}>
                    {matrixPhotos.slice(0, 4).map((url, i) => (
                      <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', border: '2px solid rgba(11,45,82,0.1)' }} onClick={() => onPhotoClick(url)}>
                        <img src={url} alt={`Original ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: result.findings.length > 0 ? '#EF4444' : 'var(--green)', display: 'inline-block' }} />
                    Estado atual
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: exitPhotos.length > 1 ? '1fr 1fr' : '1fr', gap: '8px' }}>
                    {exitPhotos.slice(0, 4).map((url, i) => (
                      <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', border: `2px solid ${result.findings.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(46,204,138,0.3)'}` }} onClick={() => onPhotoClick(url)}>
                        <img src={url} alt={`Atual ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Findings */}
          {result.findings.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FDECEA', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>⚠</span>
                {result.findings.length} ocorrência(s) encontrada(s)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.findings.map((f: any, fi: number) => {
                  const sc = getSeverityConfig(f.severity)
                  return (
                    <div key={fi} style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        {f.type === 'missing_item' ? '📦' : f.type === 'physical_damage' ? '🔨' : f.type === 'stain' ? '🫧' : f.type === 'structural' ? '🏗️' : '⚠️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: sc.color }}>{getTypeLabel(f.type)}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: 'white', color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: sc.color, lineHeight: 1.5, margin: 0 }}>{f.description}</p>
                        {f.location && <p style={{ fontSize: '11px', color: sc.color, opacity: 0.7, margin: '4px 0 0' }}>📍 {f.location}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Conformities */}
          {result.conformities && result.conformities.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#155724', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#D4EDDA', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>✓</span>
                {result.conformities.length} item(ns) em conformidade
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                {result.conformities.map((c: string, ci: number) => (
                  <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: '#F0FFF4', border: '1px solid #C3E6CB', fontSize: '13px', color: '#155724' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>✅</span>
                    <span style={{ lineHeight: 1.4 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}