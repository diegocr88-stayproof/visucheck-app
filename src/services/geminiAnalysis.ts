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

  const prompt = `Voce e um perito forense especializado em vistoria de imoveis de aluguel por temporada.

Voce recebeu ${matrixPhotos.length} fotos do ESTADO ORIGINAL e ${exitPhotos.length} fotos do ESTADO ATUAL do comodo "${roomName}".
As fotos cobrem diferentes angulos do mesmo ambiente.

INSTRUCOES:

PASSO 1 - CONSTRUA O MODELO COMPLETO DO AMBIENTE:
Analise TODAS as fotos originais juntas como se fossem uma visao 360 graus do comodo.
Construa mentalmente um inventario UNICO e COMPLETO de todos os objetos presentes:
- Nao duplique itens que aparecem em multiplas fotos
- Um capacete visivel em 3 fotos = 1 capacete (ou mais, se claramente forem unidades diferentes)
- Conte com precisao: quantas cadeiras, quantos capacetes, quantos monitores, etc.

PASSO 2 - CONSTRUA O MODELO DO ESTADO ATUAL:
Analise TODAS as fotos atuais juntas da mesma forma.
Construa o inventario atual do ambiente.

PASSO 3 - COMPARE OS DOIS MODELOS:
Compare o inventario original com o atual e identifique:
a) Itens presentes no original e AUSENTES no atual (item faltante)
b) Itens com danos visiveis que nao existiam antes
c) Manchas ou sujeira nova
d) Alteracoes estruturais

REGRAS CRITICAS:
- Cada item faltante deve aparecer APENAS UMA VEZ no relatorio, mesmo que visivel em multiplas fotos originais
- IGNORE diferencas de iluminacao, sombra, qualidade de foto e pequenas mudancas de angulo
- IGNORE reposicionamentos menores de objetos
- So reporte como faltante se tiver CERTEZA que o objeto nao aparece em NENHUMA das fotos atuais
- Nao reporte "item adicionado" a menos que seja algo completamente novo e obviamente relevante
- Seja conservador: na duvida, nao reporte

Responda APENAS em JSON valido, sem markdown, sem texto extra:
{
  "score": 85,
  "condition": "good",
  "summary": "Descricao tecnica objetiva. Mencione o que foi encontrado de diferente entre os dois estados.",
  "findings": [
    {
      "type": "missing_item",
      "severity": "medium",
      "description": "Descricao especifica e unica do item ausente — nao repita o mesmo item",
      "location": "Localizacao no ambiente onde o item estava na referencia"
    }
  ],
  "conformities": [
    "Item especifico — presente e em bom estado"
  ]
}

PONTUACAO:
- 100 = identico ao original
- Desconte 10-20 por item faltante de valor (movel, eletronico, equipamento)
- Desconte 5-10 por item faltante pequeno (decoracao, utensilio)
- Desconte 3-8 por dano fisico
- Desconte 2-5 por mancha
- condition: "good" (>=75), "warning" (50-74), "critical" (<50)
- type: "missing_item", "physical_damage", "stain" ou "structural"
- severity: "low", "medium" ou "high"
- Escreva TUDO em portugues brasileiro
- Na lista conformities inclua itens ESPECIFICOS que continuam presentes`

  try {
    const result = await model.generateContent([
      { text: `=== ESTADO ORIGINAL DO COMODO "${roomName}" (${matrixPhotos.length} fotos de angulos diferentes) ===` },
      ...matrixParts,
      { text: `=== ESTADO ATUAL DO COMODO "${roomName}" (${exitPhotos.length} fotos de angulos diferentes) ===` },
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
IMAGENS ORIGINAIS = estado original
IMAGENS ATUAIS = estado apos uso

O objeto "${itemName}" esta CLARAMENTE VISIVEL em alguma das imagens atuais?
- SIM: verifique danos, manchas, pecas faltando
- NAO: registre como ITEM FALTANTE severity "high"

IGNORE diferencas de iluminacao e angulo.
So reporte como faltante se tiver CERTEZA absoluta.

JSON valido, sem markdown:
{
  "score": 90,
  "condition": "good",
  "summary": "Descricao objetiva do estado atual comparado ao original.",
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