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
  return { good: 'Bom', warning: 'Atencao', critical: 'Critico' }[condition] || condition
}

function getConditionRGB(condition: string): [number, number, number] {
  return ({
    good: [21, 87, 36],
    warning: [133, 100, 4],
    critical: [192, 57, 43],
  } as Record<string, [number, number, number]>)[condition] || [51, 51, 51]
}

function getSeverityRGB(severity: string): [number, number, number] {
  return ({
    low: [146, 64, 14],
    medium: [153, 27, 27],
    high: [127, 29, 29],
  } as Record<string, [number, number, number]>)[severity] || [51, 51, 51]
}

function getTypeLabel(type: string) {
  return ({
    missing_item: 'Item Faltante',
    physical_damage: 'Dano Fisico',
    stain: 'Mancha/Sujeira',
    structural: 'Alteracao Estrutural',
    added_item: 'Item Adicionado',
    general_condition: 'Condicao Geral',
  } as Record<string, string>)[type] || type
}

export async function generateInspectionReport(data: ReportData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const MARGIN = 16
  const CONTENT_W = W - MARGIN * 2

  const NAVY: [number, number, number] = [11, 45, 82]
  const GREEN: [number, number, number] = [46, 204, 138]
  const CREAM: [number, number, number] = [244, 246, 249]
  const MUTED: [number, number, number] = [91, 122, 153]
  const WHITE: [number, number, number] = [255, 255, 255]
  const BORDER: [number, number, number] = [229, 231, 235]

  // ─── CAPA ───
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 297, 'F')

  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.circle(175, 60, 45, 'S')
  doc.circle(175, 60, 30, 'S')
  doc.circle(35, 240, 35, 'S')

  doc.setFillColor(...GREEN)
  doc.rect(0, 0, 5, 297, 'F')

  doc.setFillColor(...GREEN)
  doc.roundedRect(MARGIN, 28, 12, 12, 2, 2, 'F')
  doc.setFillColor(...NAVY)
  doc.roundedRect(MARGIN + 7, 35, 5, 5, 1, 1, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('VC', MARGIN + 2, 37)

  doc.setTextColor(...WHITE)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Visu', MARGIN + 16, 37)
  doc.setTextColor(...GREEN)
  doc.text('Check', MARGIN + 31, 37)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 240)
  doc.text('Vistorias Inteligentes para Imoveis', MARGIN + 16, 43)

  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(MARGIN, 54, W - MARGIN, 54)
  doc.setLineDashPattern([], 0)

  doc.setTextColor(200, 220, 240)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setCharSpace(3)
  doc.text('RELATORIO DE VISTORIA', MARGIN, 68)
  doc.setCharSpace(0)

  doc.setTextColor(...WHITE)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Laudo de Saida', MARGIN, 82)
  doc.setTextColor(...GREEN)
  doc.text('Inteligente', MARGIN, 95)

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
  const propName = data.propertyName.length > 35 ? data.propertyName.substring(0, 32) + '...' : data.propertyName
  doc.text(propName, MARGIN + 8, 132)

  doc.setTextColor(200, 220, 240)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (data.propertyAddress) {
    const addr = data.propertyAddress.length > 50 ? data.propertyAddress.substring(0, 47) + '...' : data.propertyAddress
    doc.text(addr, MARGIN + 8, 140)
  }

  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.2)
  doc.setLineDashPattern([1, 2], 0)
  doc.line(MARGIN + 8, 146, W - MARGIN - 8, 146)
  doc.setLineDashPattern([], 0)

  doc.setTextColor(200, 220, 240)
  doc.setFontSize(8)
  doc.text('DATA DE EMISSAO: ' + data.inspectionDate, MARGIN + 8, 154)

  const scoreColor: [number, number, number] = data.overallScore >= 75 ? GREEN : data.overallScore >= 50 ? [245, 158, 11] : [239, 68, 68]

  doc.setFillColor(20, 61, 107)
  doc.circle(W - MARGIN - 22, 172, 20, 'F')
  doc.setDrawColor(...scoreColor)
  doc.setLineWidth(2.5)
  doc.circle(W - MARGIN - 22, 172, 20, 'S')
  doc.setTextColor(...scoreColor)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  const scoreText = `${data.overallScore}%`
  doc.text(scoreText, W - MARGIN - 22 - doc.getTextWidth(scoreText) / 2, 175)
  doc.setTextColor(200, 220, 240)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('condicao', W - MARGIN - 22 - doc.getTextWidth('condicao') / 2, 181)

  const condLabel = getConditionLabel(data.overallScore >= 75 ? 'good' : data.overallScore >= 50 ? 'warning' : 'critical')
  doc.setFillColor(...scoreColor)
  doc.roundedRect(W - MARGIN - 38, 185, 32, 7, 2, 2, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(condLabel, W - MARGIN - 38 + 16 - doc.getTextWidth(condLabel) / 2, 190)

  const totalFindings = data.rooms.reduce((a, r) => a + r.findings.length, 0)
  const totalConformities = data.rooms.reduce((a, r) => a + r.conformities.length, 0)
  const stats = [
    { label: 'Comodos', value: String(data.rooms.length) },
    { label: 'Ocorrencias', value: String(totalFindings) },
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

  doc.setFillColor(...GREEN)
  doc.roundedRect(MARGIN, 200, 55, 9, 2, 2, 'F')
  doc.setTextColor(...NAVY)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('IA - GEMINI VISION', MARGIN + 4, 206)

  doc.setTextColor(200, 220, 240)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatorio gerado automaticamente pelo VisuCheck.', MARGIN, 270)
  doc.text('visucheck.com', W - MARGIN - doc.getTextWidth('visucheck.com'), 270)
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, 273, W - MARGIN, 273)

  // ─── PAGINAS POR COMODO ───
  for (const room of data.rooms) {
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
    const headerInfo = (data.propertyName.length > 25 ? data.propertyName.substring(0, 22) + '...' : data.propertyName) + '  |  ' + data.inspectionDate
    doc.text(headerInfo, MARGIN + 28, 11)

    const rcRGB = getConditionRGB(room.condition)
    doc.setFillColor(...rcRGB)
    doc.roundedRect(W - MARGIN - 36, 3, 32, 10, 2, 2, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    const badge = `${room.score}% ${getConditionLabel(room.condition).toUpperCase()}`
    doc.text(badge, W - MARGIN - 36 + 16 - doc.getTextWidth(badge) / 2, 9.5)

    doc.setTextColor(...NAVY)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(room.name, MARGIN, 34)
    doc.setDrawColor(...GREEN)
    doc.setLineWidth(2)
    doc.line(MARGIN, 37, MARGIN + Math.min(doc.getTextWidth(room.name), CONTENT_W), 37)

    // Summary box
    const summaryLines = doc.splitTextToSize(room.summary, CONTENT_W - 12)
    const summaryShown = summaryLines.slice(0, 3)
    const summaryH = 14 + summaryShown.length * 5

    doc.setFillColor(...CREAM)
    doc.roundedRect(MARGIN, 42, CONTENT_W, summaryH, 3, 3, 'F')
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.roundedRect(MARGIN, 42, CONTENT_W, summaryH, 3, 3, 'S')
    doc.setDrawColor(...GREEN)
    doc.setLineWidth(1.5)
    doc.line(MARGIN, 44, MARGIN, 42 + summaryH - 2)

    doc.setTextColor(...MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('RESUMO DA ANALISE', MARGIN + 4, 49)
    doc.setTextColor(...NAVY)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(summaryShown, MARGIN + 4, 55)

    let y = 42 + summaryH + 8

    // Fotos
    if (room.matrixPhotos.length > 0 || room.exitPhotos.length > 0) {
      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setCharSpace(1.5)
      doc.text('COMPARATIVO FOTOGRAFICO', MARGIN, y)
      doc.setCharSpace(0)
      y += 5

      const photoW = (CONTENT_W - 6) / 2
      const photoH = 40

      doc.setFillColor(...NAVY)
      doc.roundedRect(MARGIN, y, photoW, 7, 1, 1, 'F')
      doc.setTextColor(...WHITE)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTADO ORIGINAL', MARGIN + photoW / 2 - doc.getTextWidth('ESTADO ORIGINAL') / 2, y + 4.8)

      doc.setFillColor(...rcRGB)
      doc.roundedRect(MARGIN + photoW + 6, y, photoW, 7, 1, 1, 'F')
      doc.text('ESTADO ATUAL', MARGIN + photoW + 6 + photoW / 2 - doc.getTextWidth('ESTADO ATUAL') / 2, y + 4.8)

      y += 8

      if (room.matrixPhotos[0]) {
        try {
          const img = await loadImageAsBase64(room.matrixPhotos[0])
          if (img) {
            doc.addImage(img, 'JPEG', MARGIN, y, photoW, photoH, undefined, 'MEDIUM')
            doc.setDrawColor(...NAVY)
            doc.setLineWidth(0.5)
            doc.roundedRect(MARGIN, y, photoW, photoH, 2, 2, 'S')
          }
        } catch { }
      }

      if (room.exitPhotos[0]) {
        try {
          const img = await loadImageAsBase64(room.exitPhotos[0])
          if (img) {
            doc.addImage(img, 'JPEG', MARGIN + photoW + 6, y, photoW, photoH, undefined, 'MEDIUM')
            const exitBorder = room.findings.length > 0 ? getConditionRGB('critical') : getConditionRGB('good')
            doc.setDrawColor(...exitBorder)
            doc.setLineWidth(0.8)
            doc.roundedRect(MARGIN + photoW + 6, y, photoW, photoH, 2, 2, 'S')
          }
        } catch { }
      }

      y += photoH + 10
    }

    // Ocorrencias
    if (room.findings.length > 0) {
      if (y > 200) { doc.addPage(); y = 25 }

      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setCharSpace(1.5)
      doc.text('OCORRENCIAS ENCONTRADAS', MARGIN, y)
      doc.setCharSpace(0)
      y += 6

      for (const finding of room.findings) {
        const sRGB = getSeverityRGB(finding.severity)
        const typeLabel = getTypeLabel(finding.type)
        const descLines = doc.splitTextToSize(finding.description, CONTENT_W - 14)
        const descShown = descLines.slice(0, 2)
        const locText = finding.location ? 'Local: ' + finding.location : ''
        const locLines = locText ? doc.splitTextToSize(locText, CONTENT_W - 14) : []
        const locShown = locLines.slice(0, 1)
        const totalH = 10 + descShown.length * 5 + (locShown.length > 0 ? locShown.length * 4 + 2 : 0)

        if (y + totalH > 270) { doc.addPage(); y = 25 }

        doc.setFillColor(254, 242, 242)
        doc.roundedRect(MARGIN, y, CONTENT_W, totalH, 2, 2, 'F')
        doc.setDrawColor(252, 165, 165)
        doc.setLineWidth(0.3)
        doc.roundedRect(MARGIN, y, CONTENT_W, totalH, 2, 2, 'S')
        doc.setFillColor(...sRGB)
        doc.roundedRect(MARGIN, y, 3, totalH, 1, 1, 'F')

        const badgeW = doc.getTextWidth(typeLabel) + 6
        doc.setFillColor(...sRGB)
        doc.roundedRect(MARGIN + 6, y + 2.5, badgeW, 5.5, 1, 1, 'F')
        doc.setTextColor(...WHITE)
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'bold')
        doc.text(typeLabel, MARGIN + 9, y + 6.5)

        doc.setTextColor(...NAVY)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.text(descShown, MARGIN + 6, y + 11)

        if (locShown.length > 0) {
          doc.setTextColor(...MUTED)
          doc.setFontSize(7)
          doc.text(locShown, MARGIN + 6, y + 11 + descShown.length * 5 + 2)
        }

        y += totalH + 4
      }
    }

    // Conformidades
    if (room.conformities.length > 0) {
      if (y > 240) { doc.addPage(); y = 25 }
      y += 4

      doc.setTextColor(...MUTED)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setCharSpace(1.5)
      doc.text('ITENS EM CONFORMIDADE', MARGIN, y)
      doc.setCharSpace(0)
      y += 6

      const cols = 2
      const colW = (CONTENT_W - 4) / cols

      room.conformities.forEach((c, ci) => {
        const col = ci % cols
        const row = Math.floor(ci / cols)
        const cx = MARGIN + col * (colW + 4)
        const cy = y + row * 10

        if (cy > 270) return

        doc.setFillColor(240, 255, 244)
        doc.roundedRect(cx, cy, colW, 8, 1.5, 1.5, 'F')
        doc.setDrawColor(195, 230, 203)
        doc.setLineWidth(0.3)
        doc.roundedRect(cx, cy, colW, 8, 1.5, 1.5, 'S')
        doc.setTextColor(21, 87, 36)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const confLines = doc.splitTextToSize(c, colW - 8)
        doc.text(confLines[0], cx + 4, cy + 5.5)
      })

      y += Math.ceil(room.conformities.length / cols) * 10
    }

    // Footer pagina
    doc.setFillColor(...CREAM)
    doc.rect(0, 284, W, 13, 'F')
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(0, 284, W, 284)
    doc.setTextColor(...MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('VisuCheck - Vistorias Inteligentes', MARGIN, 291)
    const footerCenter = (data.propertyName.length > 20 ? data.propertyName.substring(0, 17) + '...' : data.propertyName) + '  |  ' + data.inspectionDate
    doc.text(footerCenter, W / 2 - doc.getTextWidth(footerCenter) / 2, 291)
    doc.text('Pagina ' + doc.getNumberOfPages(), W - MARGIN - doc.getTextWidth('Pagina ' + doc.getNumberOfPages()), 291)
  }

  // ─── RESUMO FINAL ───
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

  const scoreColorFinal: [number, number, number] = data.overallScore >= 75 ? GREEN : data.overallScore >= 50 ? [245, 158, 11] : [239, 68, 68]
  const scoreBg: [number, number, number] = data.overallScore >= 75 ? [240, 255, 244] : data.overallScore >= 50 ? [254, 243, 199] : [254, 226, 226]

  doc.setFillColor(...scoreBg)
  doc.roundedRect(MARGIN, 44, CONTENT_W, 32, 4, 4, 'F')
  doc.setTextColor(...scoreColorFinal)
  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  doc.text(`${data.overallScore}%`, MARGIN + 12, 68)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Condicao geral do imovel', MARGIN + 46, 58)
  doc.setFontSize(9)
  const condMsg = data.overallScore >= 75 ? 'Imovel em boas condicoes' : data.overallScore >= 50 ? 'Imovel com pontos de atencao' : 'Imovel com danos significativos'
  doc.text(condMsg, MARGIN + 46, 68)

  let sy = 86
  doc.setTextColor(...MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setCharSpace(1.5)
  doc.text('RESULTADO POR COMODO', MARGIN, sy)
  doc.setCharSpace(0)
  sy += 6

  for (const room of data.rooms) {
    if (sy > 255) break
    const rRGB = getConditionRGB(room.condition)

    doc.setFillColor(...CREAM)
    doc.roundedRect(MARGIN, sy, CONTENT_W, 12, 2, 2, 'F')
    doc.setFillColor(...rRGB)
    doc.roundedRect(MARGIN, sy, 3, 12, 1, 1, 'F')

    doc.setTextColor(...NAVY)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const roomNameShort = room.name.length > 28 ? room.name.substring(0, 25) + '...' : room.name
    doc.text(roomNameShort, MARGIN + 7, sy + 7.5)

    const barX = MARGIN + 78
    const barW = 72
    doc.setFillColor(...BORDER)
    doc.roundedRect(barX, sy + 4, barW, 4, 1, 1, 'F')
    doc.setFillColor(...rRGB)
    doc.roundedRect(barX, sy + 4, (room.score / 100) * barW, 4, 1, 1, 'F')

    doc.setTextColor(...rRGB)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`${room.score}%`, barX + barW + 4, sy + 7.5)

    doc.setTextColor(...MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const ocText = `${room.findings.length} ocorr.`
    doc.text(ocText, W - MARGIN - 4 - doc.getTextWidth(ocText), sy + 7.5)

    sy += 15
  }

  sy = Math.max(sy + 16, 225)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, sy, MARGIN + 72, sy)
  doc.line(W - MARGIN - 72, sy, W - MARGIN, sy)

  doc.setTextColor(...MUTED)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Assinatura do Vistoriador', MARGIN, sy + 6)
  doc.text('Assinatura do Locatario', W - MARGIN - 72, sy + 6)
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  doc.text(data.inspectionDate, MARGIN, sy + 12)
  doc.text(data.inspectionDate, W - MARGIN - 72, sy + 12)

  doc.setFillColor(...CREAM)
  doc.rect(0, 284, W, 13, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(0, 284, W, 284)
  doc.setTextColor(...MUTED)
  doc.setFontSize(7)
  doc.text('VisuCheck - Vistorias Inteligentes com IA', MARGIN, 291)
  doc.text('visucheck.com', W - MARGIN - doc.getTextWidth('visucheck.com'), 291)

  const fileName = `VisuCheck_${data.propertyName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
  doc.save(fileName)
}