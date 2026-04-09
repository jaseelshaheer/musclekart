import PDFDocument from "pdfkit";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "-";
}

function sanitizeStatus(value) {
  return String(value || "").replaceAll("_", " ");
}

function computeColumnWidths(doc, headers, rows, maxTableWidth) {
  const minWidths = [170, 62, 86, 88, 88, 72, 70, 70, 88, 88];
  const maxWidths = [220, 90, 110, 120, 120, 100, 95, 95, 110, 110];

  const raw = headers.map((header, index) => {
    let width = doc.widthOfString(header, { font: "Helvetica-Bold", size: 8.5 }) + 14;

    rows.forEach((row) => {
      const cell = String(row[index] ?? "");
      const cellWidth = doc.widthOfString(cell, { font: "Helvetica", size: 8.5 }) + 12;
      if (cellWidth > width) width = cellWidth;
    });

    return Math.min(Math.max(width, minWidths[index]), maxWidths[index]);
  });

  const total = raw.reduce((sum, w) => sum + w, 0);
  if (total <= maxTableWidth) return raw;

  // If too wide, shrink non-orderId columns first.
  const adjusted = [...raw];
  let overflow = total - maxTableWidth;
  for (let i = adjusted.length - 1; i >= 1 && overflow > 0; i -= 1) {
    const canShrink = adjusted[i] - minWidths[i];
    const take = Math.min(canShrink, overflow);
    adjusted[i] -= take;
    overflow -= take;
  }
  return adjusted;
}

export function generateSalesReportPdf(reportData, res) {
  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

  const fileName = `sales-report-${Date.now()}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  doc.pipe(res);

  const pageWidth = doc.page.width;
  const leftMargin = doc.page.margins.left;
  const rightMargin = doc.page.margins.right;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  doc.font("Helvetica-Bold").fontSize(19).fillColor("#0f766e").text("MUSCLEKART", leftMargin, 24, {
    width: contentWidth,
    align: "center"
  });
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#0f172a").text("Sales Report", {
    width: contentWidth,
    align: "center"
  });

  doc.moveDown(0.2);
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#475569")
    .text(
      `Period: ${String(reportData.filter.period || "").toUpperCase()} | From: ${formatDate(
        reportData.filter.from
      )} | To: ${formatDate(reportData.filter.to)}`,
      { width: contentWidth, align: "center" }
    );

  doc.moveDown(0.7);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Summary");
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(9.5).fillColor("#334155");
  doc.text(`Sales Count: ${reportData.summary.salesCount}`);
  doc.text(`Order Amount: ${formatCurrency(reportData.summary.orderAmount)}`);
  doc.text(`Coupon Discount: ${formatCurrency(reportData.summary.couponDiscountAmount)}`);
  doc.text(`Offer Discount: ${formatCurrency(reportData.summary.offerDiscountAmount)}`);
  doc.text(`Total Discount: ${formatCurrency(reportData.summary.totalDiscountAmount)}`);

  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Orders");

  const headers = [
    "Order ID",
    "Date",
    "Status",
    "Payment Method",
    "Payment Status",
    "Subtotal",
    "Coupon",
    "Offer",
    "Total Discount",
    "Grand Total"
  ];

  const rows = reportData.rows
    .slice(0, 30)
    .map((row) => [
      row.orderId,
      formatDate(row.orderDate),
      sanitizeStatus(row.orderStatus),
      String(row.paymentMethod || "").toUpperCase(),
      String(row.paymentStatus || "").toUpperCase(),
      formatCurrency(row.subtotal),
      formatCurrency(row.couponDiscount),
      formatCurrency(row.offerDiscount),
      formatCurrency(row.totalDiscount),
      formatCurrency(row.grandTotal)
    ]);

  const tableX = leftMargin;
  let y = doc.y + 8;
  const tableWidth = contentWidth;
  const colWidths = computeColumnWidths(doc, headers, rows, tableWidth);
  const rowHeight = 20;

  const drawHeaderRow = (startY) => {
    doc.save();
    doc.roundedRect(tableX, startY, tableWidth, rowHeight, 4).fill("#0f766e");
    doc.restore();

    let x = tableX + 3;
    doc.font("Helvetica-Bold").fontSize(8.3).fillColor("#ffffff");
    headers.forEach((h, i) => {
      doc.text(h, x, startY + 6, {
        width: colWidths[i] - 6,
        align: "center",
        lineBreak: false,
        ellipsis: true
      });
      x += colWidths[i];
    });

    return startY + rowHeight + 4;
  };

  y = drawHeaderRow(y);
  doc.font("Helvetica").fontSize(8.5).fillColor("#1e293b");

  rows.forEach((row, rowIndex) => {
    const nextRowBottom = y + rowHeight;
    const pageBottom = doc.page.height - doc.page.margins.bottom - 12;
    if (nextRowBottom > pageBottom) {
      doc.addPage({ margin: 30, size: "A4", layout: "landscape" });
      y = drawHeaderRow(doc.page.margins.top);
    }

    if (rowIndex % 2 === 1) {
      doc.save();
      doc.rect(tableX, y, tableWidth, rowHeight).fill("#f8fcfb");
      doc.restore();
    }

    let colX = tableX + 3;
    row.forEach((cell, i) => {
      const alignRight = i >= 5;
      doc.text(String(cell), colX, y + 6, {
        width: colWidths[i] - 6,
        align: alignRight ? "right" : "left",
        lineBreak: false,
        ellipsis: true
      });
      colX += colWidths[i];
    });

    y += rowHeight;
  });

  // Totals row
  const totals = [
    "TOTAL",
    "",
    "",
    "",
    "",
    formatCurrency(reportData.summary.orderAmount),
    formatCurrency(reportData.summary.couponDiscountAmount),
    formatCurrency(reportData.summary.offerDiscountAmount),
    formatCurrency(reportData.summary.totalDiscountAmount),
    formatCurrency(reportData.summary.orderAmount)
  ];

  const pageBottom = doc.page.height - doc.page.margins.bottom - 12;
  if (y + rowHeight > pageBottom) {
    doc.addPage({ margin: 30, size: "A4", layout: "landscape" });
    y = drawHeaderRow(doc.page.margins.top);
  }

  doc.save();
  doc.rect(tableX, y, tableWidth, rowHeight).fill("#e7f4f2");
  doc.restore();

  let totalX = tableX + 3;
  totals.forEach((cell, i) => {
    const alignRight = i >= 5;
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#0f172a")
      .text(String(cell), totalX, y + 6, {
        width: colWidths[i] - 6,
        align: alignRight ? "right" : "left",
        lineBreak: false,
        ellipsis: true
      });
    totalX += colWidths[i];
  });

  y += rowHeight;

  doc
    .moveTo(tableX, y + 1)
    .lineTo(tableX + tableWidth, y + 1)
    .strokeColor("#d9e6e3")
    .stroke();

  doc.end();
}
