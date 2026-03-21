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

  const prompt = `Você é um auditor técnico especializado em inspeção visual de imóveis.

Você receberá fotos do cômodo "${roomName}" em duas etapas:
- IMAGENS DE REFERÊNCIA (estado original): as primeiras ${matrixPhotos.length} imagem(ns)
- IMAGENS ATUAIS (após uso pelo inquilino): as últimas ${exitPhotos.length} imagem(ns)

Sua função é comparar as imagens e identificar com precisão qualquer divergência.

---
PASSO 1 — INVENTÁRIO MENTAL DA REFERÊNCIA:
Antes de comparar, liste mentalmente TODOS os elementos visíveis nas imagens originais:
- Móveis (sofá, mesa, cadeiras, armários, camas, estantes...)
- Objetos pequenos (vasos, quadros, almofadas, tapetes, luminárias, bibelôs, plantas...)
- Superfícies (paredes, piso, teto — cor, textura, estado)
- Estrutura (portas, janelas, rodapés, acabamentos)
- Acessórios (cortinas, persianas, espelhos, porta-retratos...)

PASSO 2 — COMPARAÇÃO COM O ESTADO ATUAL:
Compare cada elemento da lista acima com as imagens atuais e identifique:

a) ITENS FALTANTES — estavam na referência e não estão mais
b) ITENS DANIFICADOS — permanecem mas com riscos, quebras, deformações ou desgaste excessivo
c) MANCHAS E SUJIDADE — manchas em paredes, sujeira no piso, marcas em móveis
d) ALTERAÇÕES ESTRUTURAIS — paredes, portas, janelas, pisos, tetos, revestimentos
e) ITENS ADICIONADOS — não existiam antes e aparecem agora (informativo)

---
REGRAS OBRIGATÓRIAS:
- IGNORE diferenças de iluminação, sombra ou ângulo de câmera
- IGNORE pequenas mudanças de posição dos objetos
- FOQUE em: presença, ausência e estado de conservação
- NÃO assuma nada que não esteja claramente visível
- Seja conservador: só reporte o que tiver evidência visual clara
- Objetos pequenos de decoração TAMBÉM contam como itens faltantes

REVISÃO FINAL (antes de responder, verifique):
✓ Comparou TODOS os cantos da imagem?
✓ Verificou superfícies (paredes, piso, teto)?
✓ Analisou objetos pequenos e decorações?
✓ Deixou passar algum item presente na referência?

---
Responda APENAS em JSON válido, sem markdown, sem texto extra:
{
  "score": 85,
  "condition": "good",
  "summary": "Resumo técnico detalhado da comparação entre estado original e atual.",
  "findings": [
    {
      "type": "missing_item",
      "severity": "medium",
      "description": "Descrição técnica clara do que foi identificado",
      "location": "Localização exata no ambiente (ex: parede norte, canto esquerdo)"
    }
  ],
  "conformities": [
    "Sofá 3 lugares — presente e em bom estado",
    "Piso — sem danos ou manchas visíveis"
  ]
}

Regras de pontuação:
- 100 = ambiente idêntico ao original
- Desconte 8-15 pontos por item faltante
- Desconte 3-8 por dano físico
- Desconte 2-5 por mancha ou sujeira
- condition: "good" (score >= 75), "warning" (50-74), "critical" (< 50)
- type: "missing_item", "physical_damage", "stain", "structural" ou "added_item"
- severity: "low" (cosmético/decoração pequena), "medium" (visível/reparável), "high" (sério/custoso)
- Escreva TUDO em português brasileiro`

  try {
    const result = await model.generateContent([
      { text: `=== IMAGENS DE REFERÊNCIA (estado original do cômodo ${roomName}) ===` },
      ...matrixParts,
      { text: `=== IMAGENS ATUAIS (estado após uso pelo inquilino) ===` },
      ...exitParts,
      { text: prompt },
    ])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      ...parsed,
      conformities: parsed.conformities || [],
    }
  } catch (error) {
    console.error('Gemini analysis error:', error)
    return {
      score: 0,
      condition: 'critical',
      summary: 'Erro ao processar análise. Tente novamente.',
      findings: [],
      conformities: [],
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

  const prompt = `Você é um auditor técnico especializado em inspeção visual de imóveis.

Analise o objeto: "${itemName}"
- IMAGEM DE REFERÊNCIA (estado original): as primeiras ${matrixPhotos.length} imagem(ns)
- IMAGEM ATUAL (após uso): as últimas ${exitPhotos.length} imagem(ns)

VERIFIQUE:
1. O objeto está PRESENTE na imagem atual?
   - Se NÃO: registre como item faltante com severity "high"
2. Há danos visíveis? (riscos, quebras, manchas, deformações)
3. Algum acessório ou parte do objeto está faltando?
4. O desgaste é além do normal?

REVISÃO: Você confirmou claramente se o objeto está presente ou ausente?

Responda APENAS em JSON válido, sem markdown:
{
  "score": 90,
  "condition": "good",
  "summary": "Descrição técnica detalhada do estado atual comparado ao original.",
  "findings": [],
  "conformities": ["${itemName} — presente e em bom estado"]
}

- score: 0-100 (100 = idêntico, 0 = ausente/destruído)
- Se AUSENTE: score 0, condition "critical", finding type "missing_item" severity "high"
- condition: "good" (>=75), "warning" (50-74), "critical" (<50)
- Escreva em português brasileiro`

  try {
    const result = await model.generateContent([
      { text: `=== IMAGEM DE REFERÊNCIA (estado original do objeto ${itemName}) ===` },
      ...matrixParts,
      { text: `=== IMAGEM ATUAL (estado após uso pelo inquilino) ===` },
      ...exitParts,
      { text: prompt },
    ])
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      ...parsed,
      conformities: parsed.conformities || [],
    }
  } catch (error) {
    console.error('Gemini analysis error:', error)
    return {
      score: 0,
      condition: 'critical',
      summary: 'Erro ao processar análise. Tente novamente.',
      findings: [],
      conformities: [],
    }
  }
}