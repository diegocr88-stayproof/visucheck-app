import { supabase } from '../supabase'

export type AnalysisResult = {
  condition: 'good' | 'warning' | 'critical'
  score: number
  findings: { type: string; severity: string; description: string; location: string }[]
  summary: string
  conformities: string[]
}

export async function analyzeRoomPhotos(
  roomName: string,
  matrixPhotos: { position: string; url: string }[],
  exitPhotos: { position: string; url: string }[]
): Promise<AnalysisResult> {

  const matrixByPos: Record<string, string> = {}
  matrixPhotos.forEach(p => { matrixByPos[p.position] = p.url })
  const exitByPos: Record<string, string> = {}
  exitPhotos.forEach(p => { exitByPos[p.position] = p.url })

  try {
    const { data, error } = await supabase.functions.invoke('analyze-inspection', {
      body: { roomName, matrixPhotos: matrixByPos, exitPhotos: exitByPos },
    })

    if (error) throw error

    return {
      score: data.score || 100,
      condition: data.condition || 'good',
      summary: data.summary || '',
      findings: data.findings || [],
      conformities: data.conformities || [],
    }
  } catch (error) {
    console.error('Edge function error:', error)
    return {
      score: 0, condition: 'critical',
      summary: 'Erro ao processar analise. Tente novamente.',
      findings: [], conformities: [],
    }
  }
}

export async function analyzeItemPhotos(
  itemName: string,
  matrixPhotos: { url: string }[],
  exitPhotos: { url: string }[]
): Promise<AnalysisResult> {

  const matrixByPos: Record<string, string> = { '1': matrixPhotos[0]?.url || '' }
  const exitByPos: Record<string, string> = { '1': exitPhotos[0]?.url || '' }

  try {
    const { data, error } = await supabase.functions.invoke('analyze-inspection', {
      body: { roomName: itemName, matrixPhotos: matrixByPos, exitPhotos: exitByPos },
    })

    if (error) throw error

    return {
      score: data.score || 100,
      condition: data.condition || 'good',
      summary: data.summary || '',
      findings: data.findings || [],
      conformities: data.conformities || [],
    }
  } catch (error) {
    console.error('Edge function error:', error)
    return {
      score: 0, condition: 'critical',
      summary: 'Erro ao processar analise.',
      findings: [], conformities: [],
    }
  }
}