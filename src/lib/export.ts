/**
 * Export helpers for CSV and PDF
 */

export function exportCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export async function exportPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Detect background color from the page (dark/light mode)
  const bgColor =
    getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  // Resolve to a usable color — fallback to white
  const resolvedBg = bgColor
    ? (bgColor.startsWith("#") ? bgColor : `hsl(${bgColor})`)
    : "#ffffff";

  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: resolvedBg,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 5;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  const pdf = new jsPDF("p", "mm", "a4");

  // Multi-page support
  if (imgHeight <= pageHeight - margin * 2) {
    pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeight);
  } else {
    let position = 0;
    const usableHeight = pageHeight - margin * 2;
    let page = 0;

    while (position < imgHeight) {
      if (page > 0) pdf.addPage();

      // Crop section from the full image
      const srcY = (position / imgHeight) * canvas.height;
      const srcH = Math.min((usableHeight / imgHeight) * canvas.height, canvas.height - srcY);
      const destH = (srcH / canvas.height) * imgHeight;

      const sectionCanvas = document.createElement("canvas");
      sectionCanvas.width = canvas.width;
      sectionCanvas.height = srcH;
      const ctx = sectionCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        const sectionData = sectionCanvas.toDataURL("image/png");
        pdf.addImage(sectionData, "PNG", margin, margin, contentWidth, destH);
      }

      position += usableHeight;
      page++;
    }
  }

  pdf.save(filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
