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
    }
  };

  // --- Title Page ---
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  y = 60;
  doc.text("OSINT Intelligence Report", pageWidth / 2, y, { align: "center" });

  y += 12;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Deep Dive Investigation", pageWidth / 2, y, { align: "center" });

  y += 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(`Subject: ${investigation.subjectName}`, pageWidth / 2, y, { align: "center" });

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    pageWidth / 2, y, { align: "center" }
  );

  y += 6;
  doc.text(`Total Findings: ${findings.length}`, pageWidth / 2, y, { align: "center" });

  // Classification banner
  y += 15;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y - 4, contentWidth, 10, "F");
  doc.setFontSize(8);
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIDENTIAL — FOR AUTHORIZED USE ONLY", pageWidth / 2, y + 2, { align: "center" });
  doc.setTextColor(0);

  // --- Subject Details ---
  y += 20;
  const subjectDetails = investigation.subjectDetails as Record<string, string> | null;
  if (subjectDetails) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Subject Profile", margin, y);
    y += 2;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fields = Object.entries(subjectDetails).filter(([key, val]) => val && key !== "additionalInfo");
    for (const [key, value] of fields) {
      checkPageBreak(8);
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 35, y);
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

    checkPageBreak(20);
    y += 10;

    // Category header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`(${catFindings.length} findings)`, margin + doc.getTextWidth(label) + 3, y);
    doc.setTextColor(0);
    y += 2;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

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
      const titleLines = truncateText(doc, finding.title, contentWidth - 30);
      doc.text(titleLines, margin + 2, y);
      
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
      doc.setTextColor(0);

      y += titleLines.length * 4 + 2;

      // Finding content
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      const contentLines = truncateText(doc, finding.content, contentWidth - 4);
      for (const line of contentLines) {
        checkPageBreak(5);
        doc.text(line, margin + 2, y);
        y += 4;
      }

      // Source citation
      y += 2;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.setFont("helvetica", "italic");
      const sourceText = `Source: ${finding.source}${finding.sourceUrl ? ` — ${finding.sourceUrl}` : ""}`;
      const sourceLines = truncateText(doc, sourceText, contentWidth - 4);
      for (const line of sourceLines) {
        checkPageBreak(4);
        doc.text(line, margin + 2, y);
        y += 3.5;
      }
      doc.setTextColor(0);

      y += 5;
      // Separator line between findings
      doc.setDrawColor(230);
      doc.line(margin + 2, y - 2, pageWidth - margin - 2, y - 2);
      y += 2;
    }
  }

  // --- Footer on last page ---
  checkPageBreak(20);
  y += 10;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text(`Report generated by OSINT Deep Dive Reporter on ${new Date().toISOString()}`, margin, y);
  y += 4;
  doc.text(`Total findings: ${findings.length} | High: ${findings.filter(f => f.confidence === "high").length} | Medium: ${findings.filter(f => f.confidence === "medium").length} | Low: ${findings.filter(f => f.confidence === "low").length}`, margin, y);

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  
  const filename = `osint-report-${investigation.subjectName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${investigation.id}.pdf`;
  const { url, key } = await storagePut(filename, pdfBuffer, "application/pdf");
  
  return { url, key };
}
