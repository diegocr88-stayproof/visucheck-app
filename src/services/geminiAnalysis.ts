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

async function analyzeSinglePair(
  roomName: string,
  position: string,
  matrixUrl: string,
  exitUrl: string
): Promise<{ findings: any[]; conformities: string[]; score: number }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const [matrixB64, exitB64] = await Promise.all([
    imageUrlToBase64(matrixUrl),
    imageUrlToBase64(exitUrl),
  ])

  const prompt = `Voce e um perito em vistoria de imoveis. Analise este par de fotos do mesmo angulo do comodo "${roomName}".

FOTO 1 = estado original (referencia)
FOTO 2 = estado atual (apos uso)

Faca exatamente o seguinte:

1. Olhe a FOTO 1 com atencao. Liste os objetos que consegue ver CLARAMENTE.
2. Para cada objeto listado, verifique se ele aparece na FOTO 2.
3. Se um objeto da FOTO 1 NAO aparece na FOTO 2 = item faltante.

IMPORTANTE:
- Considere apenas objetos que voce ve com CLAREZA na foto 1
- Nao invente objetos que nao estao visiveis
- IGNORE diferencas de iluminacao e angulo
- Um objeto similar mas diferente NAO e faltante
- Apenas reporte o que tem CERTEZA

Responda em JSON valido sem markdown:
{
  "score": 95,
  "findings": [],
  "conformities": ["objeto — presente"]
}

- score: 100 se identico, menos 10-15 por item faltante confirmado
- type dos findings: "missing_item", "physical_damage" ou "stain"
- severity: "low", "medium" ou "high"
- description: descricao clara do objeto ausente
- location: onde estava na foto original
- Escreva em portugues brasileiro`

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: matrixB64 } },
      { inlineData: { mimeType: 'image/jpeg', data: exitB64 } },
      { text: prompt },
    ])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (error) {
    console.error('Pair analysis error:', error)
    return { findings: [], conformities: [], score: 100 }
  }
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

  const pairs = Object.keys(matrixByPos).filter(pos => exitByPos[pos])

  if (pairs.length === 0) {
    return {
      score: 100, condition: 'good',
      summary: 'Sem pares de fotos para comparar.',
      findings: [], conformities: [],
    }
  }

  // Analisa cada par com delay para evitar rate limit
  const pairResults: any[] = []
  for (const pos of pairs) {
    const result = await analyzeSinglePair(roomName, pos, matrixByPos[pos], exitByPos[pos])
    pairResults.push(result)
    await new Promise(r => setTimeout(r, 3000))
  }

  // Consolida removendo duplicatas
  const allFindings: any[] = []
  const seenDescriptions = new Set<string>()

  for (const pr of pairResults) {
    for (const f of (pr.findings || [])) {
      const key = f.type + '_' + f.description.toLowerCase().substring(0, 30)
      if (!seenDescriptions.has(key)) {
        seenDescriptions.add(key)
        allFindings.push(f)
      }
    }
  }

  const allConformities = [...new Set(pairResults.flatMap(r => r.conformities || []))]
  const avgScore = Math.round(pairResults.reduce((a, r) => a + (r.score || 100), 0) / pairResults.length)
  const condition = avgScore >= 75 ? 'good' : avgScore >= 50 ? 'warning' : 'critical'

  const summary = allFindings.length > 0
    ? `Foram identificadas ${allFindings.length} ocorrencia(s) no comodo ${roomName}.`
    : `Comodo ${roomName} sem divergencias significativas em relacao ao estado original.`

  return {
    score: avgScore,
    condition,
    summary,
    findings: allFindings,
    conformities: allConformities,
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

  const prompt = `Voce e um perito em vistoria de imoveis.

Analise o objeto "${itemName}":
- Primeiras fotos = estado ORIGINAL
- Ultimas fotos = estado ATUAL

Pergunta direta: O objeto "${itemName}" esta VISIVELMENTE PRESENTE nas fotos atuais?

Responda apenas com JSON valido:
{
  "score": 100,
  "condition": "good",
  "summary": "Objeto presente e em bom estado.",
  "findings": [],
  "conformities": ["${itemName} — presente e em bom estado"]
}

Se AUSENTE: score 0, condition "critical", finding type "missing_item" severity "high".
Escreva em portugues brasileiro.`

  try {
    const result = await model.generateContent([
      ...matrixParts,
      ...exitParts,
      { text: prompt },
    ])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return { ...parsed, conformities: parsed.conformities || [] }
  } catch {
    return {
      score: 0, condition: 'critical',
      summary: 'Erro ao processar analise.',
      findings: [], conformities: [],
    }
  }
}