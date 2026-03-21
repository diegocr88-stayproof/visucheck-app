import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY)

export type AnalysisResult = {
  condition: 'good' | 'warning' | 'critical'
  score: number // 0-100
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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  // Converte fotos para base64
  const matrixParts = await Promise.all(
    matrixPhotos.map(async p => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: await imageUrlToBase64(p.url),
      }
    }))
  )

  const exitParts = await Promise.all(
    exitPhotos.map(async p => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: await imageUrlToBase64(p.url),
      }
    }))
  )

  const prompt = `Você é um especialista em vistoria de imóveis de aluguel por temporada.

Analise as fotos do cômodo "${roomName}":
- As primeiras ${matrixPhotos.length} foto(s) são o ESTADO ORIGINAL (foto matriz) do imóvel
- As últimas ${exitPhotos.length} foto(s) são o ESTADO ATUAL após o uso pelo inquilino

Compare as imagens e identifique:
1. Itens faltantes (móveis, objetos, acessórios que estavam e não estão mais)
2. Danos físicos (riscos, quebrados, amassados, furos)
3. Manchas e sujeira visível
4. Condição geral do cômodo

Responda APENAS em JSON válido, sem markdown, sem explicações, exatamente neste formato:
{
  "score": 85,
  "condition": "good",
  "summary": "O cômodo apresenta boa conservação geral com pequenas observações.",
  "findings": [
    {
      "type": "physical_damage",
      "severity": "low",
      "description": "Pequeno risco na parede próximo à janela",
      "location": "Parede norte"
    }
  ]
}

Regras:
- score: 0-100 (100 = perfeito, 0 = destruído)
- condition: "good" (score >= 75), "warning" (score 50-74), "critical" (score < 50)
- type: apenas "missing_item", "physical_damage", "stain" ou "general_condition"
- severity: apenas "low", "medium" ou "high"
- Se não houver problemas, retorne findings como array vazio []
- Escreva em português brasileiro`

  try {
    const result = await model.generateContent([
      prompt,
      ...matrixParts,
      ...exitParts,
    ])

    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return parsed as AnalysisResult
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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

  const prompt = `Você é um especialista em vistoria de imóveis de aluguel por temporada.

Analise o objeto "${itemName}":
- As primeiras ${matrixPhotos.length} foto(s) são o ESTADO ORIGINAL
- As últimas ${exitPhotos.length} foto(s) são o ESTADO ATUAL após uso

Identifique danos, manchas, riscos ou se o objeto está ausente.

Responda APENAS em JSON válido, sem markdown:
{
  "score": 90,
  "condition": "good",
  "summary": "Objeto em bom estado de conservação.",
  "findings": []
}

- score: 0-100
- condition: "good" (>=75), "warning" (50-74), "critical" (<50)
- Se ausente: score 0, condition "critical", finding type "missing_item" severity "high"
- Escreva em português brasileiro`

  try {
    const result = await model.generateContent([prompt, ...matrixParts, ...exitParts])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as AnalysisResult
  } catch (error) {
    return { score: 0, condition: 'critical', summary: 'Erro ao processar análise.', findings: [] }
  }
}