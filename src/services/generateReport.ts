import jsPDF from 'jspdf'

type Finding = {
  type: string
  severity: string
  description: string
  location: string
}

type RoomResult = {
  name: string
  score: number
  condition: string
  summary: string
  findings: Finding[]
  conformities: string[]
  matrixPhotos: string[]
  exitPhotos: string[]
}

type ReportData = {
  propertyName: string
  propertyAddress: string
  inspectionDate: string
  overallScore: number
  rooms: RoomResult[]
}

async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}

function getConditionLabel(condition: string) {
  return { good: 'Bom', warning: 'Atenção', critical: 'Crítico' }[condition] || condition
}

function getConditionRGB(condition: string): [number, number, number] {
  return {
    good: [21, 87, 36] as [number, number, number],
    warning: [133, 100, 4] as [number, number, number],
    critical: [192, 57, 43] as [number, number, number],
  }[condition] || [51, 51, 51]
}

function getSeverityRGB(severity: string): [number, number, number] {
  return {
    low: [146, 64, 14] as [number, number, number],
    medium: [153, 27, 27] as [number, number, number],
    high: [127, 29, 29] as [number, number, number],
  }[severity] || [51, 51, 51]
}

function getTypeLabel(type: string) {
  return {
    missing_item: 'Item Faltante',
    physical_damage: 'Dano Físico',
    stain: 'Mancha/Sujeira',
    structural: 'Alteração Estrutural',
    added_item: 'Item Adicionado',
    general_condition: 'Condição Geral',
  }[type] || type
}

export async function generateInspectionReport(data: ReportData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const MARGIN = 16
  const CONTENT_W = W - MARGIN * 2

  // ─── COLORS ───
  const NAVY: [number, number, number] = [11, 45, 82]
  const GREEN: [number, number, number] = [46, 204, 138]
  const CREAM: [number, number, number] = [244, 246, 249]
  const MUTED: [number, number, number] = [91, 122, 153]
  const WHITE: [number, number, number] = [255, 255, 255]
  const BORDER: [number, number, number] = [229, 231, 235]

  // ─── COVER PAGE ───
  // Background
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 297, 'F')

  // Decorative circles
  doc.setFillColor(255, 255, 255, 0.05)
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.circle(175, 60, 45, 'S')
  doc.circle(175, 60, 30, 'S')
  doc.circle(35, 240, 35, 'S')

  // Green accent bar
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, 5, 297, 'F')

  // Logo mark
  doc.setFillColor(...GREEN)
  doc.roundedRect(MARGIN, 28, 12, 12, 2, 2, 'F')
  doc.setFillColor(...NAVY)
  doc.roundedRect(MARGIN + 7, 35, 5, 5, 1, 1, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('VC', MARGIN + 2, 37)

  // Logo text
  doc.setTextColor(...WHITE)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Visu', MARGIN + 16, 37)
  doc.setTextColor(...GREEN)
  doc.text('Check', MARGIN + 31, 37)

  // Tag line
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 240)
  doc.text('Vistorias Inteligentes para Imóveis', MARGIN + 16, 43)

  // Divider
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(MARGIN, 54, W - MARGIN, 54)
  doc.setLineDashPattern([], 0)

  // Report title
  doc.setTextColor(200, 220, 240)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setCharSpace(3)
  doc.text('RELATÓRIO DE VISTORIA', MARGIN, 68)
  doc.setCharSpace(0)

  doc.setTextColor(...WHITE)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Laudo de Saída', MARGIN, 82)

  doc.setTextColor(...GREEN)
  doc.setFontSize(28)
  doc.text('Inteligente', MARGIN, 95)

  // Property info card
  doc.setFillColor(255, 255, 255)
  doc.setFillColor(20, 61, 107)
  doc.roundedRect(MARGIN, 110, CONTENT_W, 52, 4, 4, 'F')

  doc.setTextColor(200, 220, 240)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setCharSpace(2)
  doc.text('PROPRIEDADE', MARGIN + 8, 122)
  doc.setCharSpace(0)

  doc.setTextColor(...WHITE)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(data.propertyName, MARGIN + 8, 132)

  doc.setTextColor(200, 220, 240)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (data.propertyAddress) {
    doc.text(data.propertyAddress, MARGIN + 8, 140)
  }

  // Divider inside card
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.2)
  doc.setLineDashPattern([1, 2], 0)
  doc.line(MARGIN + 8, 146, W - MARGIN - 8, 146)
  doc.setLineDashPattern([], 0)

  doc.setTextColor(200, 220, 240)
  doc.setFontSize(8)
  doc.text(`DATA DE EMISSÃO: ${data.inspectionDate}`, MARGIN + 8, 154)

  // Score circle
  const scoreColor = data.overallScore >= 75 ? GREEN : data.overallScore >= 50 ? [245, 158, 11] as [number,number,number] : [239, 68, 68] as [number,number,number]
  doc.setFillColor(20, 61, 107)
  doc.circle(W - MARGIN - 22, 172, 20, 'F')
  doc.setDrawColor(...scoreColor)
  doc.setLineWidth(2.5)
  doc.circle(W - MARGIN - 22, 172, 20, 'S')

  doc.setTextColor(...scoreColor)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  const scoreText = `${data.overallScore}%`
  const scoreW = doc.getTextWidth(scoreText)
  doc.text(scoreText, W - MARGIN - 22 - scoreW / 2, 175)

  doc.setTextColor(200, 220, 240)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('condição', W - MARGIN - 22 - doc.getTextWidth('condição') / 2, 181)

  // Score label below circle
  const condLabel = getConditionLabel(data.overallScore >= 75 ? 'good' : data.overallScore >= 50 ? 'warning' : 'critical')
  doc.setFillColor(...scoreColor)
  doc.roundedRect(W - MARGIN - 38, 185, 32, 7, 2, 2, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(condLabel, W - MARGIN - 38 + 16 - doc.getTextWidth(condLabel) / 2, 190)

  // Summary stats
  const totalFindings = data.rooms.reduce((a, r) => a + r.findings.length, 0)
  const totalConformities = data.rooms.reduce((a, r) => a + r.conformities.length, 0)

  const stats = [
    { label: 'Cômodos', value: String(data.rooms.length) },
    { label: 'Ocorrências', value: String(totalFindings) },
    { label: 'Conformes', value: String(totalConformities) },
  ]

  stats.forEach((stat, i) => {
    const x = MARGIN + i * 58
    doc.setFillColor(20, 61, 107)
    doc.roundedRect(x, 165, 50, 24, 3, 3, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + 25 - doc.getTextWidth(stat.value) / 2, 178)
    doc.setTextColor(200, 220, 240)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + 25 - doc.getTextWidth(stat.label) / 2, 185)
  })

  // AI badge
  doc.setFillColor(...GREEN)
  doc.roundedRect(MARGIN, 200, 55, 9, 2, 2, 'F')
  doc.setTextColor(...NAVY)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('● ANÁLISE POR IA • GEMINI VISION', MARGIN + 4, 206)

  // Footer cover
  doc.setTextColor(200, 220, 240)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Este relatório foi gerado automaticamente pelo VisuCheck com tecnologia de visão computacional.', MARGIN, 270)
  doc.text('visucheck.com', W - MARGIN - doc.getTextWidth('visucheck.com'), 270)
  doc.setDrawColor(46, 204, 138)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, 273, W - MARGIN, 273)

  // ─── ROOM PAGES ───
  for (const room of data.rooms) {
    doc.addPage()

    // Header bar
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, W, 18, 'F')
    doc.setFillColor(...GREEN)
    doc.rect(0, 0, 4, 18, 'F')

    doc.setTextColor(...WHITE)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('VISUCHECK', MARGIN, 11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 220, 240)
    doc.text(`${data.propertyName}  •  ${data.inspectionDate}`, MARGIN + 28, 11)

    // Score badge top right
    const rc = room.condition
    const rcRGB = getConditionRGB(rc)
    doc.setFillColor(...rcRGB)
    doc.roundedRect(W - MARGIN - 32, 3, 28, 10, 2, 2, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    const badge = `${room.score}% ${getConditionLabel(rc).toUpperCase()}`
    doc.text(badge, W - MARGIN - 32 + 14 - doc.getTextWidth(badge) / 2, 9.5)

    // Room title
    doc.setTextColor(...NAVY)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(room.name, MARGIN, 34)

    // Underline accent
    doc.setDrawColor(...GREEN)
    doc.setLineWidth(2)
    doc.line(MARGIN, 37, MARGIN + doc.getTextWidth(room.name), 37)

    // Summary box
    doc.setFillColor(...CREAM)
    doc.roundedRect(MARGIN, 42, CONTENT_W, 18, 3, 3, 'F')
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.roundedRect(MARGIN, 42, CONTENT_W, 18, 3, 3, 'S')
    doc.setDrawColor(...GREEN)
    doc.setLineWidth(1.5)
    doc.line(MARGIN, 44, MARGIN, 58)

    doc.setTextColor(...MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('RESUMO DA ANÁLISE', MARGIN + 4, 49)
    doc.setTextColor(...NAVY)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const summaryLines = doc.splitTextToSize(room.summary, CONTENT_W - 10)
    doc.text(summaryLines.slice(0, 2), MARGIN + 4, 55)

    let y = 66

    // Photos side by side
    if (room.matrixPhotos.length > 0 || room.exitPhotos.length > 0) {
      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setCharSpace(1.5)
      doc.text('COMPARATIVO FOTOGRÁFICO', MARGIN, y)
      doc.setCharSpace(0)
      y += 5

      const photoW = (CONTENT_W - 6) / 2
      const photoH = 42

      // Before label
      doc.setFillColor(...NAVY)
      doc.roundedRect(MARGIN, y, photoW, 7, 1, 1, 'F')
      doc.setTextColor(...WHITE)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTADO ORIGINAL', MARGIN + photoW / 2 - doc.getTextWidth('ESTADO ORIGINAL') / 2, y + 4.8)

      // After label
      const condColor = getConditionRGB(room.condition)
      doc.setFillColor(...condColor)
      doc.roundedRect(MARGIN + photoW + 6, y, photoW, 7, 1, 1, 'F')
      doc.setTextColor(...WHITE)
      doc.text('ESTADO ATUAL', MARGIN + photoW + 6 + photoW / 2 - doc.getTextWidth('ESTADO ATUAL') / 2, y + 4.8)

      y += 8

      // Matrix photo
      if (room.matrixPhotos[0]) {
        try {
          const img = await loadImageAsBase64(room.matrixPhotos[0])
          if (img) {
            doc.setFillColor(...BORDER)
            doc.roundedRect(MARGIN, y, photoW, photoH, 2, 2, 'F')
            doc.addImage(img, 'JPEG', MARGIN, y, photoW, photoH, undefined, 'MEDIUM')
            doc.setDrawColor(...NAVY)
            doc.setLineWidth(0.5)
            doc.roundedRect(MARGIN, y, photoW, photoH, 2, 2, 'S')
          }
        } catch {}
      }

      // Exit photo
      if (room.exitPhotos[0]) {
        try {
          const img = await loadImageAsBase64(room.exitPhotos[0])
          if (img) {
            doc.setFillColor(...BORDER)
            doc.roundedRect(MARGIN + photoW + 6, y, photoW, photoH, 2, 2, 'F')
            doc.addImage(img, 'JPEG', MARGIN + photoW + 6, y, photoW, photoH, undefined, 'MEDIUM')
            const exitBorderColor = room.findings.length > 0 ? getConditionRGB('critical') : getConditionRGB('good')
            doc.setDrawColor(...exitBorderColor)
            doc.setLineWidth(0.8)
            doc.roundedRect(MARGIN + photoW + 6, y, photoW, photoH, 2, 2, 'S')
          }
        } catch {}
      }

      y += photoH + 8
    }

    // Findings
    if (room.findings.length > 0) {
      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setCharSpace(1.5)
      doc.text('OCORRÊNCIAS ENCONTRADAS', MARGIN, y)
      doc.setCharSpace(0)
      y += 5

      for (const finding of room.findings) {
        if (y > 255) { doc.addPage(); y = 25 }

        const sRGB = getSeverityRGB(finding.severity)
        const findingH = 18

        doc.setFillColor(254, 242, 242)
        doc.roundedRect(MARGIN, y, CONTENT_W, findingH, 2, 2, 'F')
        doc.setDrawColor(252, 165, 165)
        doc.setLineWidth(0.3)
        doc.roundedRect(MARGIN, y, CONTENT_W, findingH, 2, 2, 'S')

        // Severity stripe
        doc.setFillColor(...sRGB)
        doc.roundedRect(MARGIN, y, 3, findingH, 1, 1, 'F')

        // Type badge
        const typeLabel = getTypeLabel(finding.type)
        doc.setFillColor(...sRGB)
        doc.roundedRect(MARGIN + 6, y + 3, doc.getTextWidth(typeLabel) + 6, 6, 1, 1, 'F')
        doc.setTextColor(...WHITE)
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'bold')
        doc.text(typeLabel, MARGIN + 9, y + 7.2)

        // Description
        doc.setTextColor(...NAVY)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        const descLines = doc.splitTextToSize(finding.description, CONTENT_W - 50)
        doc.text(descLines[0], MARGIN + 6, y + 14)

        // Location
        if (finding.location) {
          doc.setTextColor(...MUTED)
          doc.setFontSize(7)
          doc.text(`📍 ${finding.location}`, W - MARGIN - 6 - doc.getTextWidth(`📍 ${finding.location}`), y + 14)
        }

        y += findingH + 4
      }
    }

    // Conformities
    if (room.conformities.length > 0) {
      if (y > 240) { doc.addPage(); y = 25 }
      y += 4

      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setCharSpace(1.5)
      doc.text('ITENS EM CONFORMIDADE', MARGIN, y)
      doc.setCharSpace(0)
      y += 5

      const cols = 2
      const colW = (CONTENT_W - 4) / cols

      room.conformities.forEach((c, ci) => {
        if (y > 265) { doc.addPage(); y = 25 }
        const col = ci % cols
        const row = Math.floor(ci / cols)
        const cx = MARGIN + col * (colW + 4)
        const cy = y + row * 10

        doc.setFillColor(240, 255, 244)
        doc.roundedRect(cx, cy, colW, 8, 1.5, 1.5, 'F')
        doc.setDrawColor(195, 230, 203)
        doc.setLineWidth(0.3)
        doc.roundedRect(cx, cy, colW, 8, 1.5, 1.5, 'S')
        doc.setTextColor(21, 87, 36)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const confText = doc.splitTextToSize(`✓  ${c}`, colW - 6)
        doc.text(confText[0], cx + 3, cy + 5.5)
      })

      y += Math.ceil(room.conformities.length / cols) * 10
    }

    // Footer
    doc.setFillColor(...CREAM)
    doc.rect(0, 284, W, 13, 'F')
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(0, 284, W, 284)
    doc.setTextColor(...MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('VisuCheck — Vistorias Inteligentes', MARGIN, 291)
    doc.text(`${data.propertyName}  •  ${data.inspectionDate}`, W / 2 - doc.getTextWidth(`${data.propertyName}  •  ${data.inspectionDate}`) / 2, 291)
    doc.text(`Página ${doc.getNumberOfPages()}`, W - MARGIN - doc.getTextWidth(`Página ${doc.getNumberOfPages()}`), 291)
  }

  // ─── FINAL SUMMARY PAGE ───
  doc.addPage()

  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 18, 'F')
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, 4, 18, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('VISUCHECK', MARGIN, 11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 240)
  doc.text('Resumo Final', MARGIN + 28, 11)

  doc.setTextColor(...NAVY)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo Final da Vistoria', MARGIN, 34)
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(2)
  doc.line(MARGIN, 37, MARGIN + 90, 37)

  // Big score
  const scoreColorFinal = data.overallScore >= 75 ? GREEN : data.overallScore >= 50 ? [245, 158, 11] as [number,number,number] : [239, 68, 68] as [number,number,number]
  doc.setFillColor(data.overallScore >= 75 ? 240 : data.overallScore >= 50 ? 254 : 254, data.overallScore >= 75 ? 255 : data.overallScore >= 50 ? 243 : 226, data.overallScore >= 75 ? 244 : data.overallScore >= 50 ? 199 : 226)
  doc.roundedRect(MARGIN, 44, CONTENT_W, 32, 4, 4, 'F')
  doc.setTextColor(...scoreColorFinal)
  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  doc.text(`${data.overallScore}%`, MARGIN + 12, 68)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Condição geral do imóvel', MARGIN + 46, 58)
  doc.setFontSize(9)
  doc.text(data.overallScore >= 75 ? '✅ Imóvel em boas condições' : data.overallScore >= 50 ? '⚠️ Imóvel com pontos de atenção' : '🚨 Imóvel com danos significativos', MARGIN + 46, 68)

  // Per room scores
  let sy = 86
  doc.setTextColor(...MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setCharSpace(1.5)
  doc.text('RESULTADO POR CÔMODO', MARGIN, sy)
  doc.setCharSpace(0)
  sy += 5

  for (const room of data.rooms) {
    if (sy > 260) break
    const rRGB = getConditionRGB(room.condition)

    doc.setFillColor(...CREAM)
    doc.roundedRect(MARGIN, sy, CONTENT_W, 10, 2, 2, 'F')
    doc.setFillColor(...rRGB)
    doc.roundedRect(MARGIN, sy, 3, 10, 1, 1, 'F')

    doc.setTextColor(...NAVY)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(room.name, MARGIN + 7, sy + 6.5)

    // Score bar
    const barX = MARGIN + 70
    const barW = 80
    doc.setFillColor(...BORDER)
    doc.roundedRect(barX, sy + 3.5, barW, 3, 1, 1, 'F')
    doc.setFillColor(...rRGB)
    doc.roundedRect(barX, sy + 3.5, (room.score / 100) * barW, 3, 1, 1, 'F')

    doc.setTextColor(...rRGB)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`${room.score}%`, barX + barW + 4, sy + 6.5)

    doc.setTextColor(...MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`${room.findings.length} ocorrência(s)`, W - MARGIN - 4 - doc.getTextWidth(`${room.findings.length} ocorrência(s)`), sy + 6.5)

    sy += 13
  }

  // Signature area
  sy = Math.max(sy + 10, 220)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, sy, MARGIN + 70, sy)
  doc.line(W - MARGIN - 70, sy, W - MARGIN, sy)

  doc.setTextColor(...MUTED)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Assinatura do Vistoriador', MARGIN, sy + 6)
  doc.text('Assinatura do Locatário', W - MARGIN - 70, sy + 6)

  doc.setFontSize(7)
  doc.text(data.inspectionDate, MARGIN, sy + 12)
  doc.text(data.inspectionDate, W - MARGIN - 70, sy + 12)

  // Footer final
  doc.setFillColor(...CREAM)
  doc.rect(0, 284, W, 13, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(0, 284, W, 284)
  doc.setTextColor(...MUTED)
  doc.setFontSize(7)
  doc.text('VisuCheck — Vistorias Inteligentes com IA', MARGIN, 291)
  doc.text('visucheck.com', W - MARGIN - doc.getTextWidth('visucheck.com'), 291)

  // Save
  const fileName = `VisuCheck_${data.propertyName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
  doc.save(fileName)
}