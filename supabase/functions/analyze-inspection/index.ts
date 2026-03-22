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

    const results = []

    for (const pos of Object.keys(matrixPhotos)) {
      if (!exitPhotos[pos]) continue

      const prompt = `Voce e um perito forense em vistoria de imoveis com 20 anos de experiencia.

Voce recebeu DUAS fotos do comodo "${roomName}" tiradas aproximadamente do mesmo angulo:
- FOTO 1 = Estado ORIGINAL (referencia, tirada na entrada)
- FOTO 2 = Estado ATUAL (tirada na saida, apos uso)

IMPORTANTE: As fotos podem ter pequenas variacoes de angulo, altura e iluminacao pois foram tiradas por pessoas diferentes em momentos diferentes. Isso e normal e esperado. Foque no CONTEUDO, nao no angulo.

METODOLOGIA:

ETAPA 1 - INVENTARIO DA FOTO ORIGINAL:
Examine a FOTO 1 com muito cuidado. Liste TODOS os objetos visiveis:
- Moveis: mesas, cadeiras, sofas, armarios, estantes
- Equipamentos: notebooks, monitores, TVs, radios, telefones
- Objetos medios: capacetes, garrafas, mochilas, ferramentas
- Objetos pequenos: copos, decoracoes, livros, papeis organizados
- Para cada objeto: cor, tamanho aproximado e posicao

ETAPA 2 - INVENTARIO DA FOTO ATUAL:
Examine a FOTO 2. Liste todos os objetos visiveis.

ETAPA 3 - COMPARACAO:
Para cada objeto da FOTO 1, verifique se esta na FOTO 2.
Considere que o angulo pode variar — procure o objeto em toda a imagem.
So declare FALTANTE se tiver certeza que o objeto nao esta em nenhuma parte da FOTO 2.

REGRAS:
1. IGNORE variacoes de iluminacao, angulo e altura da camera
2. IGNORE objetos parcialmente fora do enquadramento
3. So reporte FALTANTE com CERTEZA ABSOLUTA
4. Objetos similares no mesmo lugar NAO sao faltantes

Responda APENAS em JSON valido, sem markdown:
{
  "score": 95,
  "findings": [
    {
      "type": "missing_item",
      "severity": "high",
      "description": "Descricao especifica (cor, tipo, tamanho)",
      "location": "Localizacao na FOTO 1"
    }
  ],
  "conformities": ["Objeto — cor — presente e em bom estado"]
}

- score: 100 = identico, desconte 15-25 por item faltante importante
- type: "missing_item", "physical_damage", "stain" ou "structural"
- severity: "high"(eletronicos/moveis), "medium"(uteis), "low"(decoracao)
- Escreva em portugues brasileiro`

      const response = await fetch(`${ENDPOINT}/chat/completions`, {
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
              { type: 'text', text: '=== FOTO 1: ESTADO ORIGINAL ===' },
              { type: 'image_url', image_url: { url: matrixPhotos[pos] } },
              { type: 'text', text: '=== FOTO 2: ESTADO ATUAL ===' },
              { type: 'image_url', image_url: { url: exitPhotos[pos] } },
              { type: 'text', text: prompt },
            ],
          }],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      })

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || '{}'
      const clean = text.replace(/```json|```/g, '').trim()

      try {
        const parsed = JSON.parse(clean)
        results.push(parsed)
      } catch {
        results.push({ score: 100, findings: [], conformities: [] })
      }

      // Delay entre requisicoes
      await new Promise(r => setTimeout(r, 1000))
    }

    // Consolida resultados
    const allFindings: any[] = []
    const seenItems = new Set<string>()

    for (const r of results) {
      for (const f of (r.findings || [])) {
        const key = `${f.type}_${f.description.toLowerCase().split(' ').slice(0, 4).join('_')}`
        if (!seenItems.has(key)) {
          seenItems.add(key)
          allFindings.push(f)
        }
      }
    }

    const allConformities = [...new Set(results.flatMap((r: any) => r.conformities || []))]
    const avgScore = Math.round(results.reduce((a: number, r: any) => a + (r.score || 100), 0) / Math.max(results.length, 1))
    const condition = avgScore >= 75 ? 'good' : avgScore >= 50 ? 'warning' : 'critical'

    const summary = allFindings.length > 0
      ? `Foram identificadas ${allFindings.length} ocorrencia(s): ${allFindings.slice(0, 2).map((f: any) => f.description).join(', ')}.`
      : `Comodo em conformidade com o estado original.`

    return new Response(JSON.stringify({
      score: avgScore,
      condition,
      summary,
      findings: allFindings,
      conformities: allConformities,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})