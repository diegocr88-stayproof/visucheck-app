const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { roomName, matrixPhotos, exitPhotos } = await req.json()

    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
    const ENDPOINT = 'https://models.inference.ai.azure.com'
    const MODEL = 'gpt-4o'

    const positions = Object.keys(matrixPhotos).filter(pos => exitPhotos[pos])
    const allPairResults: any[] = []

    // Processa cada par sequencialmente
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]

      // PASSO 1: Inventario foto original
      const descOrigRes = await fetch(`${ENDPOINT}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GITHUB_TOKEN}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Voce e um perito em vistoria de imoveis. Examine esta foto do comodo "${roomName}".

Faca um inventario COMPLETO de TODOS os objetos visiveis.
Para cada objeto: nome exato, cor, tamanho aproximado, localizacao precisa.
Seja EXAUSTIVO — nao omita nenhum objeto por menor que seja.
Inclua: equipamentos, utensilios, ferramentas, decoracoes, papeis, alimentos, bebidas, etc.

Responda em lista numerada, um objeto por linha.`
              },
              { type: 'image_url', image_url: { url: matrixPhotos[pos], detail: 'high' } },
            ],
          }],
          max_tokens: 1500,
          temperature: 0,
        }),
      })
      const descOrigData = await descOrigRes.json()
      const originalInventory = descOrigData.choices?.[0]?.message?.content || ''
      console.log(`[${pos}] Original inventory:`, originalInventory)

      await new Promise(r => setTimeout(r, 500))

      // PASSO 2: Inventario foto atual
      const descCurrRes = await fetch(`${ENDPOINT}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GITHUB_TOKEN}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Voce e um perito em vistoria de imoveis. Examine esta foto do comodo "${roomName}".

Faca um inventario COMPLETO de TODOS os objetos visiveis.
Para cada objeto: nome exato, cor, tamanho aproximado, localizacao precisa.
Seja EXAUSTIVO — nao omita nenhum objeto por menor que seja.
Inclua: equipamentos, utensilios, ferramentas, decoracoes, papeis, alimentos, bebidas, etc.

Responda em lista numerada, um objeto por linha.`
              },
              { type: 'image_url', image_url: { url: exitPhotos[pos], detail: 'high' } },
            ],
          }],
          max_tokens: 1500,
          temperature: 0,
        }),
      })
      const descCurrData = await descCurrRes.json()
      const currentInventory = descCurrData.choices?.[0]?.message?.content || ''
      console.log(`[${pos}] Current inventory:`, currentInventory)

      await new Promise(r => setTimeout(r, 500))

      // PASSO 3: Comparar inventarios
      const compareRes = await fetch(`${ENDPOINT}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GITHUB_TOKEN}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [{
            role: 'user',
            content: `Voce e um perito forense em vistoria de imoveis.

Compare os dois inventarios do comodo "${roomName}":

=== INVENTARIO ORIGINAL (entrada) ===
${originalInventory}

=== INVENTARIO ATUAL (saida) ===
${currentInventory}

TAREFA: Identifique TODAS as divergencias entre os dois inventarios.

REGRAS:
- Item no original mas ausente no atual = ITEM FALTANTE
- Item presente mas danificado = DANO FISICO  
- Item com mancha nova = MANCHA
- Variacao de posicao do mesmo objeto NAO e ocorrencia
- Variacao de iluminacao ou angulo NAO e ocorrencia
- Se um objeto aparece no original mas pode estar apenas fora do enquadramento na foto atual (por diferenca de angulo), NAO reporte como faltante — apenas reporte se tiver certeza que o objeto sumiu fisicamente

Seja rigoroso mas justo. Reporte apenas divergencias reais.

JSON valido sem markdown:
{
  "score": 85,
  "findings": [
    {
      "type": "missing_item",
      "severity": "medium",
      "description": "Descricao especifica do objeto ausente",
      "location": "Onde estava no inventario original"
    }
  ],
  "conformities": ["Objeto — cor — presente em ambos os inventarios"]
}

- score: 100=identico, desconte 20-30 item importante, 10-15 medio, 5-8 pequeno
- severity: "high"(eletronicos/moveis/equipamentos), "medium"(utensilios/ferramentas), "low"(decoracao)
- Escreva em portugues brasileiro`,
          }],
          max_tokens: 2000,
          temperature: 0,
        }),
      })

      const compareData = await compareRes.json()
      console.log(`[${pos}] Compare:`, JSON.stringify(compareData).substring(0, 300))

      const text = compareData.choices?.[0]?.message?.content || '{}'
      const clean = text.replace(/```json|```/g, '').trim()

      try {
        const parsed = JSON.parse(clean)
        allPairResults.push({ pos, ...parsed })
      } catch {
        allPairResults.push({ pos, score: 100, findings: [], conformities: [] })
      }

      await new Promise(r => setTimeout(r, 500))
    }

    // PASSO FINAL: Consolidar e deduplicar
    const allFindings: any[] = []
    const allConformities: string[] = []

    // Coleta todos os findings e conformities
    for (const r of allPairResults) {
      allFindings.push(...(r.findings || []))
      allConformities.push(...(r.conformities || []))
    }

    // Se mais de 1 par, faz deduplicacao inteligente via GPT
    let finalFindings = allFindings
    let finalConformities = [...new Set(allConformities)]

    if (allPairResults.length > 1 && allFindings.length > 0) {
      const dedupeRes = await fetch(`${ENDPOINT}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GITHUB_TOKEN}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [{
            role: 'user',
            content: `Voce e um perito forense em vistoria de imoveis.

Abaixo esta uma lista de ocorrencias identificadas em diferentes angulos do mesmo comodo.
Algumas podem ser duplicatas do mesmo objeto visto de angulos diferentes.

OCORRENCIAS:
${JSON.stringify(allFindings, null, 2)}

TAREFA:
1. Identifique e remova duplicatas (mesmo objeto reportado mais de uma vez)
2. Mantenha apenas ocorrencias unicas
3. Se duas ocorrencias parecem ser o mesmo objeto, mantenha apenas a descricao mais especifica

Responda APENAS com JSON valido, sem markdown:
{
  "findings": [
    {
      "type": "missing_item",
      "severity": "medium", 
      "description": "Descricao especifica",
      "location": "Localizacao"
    }
  ]
}`,
          }],
          max_tokens: 1000,
          temperature: 0,
        }),
      })

      const dedupeData = await dedupeRes.json()
      const dedupeText = dedupeData.choices?.[0]?.message?.content || '{}'
      const dedupeClean = dedupeText.replace(/```json|```/g, '').trim()

      try {
        const dedupeParsed = JSON.parse(dedupeClean)
        finalFindings = dedupeParsed.findings || allFindings
      } catch {
        finalFindings = allFindings
      }
    }

    const avgScore = Math.round(
      allPairResults.reduce((a: number, r: any) => a + (r.score || 100), 0) / Math.max(allPairResults.length, 1)
    )
    const condition = avgScore >= 75 ? 'good' : avgScore >= 50 ? 'warning' : 'critical'
    const summary = finalFindings.length > 0
      ? `Foram identificadas ${finalFindings.length} ocorrencia(s): ${finalFindings.slice(0, 2).map((f: any) => f.description).join(', ')}.`
      : `Comodo em conformidade com o estado original. Nenhuma divergencia significativa identificada.`

    return new Response(JSON.stringify({
      score: avgScore,
      condition,
      summary,
      findings: finalFindings,
      conformities: finalConformities,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})