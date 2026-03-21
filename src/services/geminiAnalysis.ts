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

  const prompt = `Voce e um perito forense especializado em vistoria de imoveis.

Voce recebeu ${matrixPhotos.length} fotos do ESTADO ORIGINAL e ${exitPhotos.length} fotos do ESTADO ATUAL do comodo "${roomName}".
As fotos foram tiradas nos MESMOS angulos — foto 1 original corresponde a foto 1 atual, foto 2 com foto 2, etc.

METODOLOGIA DE ANALISE:

ETAPA 1 — INVENTARIO DETALHADO DO ESTADO ORIGINAL:
Analise cada foto original e liste TODOS os objetos visiveis com precisao:
- Identifique cada objeto pelo nome, cor, tamanho e posicao exata
- Inclua objetos grandes E pequenos
- Inclua objetos sobre mesas, bancadas e superficies
- Conte quantidades exatas (ex: "3 capacetes brancos", "2 garrafas")
- Anote a posicao de cada objeto (ex: "sobre a mesa central, lado esquerdo")

ETAPA 2 — INVENTARIO DO ESTADO ATUAL:
Analise cada foto atual e liste TODOS os objetos visiveis da mesma forma.

ETAPA 3 — COMPARACAO DIRETA:
Compare os dois inventarios item por item:
- Quais objetos estao NO ORIGINAL mas NAO APARECEM no atual? → ITEM FALTANTE
- Quais objetos tem danos visiveis? → DANO FISICO
- Quais superficies tem manchas novas? → MANCHA

REGRAS:
- IGNORE diferencas de iluminacao, qualidade de foto e pequenas mudancas de angulo
- Se um objeto estava claramente visivel no original e NAO aparece em NENHUMA foto atual → ITEM FALTANTE
- Seja DETALHISTA: objetos pequenos sobre mesas, decoracoes, utensilios — tudo conta
- NAO seja conservador: se o objeto nao esta visivel no atual, reporte

Responda APENAS em JSON valido, sem markdown:
{
  "score": 85,
  "condition": "good",
  "summary": "Descricao tecnica objetiva das diferencas encontradas.",
  "findings": [
    {
      "type": "missing_item",
      "severity": "medium",
      "description": "Nome especifico e descricao do objeto ausente",
      "location": "Localizacao exata onde estava no original"
    }
  ],
  "conformities": [
    "Objeto especifico — presente e em bom estado"
  ]
}

PONTUACAO:
- 100 = identico ao original
- Desconte 15 por item faltante de valor
- Desconte 8 por item faltante pequeno
- Desconte 5 por dano fisico
- Desconte 3 por mancha
- condition: "good" (>=75), "warning" (50-74), "critical" (<50)
- type: "missing_item", "physical_damage", "stain" ou "structural"
- severity: "low", "medium" ou "high"
- Escreva em portugues brasileiro`

  try {
    const result = await model.generateContent([
      { text: `=== ESTADO ORIGINAL — ${matrixPhotos.length} FOTOS (foto 1, foto 2, foto 3, foto 4) ===` },
      ...matrixParts,
      { text: `=== ESTADO ATUAL — ${exitPhotos.length} FOTOS (mesmos angulos: foto 1, foto 2, foto 3, foto 4) ===` },
      ...exitParts,
      { text: prompt },
    ])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return { ...parsed, conformities: parsed.conformities || [] }
  } catch (error) {
    console.error('Gemini analysis error:', error)
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

ETAPA 1 — ESTADO ORIGINAL:
Descreva o objeto em detalhe: cor, tamanho, estado, posicao, acessorios.

ETAPA 2 — ESTADO ATUAL:
O objeto "${itemName}" esta VISIVELMENTE PRESENTE em alguma das fotos atuais?

ETAPA 3 — CONCLUSAO:
- Se PRESENTE: verifique danos, manchas, pecas faltando
- Se AUSENTE: registre como ITEM FALTANTE severity "high"

Se o objeto nao aparecer claramente nas fotos atuais → e FALTANTE.

JSON valido, sem markdown:
{
  "score": 90,
  "condition": "good",
  "summary": "Descricao objetiva do estado atual.",
  "findings": [],
  "conformities": ["${itemName} — presente e em bom estado"]
}

- Se AUSENTE: score 0, condition "critical", type "missing_item", severity "high"
- condition: "good" (>=75), "warning" (50-74), "critical" (<50)
- Escreva em portugues brasileiro`

  try {
    const result = await model.generateContent([
      { text: `=== IMAGENS ORIGINAIS: "${itemName}" ===` }, ...matrixParts,
      { text: `=== IMAGENS ATUAIS ===` }, ...exitParts,
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