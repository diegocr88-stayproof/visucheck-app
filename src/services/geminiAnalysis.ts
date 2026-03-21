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

CONTEXTO: Voce ira comparar fotos do comodo "${roomName}" em dois momentos diferentes.

ETAPA 1 - INVENTARIO DA REFERENCIA:
Analise APENAS as imagens de referencia (estado original) e crie um inventario mental COMPLETO de TODOS os objetos visiveis:
- Moveis grandes (sofas, mesas, cadeiras, camas, armarios, estantes)
- Objetos medios (luminárias, plantas, quadros, espelhos, tapetes, almofadas)
- Objetos pequenos (vasos, bibelôs, livros, garrafas, copos, utensilios, decoracoes, itens sobre mesas)
- Eletrodomesticos e eletronicos (TV, geladeira, microondas, ventiladores, ar-condicionado)
- Estado das superficies (paredes, piso, teto, janelas, portas)

ETAPA 2 - VERIFICACAO NO ESTADO ATUAL:
Agora analise as imagens atuais e para CADA item do seu inventario, verifique:
a) O item ESTA PRESENTE na imagem atual? (mesmo que em posicao diferente)
b) Se presente: ha danos, manchas ou desgaste excessivo?
c) Se ausente: registre como ITEM FALTANTE

REGRAS CRITICAS:
- IGNORE completamente diferencas de iluminacao, sombra, angulo de camera e qualidade da foto
- IGNORE small repositioning of objects (um objeto movido alguns centimetros NAO e faltante)
- Um objeto so e "faltante" se NAO APARECER em nenhuma parte das fotos atuais
- Nao invente itens "adicionados" baseado em angulos diferentes - so reporte adicoes OBVIAS e CERTAS
- Seja CONSERVADOR com falsos positivos: na duvida, NAO reporte como faltante
- Seja RIGOROSO com itens claramente visiveis na referencia e ausentes na atual

FORMATO DE RESPOSTA - apenas JSON valido, sem markdown:
{
  "score": 85,
  "condition": "good",
  "summary": "Descricao tecnica detalhada comparando os dois estados. Mencione os principais itens presentes, o que mudou e a condicao geral.",
  "findings": [
    {
      "type": "missing_item",
      "severity": "medium",
      "description": "Descricao especifica e objetiva do item ausente",
      "location": "Localizacao precisa onde o item estava na foto original"
    }
  ],
  "conformities": [
    "Item especifico — presente e em bom estado"
  ]
}

PONTUACAO:
- 100 = identico ao original
- Desconte 10-20 por item faltante de valor (movel, eletronico)
- Desconte 5-10 por item faltante pequeno (decoracao, utensilio)
- Desconte 3-8 por dano fisico
- Desconte 2-5 por mancha ou sujeira
- condition: "good" (>=75), "warning" (50-74), "critical" (<50)
- type: "missing_item", "physical_damage", "stain", "structural" ou "added_item"
- severity: "low" (decoracao pequena), "medium" (item de valor moderado), "high" (item de alto valor ou dano grave)
- Escreva TUDO em portugues brasileiro
- Na lista de conformities, inclua apenas itens ESPECIFICOS que estavam na referencia e continuam presentes`

  try {
    const result = await model.generateContent([
      { text: `=== IMAGENS DE REFERENCIA - ESTADO ORIGINAL DO COMODO "${roomName}" ===` },
      ...matrixParts,
      { text: `=== IMAGENS ATUAIS - ESTADO APOS USO PELO INQUILINO ===` },
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

  const prompt = `Voce e um perito forense especializado em vistoria de imoveis de aluguel por temporada.

Analise o objeto: "${itemName}"

IMAGENS DE REFERENCIA: estado original do objeto
IMAGENS ATUAIS: estado apos uso pelo inquilino

ETAPA 1 - INVENTARIO DO OBJETO NA REFERENCIA:
Descreva mentalmente o objeto: cor, tamanho aparente, estado, acessorios visiveis, localizacao.

ETAPA 2 - VERIFICACAO NO ESTADO ATUAL:
O objeto "${itemName}" esta CLARAMENTE VISIVEL nas imagens atuais?
- SIM: verifique danos, manchas, pecas faltando
- NAO: registre como ITEM FALTANTE com severity "high"

REGRAS:
- IGNORE diferencas de iluminacao e angulo
- So reporte como faltante se o objeto NAO aparecer nas fotos atuais
- Seja objetivo e preciso

FORMATO - apenas JSON valido, sem markdown:
{
  "score": 90,
  "condition": "good",
  "summary": "Descricao objetiva do estado atual comparado ao original.",
  "findings": [],
  "conformities": ["${itemName} — presente e em bom estado"]
}

- score: 0-100
- Se AUSENTE: score 0, condition "critical", type "missing_item", severity "high"
- condition: "good" (>=75), "warning" (50-74), "critical" (<50)
- Escreva em portugues brasileiro`

  try {
    const result = await model.generateContent([
      { text: `=== IMAGEM DE REFERENCIA - ESTADO ORIGINAL: "${itemName}" ===` },
      ...matrixParts,
      { text: `=== IMAGEM ATUAL - ESTADO APOS USO ===` },
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