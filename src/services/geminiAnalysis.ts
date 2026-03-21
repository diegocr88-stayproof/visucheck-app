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

  const prompt = `Você é um perito forense em vistoria de imóveis de aluguel por temporada.

Analise as fotos do cômodo "${roomName}":
- As primeiras ${matrixPhotos.length} foto(s) são o ESTADO ORIGINAL (referência)
- As últimas ${exitPhotos.length} foto(s) são o ESTADO ATUAL após uso

Faça uma VARREDURA COMPLETA do ambiente. Compare TUDO que aparece nas fotos:

INVENTÁRIO VISUAL: Liste mentalmente todos os objetos visíveis na foto original:
móveis, decorações, quadros, plantas, tapetes, almofadas, luminárias, cortinas,
bibelôs, livros, vasos, porta-retratos, espelhos, eletrodomésticos, utensílios,
acessórios de parede, prateleiras e seus conteúdos, etc.

Depois compare com o estado atual e identifique:
1. Qualquer objeto que estava na foto original e NÃO está na foto atual = ITEM FALTANTE
2. Danos visíveis em móveis, paredes, piso, teto, janelas
3. Manchas, sujeira ou marcas novas
4. Alterações de posição ou substituições suspeitas

SEJA EXTREMAMENTE DETALHISTA. Objetos pequenos de decoração também contam.
Se um item estava visível na foto original e não aparece na foto atual, registre.

Responda APENAS em JSON válido, sem markdown:
{
  "score": 85,
  "condition": "good",
  "summary": "Resumo completo do inventário visual comparado. Liste o que estava presente, o que foi mantido e o que foi alterado.",
  "findings": [
    {
      "type": "missing_item",
      "severity": "medium",
      "description": "Descrição específica do objeto que estava e não está mais",
      "location": "Onde estava localizado na foto original"
    }
  ]
}

Regras de pontuação:
- 100 = ambiente idêntico ao original
- Desconte 8-15 por item faltante (dependendo do valor aparente)
- Desconte 3-8 por dano físico
- Desconte 2-5 por mancha ou sujeira
- condition: "good" (>=75), "warning" (50-74), "critical" (<50)
- severity: "low" (pequena decoração), "medium" (item de valor moderado), "high" (item de valor alto ou dano sério)
- Escreva TUDO em português brasileiro
- Se o ambiente estiver idêntico, diga isso claramente no summary`

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

  const prompt = `Você é um perito forense em vistoria de imóveis de aluguel por temporada. Análise RIGOROSA.

Analise o objeto "${itemName}":
- As primeiras ${matrixPhotos.length} foto(s) são o ESTADO ORIGINAL
- As últimas ${exitPhotos.length} foto(s) são o ESTADO ATUAL após uso

VERIFIQUE MINUCIOSAMENTE:
1. O objeto está PRESENTE? Se não aparecer nas fotos atuais = ITEM FALTANTE (severity: high)
2. Há riscos, arranhões, quebrados, manchas, deformações?
3. O estado atual é significativamente pior que o original?
4. Algum acessório ou parte do objeto está faltando?

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