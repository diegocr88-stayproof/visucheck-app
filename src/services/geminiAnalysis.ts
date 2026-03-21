import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export type AnalysisResult = {
  condition: 'good' | 'warning' | 'critical'
  score: number
  findings: Finding[]
  summary: string
}

export type Finding = {
  type: 'missing_item' | 'physical_damage' | 'stain' | 'general_condition'
  severity: 'low' | 'medium' | 'high'
  description: string
  location: string
}

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

export async function analyzeRoomPhotos(
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

  const prompt = `Você é um perito em vistoria de imóveis de aluguel por temporada. Sua análise deve ser RIGOROSA e DETALHADA.

Analise as fotos do cômodo "${roomName}":
- As primeiras ${matrixPhotos.length} foto(s) são o ESTADO ORIGINAL (foto matriz) — referência
- As últimas ${exitPhotos.length} foto(s) são o ESTADO ATUAL após uso pelo inquilino

ANALISE MINUCIOSAMENTE e identifique QUALQUER diferença, por menor que seja:

1. ITENS FALTANTES: Móveis, objetos, acessórios, quadros, plantas, almofadas, tapetes — qualquer item presente na foto original que não apareça na foto atual
2. DANOS FÍSICOS: Riscos, arranhões, quebrados, amassados, furos, lascas, trincas em paredes, pisos, móveis ou janelas
3. MANCHAS E SUJEIRA: Manchas nas paredes, teto, piso, móveis — qualquer sujeira visível
4. ALTERAÇÕES: Móveis movidos, itens trocados de lugar, persianas/cortinas danificadas
5. DESGASTE EXCESSIVO: Desgaste além do normal para o período de uso

SEJA CRÍTICO: Se houver qualquer dúvida sobre um item, registre como ocorrência.
Se um objeto estava na foto original e não aparece claramente na foto atual, registre como ITEM FALTANTE.

Responda APENAS em JSON válido, sem markdown, sem explicações:
{
  "score": 85,
  "condition": "good",
  "summary": "Resumo detalhado do estado geral do cômodo comparado ao original.",
  "findings": [
    {
      "type": "missing_item",
      "severity": "high",
      "description": "Descrição específica do que foi encontrado",
      "location": "Localização exata no cômodo"
    }
  ]
}

Regras:
- score: 0-100 (100 = idêntico ao original, 0 = completamente diferente/destruído)
- Desconte 5-10 pontos por item faltante, 3-8 por dano físico, 2-5 por mancha
- condition: "good" (score >= 75), "warning" (score 50-74), "critical" (score < 50)
- type: "missing_item", "physical_damage", "stain" ou "general_condition"
- severity: "low" (cosmético), "medium" (visível mas reparável), "high" (sério/custoso)
- Se não houver problemas reais, retorne findings como array vazio []
- Escreva TUDO em português brasileiro
- Seja específico nas descrições — evite termos genéricos`

  try {
    const result = await model.generateContent([prompt, ...matrixParts, ...exitParts])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as AnalysisResult
  } catch (error) {
    console.error('Gemini analysis error:', error)
    return {
      score: 0,
      condition: 'critical',
      summary: 'Erro ao processar análise. Tente novamente.',
      findings: [],
    }
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

  const prompt = `Você é um perito em vistoria de imóveis de aluguel por temporada. Análise RIGOROSA e DETALHADA.

Analise o objeto "${itemName}":
- As primeiras ${matrixPhotos.length} foto(s) são o ESTADO ORIGINAL
- As últimas ${exitPhotos.length} foto(s) são o ESTADO ATUAL após uso

VERIFIQUE MINUCIOSAMENTE:
1. O objeto está PRESENTE? Se não aparecer nas fotos atuais = ITEM FALTANTE (severity: high)
2. Há riscos, arranhões, quebrados, manchas, deformações?
3. O estado atual é significativamente pior que o original?

Responda APENAS em JSON válido, sem markdown:
{
  "score": 90,
  "condition": "good",
  "summary": "Descrição detalhada do estado atual do objeto comparado ao original.",
  "findings": []
}

- score: 0-100 (100 = idêntico, 0 = ausente ou destruído)
- Se AUSENTE: score 0, condition "critical", finding type "missing_item" severity "high"
- condition: "good" (>=75), "warning" (50-74), "critical" (<50)
- Escreva em português brasileiro
- Seja específico e rigoroso`

  try {
    const result = await model.generateContent([prompt, ...matrixParts, ...exitParts])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as AnalysisResult
  } catch (error) {
    console.error('Gemini analysis error:', error)
    return {
      score: 0,
      condition: 'critical',
      summary: 'Erro ao processar análise. Tente novamente.',
      findings: [],
    }
  }
}