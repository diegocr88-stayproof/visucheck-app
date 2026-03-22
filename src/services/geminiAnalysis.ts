const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN
const GITHUB_ENDPOINT = 'https://models.inference.ai.azure.com'
const MODEL = 'gpt-4o'

async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export type AnalysisResult = {
  condition: 'good' | 'warning' | 'critical'
  score: number
  findings: { type: string; severity: string; description: string; location: string }[]
  summary: string
  conformities: string[]
}

async function analyzeSinglePair(
  roomName: string,
  matrixUrl: string,
  exitUrl: string
): Promise<{ findings: any[]; conformities: string[]; score: number }> {
  const [matrixB64, exitB64] = await Promise.all([
    imageUrlToBase64(matrixUrl),
    imageUrlToBase64(exitUrl),
  ])

  const prompt = `Voce e um perito forense em vistoria de imoveis com 20 anos de experiencia.

Voce recebeu DUAS fotos do MESMO angulo do comodo "${roomName}":
- IMAGEM 1 = Estado ORIGINAL (referencia, tirada na entrada)
- IMAGEM 2 = Estado ATUAL (tirada na saida, apos uso)

METODOLOGIA OBRIGATORIA:

ETAPA 1 - INVENTARIO DA IMAGEM ORIGINAL:
Examine a IMAGEM 1 com muito cuidado. Liste mentalmente TODOS os objetos visiveis:
- Moveis: mesas, cadeiras, sofas, armarios, estantes, camas
- Equipamentos: notebooks, monitores, TVs, radios, telefones
- Objetos medios: capacetes, garrafas, mochilas, ferramentas
- Objetos pequenos: copos, decoracoes, livros, papeis organizados
- Estado das superficies: paredes, piso, teto, janelas
- Para cada objeto: anote cor, tamanho aproximado e posicao exata

ETAPA 2 - INVENTARIO DA IMAGEM ATUAL:
Examine a IMAGEM 2 com o mesmo cuidado.

ETAPA 3 - COMPARACAO CRITICA:
Para cada objeto identificado na IMAGEM 1:
- Ele aparece claramente na IMAGEM 2?
- Se SIM: esta em bom estado ou tem danos?
- Se NAO aparece em NENHUMA parte da IMAGEM 2: e um ITEM FALTANTE

REGRAS PARA EVITAR ERROS:
1. IGNORE diferencas de iluminacao, brilho, sombras e qualidade
2. IGNORE pequenas mudancas de posicao (objeto movido poucos centimetros)
3. So reporte FALTANTE se tiver CERTEZA ABSOLUTA que o objeto sumiu
4. NAO reporte objetos que podem estar fora do enquadramento
5. Objetos similares no mesmo lugar NAO sao faltantes
6. Antes de reportar, pergunte: "Tenho certeza que este objeto sumiu?"

CRITERIOS DE SEVERIDADE:
- high: eletronicos, equipamentos, moveis principais
- medium: objetos uteis, decoracao de valor
- low: pequenas decoracoes, itens de baixo valor

Responda APENAS em JSON valido, sem markdown:
{
  "score": 95,
  "findings": [
    {
      "type": "missing_item",
      "severity": "high",
      "description": "Descricao especifica do objeto (cor, tipo, tamanho)",
      "location": "Localizacao precisa na IMAGEM 1"
    }
  ],
  "conformities": [
    "Objeto especifico — cor e tipo — presente e em bom estado"
  ]
}

PONTUACAO:
- Comece com 100
- Desconte 15-25 por item faltante de alto valor
- Desconte 8-15 por item faltante de valor medio
- Desconte 3-8 por item faltante pequeno
- Desconte 5-10 por dano fisico
- Desconte 2-5 por mancha
- type: "missing_item", "physical_damage", "stain" ou "structural"
- Escreva tudo em portugues brasileiro`

  try {
    const response = await fetch(`${GITHUB_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '=== IMAGEM 1: ESTADO ORIGINAL ===' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${matrixB64}` } },
              { type: 'text', text: '=== IMAGEM 2: ESTADO ATUAL ===' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${exitB64}` } },
              { type: 'text', text: prompt },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    })

    const data = await response.json()
    console.log('GPT-4o response:', data)

    const text = data.choices?.[0]?.message?.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      findings: parsed.findings || [],
      conformities: parsed.conformities || [],
      score: parsed.score || 100,
    }
  } catch (error) {
    console.error('GPT-4o analysis error:', error)
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

  const pairResults: any[] = []
  for (const pos of pairs) {
    const result = await analyzeSinglePair(roomName, matrixByPos[pos], exitByPos[pos])
    pairResults.push(result)
    await new Promise(r => setTimeout(r, 1000))
  }

  // Consolida removendo duplicatas
  const allFindings: any[] = []
  const seenItems = new Set<string>()

  for (const pr of pairResults) {
    for (const f of (pr.findings || [])) {
      const words = f.description.toLowerCase().split(' ').slice(0, 4).join('_')
      const key = `${f.type}_${words}`
      if (!seenItems.has(key)) {
        seenItems.add(key)
        allFindings.push(f)
      }
    }
  }

  const allConformities = [...new Set(pairResults.flatMap(r => r.conformities || []))]
  const avgScore = Math.round(pairResults.reduce((a, r) => a + (r.score || 100), 0) / pairResults.length)
  const condition = avgScore >= 75 ? 'good' : avgScore >= 50 ? 'warning' : 'critical'

  const summary = allFindings.length > 0
    ? `Foram identificadas ${allFindings.length} ocorrencia(s) no comodo ${roomName}: ${allFindings.map(f => f.description).slice(0, 2).join(', ')}${allFindings.length > 2 ? ' e outros.' : '.'}`
    : `Comodo ${roomName} em conformidade com o estado original. Nenhuma divergencia identificada.`

  return { score: avgScore, condition, summary, findings: allFindings, conformities: allConformities }
}

export async function analyzeItemPhotos(
  itemName: string,
  matrixPhotos: { url: string }[],
  exitPhotos: { url: string }[]
): Promise<AnalysisResult> {
  const matrixB64 = await imageUrlToBase64(matrixPhotos[0].url)
  const exitB64 = await imageUrlToBase64(exitPhotos[0].url)

  const prompt = `Voce e um perito forense em vistoria de imoveis.

Analise o objeto: "${itemName}"
- IMAGEM 1 = estado ORIGINAL
- IMAGEM 2 = estado APOS USO

O objeto "${itemName}" esta presente na IMAGEM 2?
- Se SIM: ha danos, manchas ou partes faltando?
- Se NAO: registre como ITEM FALTANTE

So reporte ausencia se tiver CERTEZA que o objeto nao aparece.

JSON valido, sem markdown:
{
  "score": 100,
  "condition": "good",
  "summary": "Descricao objetiva do estado atual.",
  "findings": [],
  "conformities": ["${itemName} — presente e em bom estado"]
}

Se AUSENTE: score 0, condition "critical", type "missing_item", severity "high".
Escreva em portugues brasileiro.`

  try {
    const response = await fetch(`${GITHUB_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: `=== IMAGEM 1: ORIGINAL "${itemName}" ===` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${matrixB64}` } },
            { type: 'text', text: '=== IMAGEM 2: ESTADO ATUAL ===' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${exitB64}` } },
            { type: 'text', text: prompt },
          ],
        }],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
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