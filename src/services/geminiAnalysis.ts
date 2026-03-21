import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export type AnalysisResult = {
  condition: 'good' | 'warning' | 'critical'
  score: number
  findings: {
    type: string
    severity: string
    description: string
    location: string
  }[]
  summary: string
  conformities: string[]
}

const POSITION_LABELS: Record<string, string> = {
  north: 'Canto 1 (frente esquerda)',
  east: 'Canto 2 (frente direita)',
  west: 'Canto 3 (fundo esquerda)',
  south: 'Canto 4 (fundo direita)',
}

async function analyzePair(
  roomName: string,
  position: string,
  matrixUrl: string,
  exitUrl: string
): Promise<{ findings: any[]; conformities: string[]; score: number; summary: string }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const posLabel = POSITION_LABELS[position] || position

  const [matrixBase64, exitBase64] = await Promise.all([
    imageUrlToBase64(matrixUrl),
    imageUrlToBase64(exitUrl),
  ])

  const prompt = `Voce e um perito forense em vistoria de imoveis de aluguel por temporada.

Voce recebera DUAS fotos do mesmo angulo do comodo "${roomName}" - posicao: ${posLabel}

FOTO 1 = ESTADO ORIGINAL (referencia)
FOTO 2 = ESTADO ATUAL (apos uso pelo inquilino)

As duas fotos foram tiradas do MESMO CANTO do ambiente. Compare-as diretamente.

PASSO 1 - INVENTARIO DA FOTO ORIGINAL:
Liste mentalmente TODOS os objetos visiveis nesta foto:
- Moveis, cadeiras, mesas, estantes
- Objetos sobre as superficies (garrafas, copos, capacetes, ferramentas, papeis, equipamentos)
- Decoracoes, plantas, quadros
- Estado das paredes, piso, teto visiveis neste angulo

PASSO 2 - COMPARE COM A FOTO ATUAL (mesmo angulo):
Para cada item listado, verifique se esta presente na foto atual.
IGNORE: diferencas de iluminacao, qualidade de foto, pequenas mudancas de angulo
REPORTE: itens claramente presentes na original e ausentes na atual

REGRAS:
- So reporte item faltante se tiver CERTEZA que ele estava na original e nao esta na atual
- Nao reporte "adicionado" a menos que seja algo OBVIAMENTE novo e relevante
- Seja conservador: na duvida, nao reporte

Responda APENAS em JSON valido, sem markdown:
{
  "score": 90,
  "summary": "Descricao objetiva das diferencas encontradas neste angulo.",
  "findings": [
    {
      "type": "missing_item",
      "severity": "medium", 
      "description": "Descricao especifica do item ausente",
      "location": "${posLabel}"
    }
  ],
  "conformities": ["Item especifico — presente e em bom estado"]
}

- score: 0-100 para este angulo especifico
- Desconte 10-20 por item faltante de valor, 5-10 por item pequeno, 3-8 por dano
- Escreva em portugues brasileiro`

  try {
    const result = await model.generateContent([
      { text: `=== FOTO ORIGINAL - ${roomName} - ${posLabel} ===` },
      { inlineData: { mimeType: 'image/jpeg', data: matrixBase64 } },
      { text: `=== FOTO ATUAL - ${roomName} - ${posLabel} ===` },
      { inlineData: { mimeType: 'image/jpeg', data: exitBase64 } },
      { text: prompt },
    ])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (error) {
    console.error('Pair analysis error:', error)
    return { findings: [], conformities: [], score: 100, summary: '' }
  }
}

export async function analyzeRoomPhotos(
  roomName: string,
  matrixPhotos: { position: string; url: string }[],
  exitPhotos: { position: string; url: string }[]
): Promise<AnalysisResult> {

  // Mapeia fotos por posicao
  const matrixByPos: Record<string, string> = {}
  matrixPhotos.forEach(p => { matrixByPos[p.position] = p.url })

  const exitByPos: Record<string, string> = {}
  exitPhotos.forEach(p => { exitByPos[p.position] = p.url })

  // Posicoes que tem par (original + atual)
  const positions = Object.keys(matrixByPos).filter(pos => exitByPos[pos])

  // Se nao tem pares, analisa tudo junto
  if (positions.length === 0) {
    return analyzeRoomAllPhotos(roomName, matrixPhotos, exitPhotos)
  }

  // Analisa cada par de fotos no mesmo angulo
  const pairResults = await Promise.all(
    positions.map(pos => analyzePair(roomName, pos, matrixByPos[pos], exitByPos[pos]))
  )

  // Consolida resultados
  const allFindings = pairResults.flatMap(r => r.findings || [])
  const allConformities = [...new Set(pairResults.flatMap(r => r.conformities || []))]
  const avgScore = Math.round(pairResults.reduce((a, r) => a + (r.score || 100), 0) / pairResults.length)
  const summaries = pairResults.filter(r => r.summary).map(r => r.summary)

  const condition = avgScore >= 75 ? 'good' : avgScore >= 50 ? 'warning' : 'critical'

  const summary = allFindings.length > 0
    ? `Analise por angulo identificou ${allFindings.length} ocorrencia(s). ${summaries[0] || ''}`
    : `Comodo em boas condicoes. ${summaries[0] || 'Nenhuma divergencia significativa encontrada.'}`

  return {
    score: avgScore,
    condition,
    summary,
    findings: allFindings,
    conformities: allConformities,
  }
}

// Fallback: analisa todas as fotos juntas quando nao ha pares por posicao
async function analyzeRoomAllPhotos(
  roomName: string,
  matrixPhotos: { position: string; url: string }[],
  exitPhotos: { position: string; url: string }[]
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const matrixParts = await Promise.all(
    matrixPhotos.map(async p => ({
      inlineData: { mimeType: 'image/jpeg', data: await imageUrlToBase64(p.url) }
    }))
  )
  const exitParts = await Promise.all(
    exitPhotos.map(async p => ({
      inlineData: { mimeType: 'image/jpeg', data: await imageUrlToBase64(p.url) }
    }))
  )

  const prompt = `Voce e um perito forense em vistoria de imoveis.
Compare as fotos do comodo "${roomName}".
Primeiras ${matrixPhotos.length} fotos = ESTADO ORIGINAL.
Ultimas ${exitPhotos.length} fotos = ESTADO ATUAL.

Faca inventario completo da referencia e verifique cada item no estado atual.
IGNORE diferencas de iluminacao e angulo.
So reporte itens com CERTEZA de ausencia.

JSON valido:
{
  "score": 90,
  "condition": "good",
  "summary": "Resumo objetivo.",
  "findings": [],
  "conformities": []
}
Escreva em portugues brasileiro.`

  try {
    const result = await model.generateContent([
      { text: `=== ESTADO ORIGINAL ===` }, ...matrixParts,
      { text: `=== ESTADO ATUAL ===` }, ...exitParts,
      { text: prompt },
    ])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return { ...parsed, conformities: parsed.conformities || [] }
  } catch {
    return { score: 100, condition: 'good', summary: 'Sem fotos para comparar.', findings: [], conformities: [] }
  }
}

export async function analyzeItemPhotos(
  itemName: string,
  matrixPhotos: { url: string }[],
  exitPhotos: { url: string }[]
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const matrixParts = await Promise.all(
    matrixPhotos.map(async p => ({
      inlineData: { mimeType: 'image/jpeg', data: await imageUrlToBase64(p.url) }
    }))
  )
  const exitParts = await Promise.all(
    exitPhotos.map(async p => ({
      inlineData: { mimeType: 'image/jpeg', data: await imageUrlToBase64(p.url) }
    }))
  )

  const prompt = `Voce e um perito forense em vistoria de imoveis.

Analise o objeto: "${itemName}"
IMAGENS DE REFERENCIA = estado original
IMAGENS ATUAIS = estado apos uso

O objeto "${itemName}" esta CLARAMENTE VISIVEL nas imagens atuais?
- SIM: verifique danos, manchas, pecas faltando
- NAO: registre como ITEM FALTANTE severity "high"

IGNORE diferencas de iluminacao e angulo.

JSON valido, sem markdown:
{
  "score": 90,
  "condition": "good",
  "summary": "Descricao objetiva do estado atual.",
  "findings": [],
  "conformities": ["${itemName} — presente e em bom estado"]
}

- Se AUSENTE: score 0, condition "critical", type "missing_item", severity "high"
- Escreva em portugues brasileiro`

  try {
    const result = await model.generateContent([
      { text: `=== IMAGEM ORIGINAL: "${itemName}" ===` }, ...matrixParts,
      { text: `=== IMAGEM ATUAL ===` }, ...exitParts,
      { text: prompt },
    ])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return { ...parsed, conformities: parsed.conformities || [] }
  } catch {
    return { score: 0, condition: 'critical', summary: 'Erro ao processar analise.', findings: [], conformities: [] }
  }
}