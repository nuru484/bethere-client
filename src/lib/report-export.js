// src/lib/report-export.js
//
// Export helpers for the attendance report: an .xlsx download from the server,
// a client-side PDF (jspdf + html2canvas-pro, lazy-loaded so they never touch
// the main bundle), and a browser print that a print stylesheet scopes to the
// report region.
import { api } from "@/api";
import { buildSearchParams } from "@/api/users";

const today = () => new Date().toISOString().slice(0, 10);

/** Downloads the filtered report as .xlsx. Pagination params are stripped. */
export async function downloadReportXlsx(filters = {}) {
  const clean = { ...filters };
  delete clean.page;
  delete clean.limit;
  const query = buildSearchParams(clean);

  // responseType:'blob' -> the interceptor hands back the Blob as response.data.
  const blob = await api.get(
    `/attendance-reports/export${query ? `?${query}` : ""}`,
    { responseType: "blob" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `attendance-report-${today()}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Captures a DOM region into a paginated A4 PDF. */
export async function exportReportPdf(element, filename = `attendance-report-${today()}.pdf`) {
  if (!element) return;
  const [jspdfMod, html2canvasMod] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);
  const { jsPDF } = jspdfMod;
  const html2canvas = html2canvasMod.default;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
    // Buttons/pagination are marked report-no-print; keep them out of the PDF.
    ignoreElements: (node) => node.classList?.contains("report-no-print"),
  });
  const image = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(image, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(image, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  pdf.save(filename);
}

/** Opens the print dialog with the report region isolated by the print CSS. */
export function printReport() {
  document.body.classList.add("report-printing");
  const cleanup = () => {
    document.body.classList.remove("report-printing");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}
