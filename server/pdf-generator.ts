import { jsPDF } from "jspdf";
import { storagePut } from "./storage";
import type { Investigation, Finding } from "../drizzle/schema";

const CATEGORY_LABELS: Record<string, string> = {
  identity: "Identity",
  social_media: "Social Media",
  public_records: "Public Records",
  criminal: "Criminal",
  dating: "Dating",
  professional: "Professional",
  breaches: "Data Breaches",
  dark_web: "Dark Web",
};

function truncateText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

export async function generatePdfReport(
  investigation: Investigation,
  findings: Finding[]
): Promise<{ url: string; key: string }> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
      // Add page number footer
      addPageFooter();
    }
  };

  const addPageFooter = () => {
    const pageNum = doc.getNumberOfPages();
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(`OSINT Deep Dive Report — ${investigation.subjectName} — Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.setTextColor(0);
  };

  // --- Title Page ---
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  y = 50;
  doc.text("OSINT Intelligence Report", pageWidth / 2, y, { align: "center" });

  y += 14;
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Comprehensive Deep Dive Investigation", pageWidth / 2, y, { align: "center" });

  y += 25;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(`Subject: ${investigation.subjectName}`, pageWidth / 2, y, { align: "center" });

  y += 12;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    pageWidth / 2, y, { align: "center" }
  );

  y += 6;
  doc.text(`Total Findings: ${findings.length} across ${Object.keys(CATEGORY_LABELS).length} categories`, pageWidth / 2, y, { align: "center" });

  // Risk Score on title page
  if (investigation.riskScore !== null && investigation.riskScore !== undefined) {
    y += 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    const riskColor: [number, number, number] = investigation.riskScore >= 70 ? [220, 38, 38] : investigation.riskScore >= 40 ? [202, 138, 4] : [22, 163, 74];
    doc.text("Risk Score:", pageWidth / 2 - 20, y, { align: "center" });
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.setFontSize(16);
    doc.text(`${investigation.riskScore}/100`, pageWidth / 2 + 20, y, { align: "center" });
    doc.setTextColor(0);
  }

  // Classification banner
  y += 20;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y - 4, contentWidth, 12, "F");
  doc.setFontSize(9);
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIDENTIAL — FOR AUTHORIZED USE ONLY", pageWidth / 2, y + 3, { align: "center" });
  doc.setTextColor(0);

  // --- Subject Details ---
  doc.addPage();
  y = margin;
  addPageFooter();

  const subjectDetails = investigation.subjectDetails as Record<string, string> | null;
  if (subjectDetails) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Subject Profile", margin, y);
    y += 3;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(200);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fields = Object.entries(subjectDetails).filter(([key, val]) => val && !['additionalInfo', 'imageUrl', 'imageKey'].includes(key));
    for (const [key, value] of fields) {
      checkPageBreak(8);
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), margin + 40, y);
      y += 7;
    }

    // Additional Info
    if (subjectDetails.additionalInfo) {
      y += 4;
      checkPageBreak(15);
      doc.setFont("helvetica", "bold");
      doc.text("Additional Information:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      const addLines = truncateText(doc, subjectDetails.additionalInfo, contentWidth);
      for (const line of addLines) {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 4;
      }
      doc.setTextColor(0);
    }
  }

  // --- Risk Score Breakdown ---
  if (investigation.riskScore !== null && investigation.riskBreakdown) {
    y += 12;
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Risk Assessment", margin, y);
    y += 3;
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(200);
    y += 8;

    doc.setFontSize(10);
    const breakdown = investigation.riskBreakdown as Record<string, number>;
    for (const [cat, score] of Object.entries(breakdown)) {
      checkPageBreak(7);
      const label = CATEGORY_LABELS[cat] || cat;
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin + 2, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${score}/100`, margin + 50, y);
      y += 6;
    }
  }

  // --- Timeline ---
  const timeline = (investigation.timeline as any[]) || [];
  if (timeline.length > 0) {
    y += 12;
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Chronological Timeline", margin, y);
    y += 3;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(200);
    y += 8;

    doc.setFontSize(9);
    for (const event of timeline) {
      checkPageBreak(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246);
      doc.text(event.date || "Unknown Date", margin + 2, y);
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      doc.text(` — ${event.title}`, margin + 30, y);
      y += 4;
      if (event.content) {
        doc.setTextColor(100);
        const contentLines = truncateText(doc, event.content, contentWidth - 10);
        for (const line of contentLines.slice(0, 2)) {
          checkPageBreak(4);
          doc.text(line, margin + 4, y);
          y += 3.5;
        }
        doc.setTextColor(0);
      }
      y += 3;
    }
  }

  // --- Relationships ---
  const relationships = (investigation.relationships as any[]) || [];
  if (relationships.length > 1) {
    y += 12;
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Connections & Relationships", margin, y);
    y += 3;
    doc.setDrawColor(168, 85, 247);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(200);
    y += 8;

    doc.setFontSize(9);
    for (const rel of relationships.filter(r => r.type !== "subject")) {
      checkPageBreak(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${rel.name}`, margin + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(` — ${rel.type}${rel.connection ? ` (${rel.connection})` : ""}`, margin + 2 + doc.getTextWidth(rel.name) + 2, y);
      doc.setTextColor(0);
      y += 6;
    }
  }

  // --- Geolocation ---
  const geolocations = (investigation.geolocations as any[]) || [];
  if (geolocations.length > 0) {
    y += 12;
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Geolocation Intelligence", margin, y);
    y += 3;
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(200);
    y += 8;

    doc.setFontSize(9);
    for (const loc of geolocations) {
      checkPageBreak(8);
      doc.setFont("helvetica", "bold");
      doc.text(loc.location, margin + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(` — ${loc.label} (Source: ${loc.source})`, margin + 2 + doc.getTextWidth(loc.location) + 2, y);
      doc.setTextColor(0);
      y += 6;
    }
  }

  // --- Findings by Category ---
  const categories = Object.keys(CATEGORY_LABELS);
  const groupedFindings: Record<string, Finding[]> = {};
  for (const finding of findings) {
    if (!groupedFindings[finding.category]) {
      groupedFindings[finding.category] = [];
    }
    groupedFindings[finding.category].push(finding);
  }

  for (const category of categories) {
    const catFindings = groupedFindings[category] || [];
    const label = CATEGORY_LABELS[category];

    // Start each category on a new section with clear header
    checkPageBreak(25);
    y += 12;

    // Category header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`(${catFindings.length} findings)`, margin + doc.getTextWidth(label) + 3, y);
    doc.setTextColor(0);
    y += 3;
    doc.setDrawColor(100);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(200);
    y += 7;

    if (catFindings.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150);
      doc.text("No findings in this category.", margin, y);
      doc.setTextColor(0);
      y += 8;
      continue;
    }

    for (const finding of catFindings) {
      checkPageBreak(30);

      // Finding title
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      const titleLines = truncateText(doc, finding.title, contentWidth - 35);
      doc.text(titleLines, margin + 3, y);
      
      // Confidence badge
      const confidenceColors: Record<string, [number, number, number]> = {
        high: [22, 163, 74],
        medium: [202, 138, 4],
        low: [220, 38, 38],
      };
      const confColor = confidenceColors[finding.confidence] || confidenceColors.medium;
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(confColor[0], confColor[1], confColor[2]);
      doc.text(`[${finding.confidence.toUpperCase()}]`, pageWidth - margin - 15, y);

      // Corroboration
      if (finding.corroborationCount && finding.corroborationCount > 1) {
        doc.setTextColor(6, 182, 212);
        doc.text(`${finding.corroborationCount}x`, pageWidth - margin - 25, y);
      }
      doc.setTextColor(0);

      y += titleLines.length * 4.5 + 2;

      // Finding content
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      const contentLines = truncateText(doc, finding.content, contentWidth - 6);
      for (const line of contentLines) {
        checkPageBreak(5);
        doc.text(line, margin + 3, y);
        y += 4;
      }

      // Source citation
      y += 2;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.setFont("helvetica", "italic");
      const sourceText = `Source: ${finding.source}${finding.sourceUrl ? ` — ${finding.sourceUrl}` : ""}`;
      const sourceLines = truncateText(doc, sourceText, contentWidth - 6);
      for (const line of sourceLines) {
        checkPageBreak(4);
        doc.text(line, margin + 3, y);
        y += 3.5;
      }
      doc.setTextColor(0);

      y += 5;
      // Separator line between findings
      doc.setDrawColor(230);
      doc.line(margin + 3, y - 2, pageWidth - margin - 3, y - 2);
      y += 3;
    }
  }

  // --- Summary Footer ---
  checkPageBreak(30);
  y += 12;
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  y += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Report Summary", margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text(`Total findings: ${findings.length}`, margin, y);
  y += 5;
  doc.text(`High confidence: ${findings.filter(f => f.confidence === "high").length}`, margin, y);
  y += 5;
  doc.text(`Medium confidence: ${findings.filter(f => f.confidence === "medium").length}`, margin, y);
  y += 5;
  doc.text(`Low confidence: ${findings.filter(f => f.confidence === "low").length}`, margin, y);
  y += 5;
  doc.text(`Corroborated findings: ${findings.filter(f => (f.corroborationCount || 1) > 1).length}`, margin, y);
  y += 5;
  doc.text(`Categories covered: ${Object.keys(groupedFindings).length}/${Object.keys(CATEGORY_LABELS).length}`, margin, y);
  y += 8;
  doc.setTextColor(150);
  doc.setFontSize(7);
  doc.text(`Report generated by OSINT Deep Dive Reporter on ${new Date().toISOString()}`, margin, y);
  y += 4;
  doc.text("This report contains publicly available information only. All sources are cited.", margin, y);
  doc.setTextColor(0);

  // Add watermark and page footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Diagonal CONFIDENTIAL watermark
    doc.saveGraphicsState();
    // @ts-ignore - setGState is available in jsPDF
    const gState = new (doc as any).GState({ opacity: 0.06 });
    // @ts-ignore
    doc.setGState(gState);
    doc.setFontSize(72);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    // Rotate text diagonally across the page center
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    doc.text("CONFIDENTIAL", centerX, centerY, {
      align: "center",
      angle: 45,
    });
    doc.restoreGraphicsState();

    // Page footer
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(
      `OSINT Deep Dive Report — ${investigation.subjectName} — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.setTextColor(0);
  }

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  
  const filename = `osint-report-${investigation.subjectName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${investigation.id}.pdf`;
  const { url, key } = await storagePut(filename, pdfBuffer, "application/pdf");
  
  return { url, key };
}
