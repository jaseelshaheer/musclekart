import ExcelJS from "exceljs";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "-";
}

export async function generateSalesReportExcel(reportData, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sales Report");

  // Same column order, only width tuned for full header visibility
  sheet.columns = [
    { key: "orderId", width: 24 },
    { key: "orderDate", width: 13 },
    { key: "orderStatus", width: 17 },
    { key: "paymentMethod", width: 17 },
    { key: "paymentStatus", width: 17 },
    { key: "subtotal", width: 14 },
    { key: "couponDiscount", width: 16 },
    { key: "offerDiscount", width: 14 },
    { key: "totalDiscount", width: 15 },
    { key: "grandTotal", width: 14 }
  ];

  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    horizontalCentered: true,
    margins: { left: 0.3, right: 0.3, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 }
  };
  sheet.properties.defaultRowHeight = 18;

  // Report header
  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = "MUSCLEKART - SALES REPORT";
  sheet.getCell("A1").font = { name: "Calibri", size: 15, bold: true, color: { argb: "FF0F766E" } };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 24;

  sheet.mergeCells("A2:J2");
  sheet.getCell("A2").value =
    `Period: ${String(reportData.filter?.period || "").toUpperCase()} | From: ${formatDate(
      reportData.filter?.from
    )} | To: ${formatDate(reportData.filter?.to)}`;
  sheet.getCell("A2").font = { name: "Calibri", size: 10, color: { argb: "FF475569" } };
  sheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 20;

  // Summary section title
  sheet.mergeCells("A4:E4");
  sheet.getCell("A4").value = "SUMMARY";
  sheet.getCell("A4").font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF0F172A" } };
  sheet.getCell("A4").alignment = { horizontal: "left", vertical: "middle" };

  // Summary table
  const summaryHeaderRow = 5;
  const summaryValueRow = 6;

  const summaryHeaders = [
    "Sales Count",
    "Order Amount",
    "Coupon Discount",
    "Offer Discount",
    "Total Discount"
  ];
  const summaryValues = [
    Number(reportData.summary?.salesCount || 0),
    Number(reportData.summary?.orderAmount || 0),
    Number(reportData.summary?.couponDiscountAmount || 0),
    Number(reportData.summary?.offerDiscountAmount || 0),
    Number(reportData.summary?.totalDiscountAmount || 0)
  ];

  for (let i = 0; i < summaryHeaders.length; i += 1) {
    const col = i + 1;
    const headerCell = sheet.getCell(summaryHeaderRow, col);
    const valueCell = sheet.getCell(summaryValueRow, col);

    headerCell.value = summaryHeaders[i];
    headerCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    headerCell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };

    valueCell.value = summaryValues[i];
    valueCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF0F172A" } };
    valueCell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };

    if (col >= 2) valueCell.numFmt = '"Rs." #,##0.00';

    const border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      left: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "thin", color: { argb: "FF94A3B8" } },
      right: { style: "thin", color: { argb: "FF94A3B8" } }
    };
    headerCell.border = border;
    valueCell.border = border;
  }

  sheet.getRow(summaryHeaderRow).height = 22;
  sheet.getRow(summaryValueRow).height = 21;

  // Orders section title
  sheet.mergeCells("A8:J8");
  sheet.getCell("A8").value = "ORDERS";
  sheet.getCell("A8").font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF0F172A" } };
  sheet.getCell("A8").alignment = { horizontal: "left", vertical: "middle" };

  // Orders table (same fields)
  const ordersHeaderRowNumber = 9;
  const ordersHeader = [
    "Order ID",
    "Order Date",
    "Order Status",
    "Payment Method",
    "Payment Status",
    "Subtotal",
    "Coupon Discount",
    "Offer Discount",
    "Total Discount",
    "Grand Total"
  ];

  for (let i = 0; i < ordersHeader.length; i += 1) {
    const cell = sheet.getCell(ordersHeaderRowNumber, i + 1);
    cell.value = ordersHeader[i];
    cell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      left: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "thin", color: { argb: "FF94A3B8" } },
      right: { style: "thin", color: { argb: "FF94A3B8" } }
    };
  }
  sheet.getRow(ordersHeaderRowNumber).height = 22;

  let currentRow = 10;
  (reportData.rows || []).forEach((row, idx) => {
    const values = [
      row.orderId || "-",
      formatDate(row.orderDate),
      String(row.orderStatus || "").replaceAll("_", " "),
      String(row.paymentMethod || "").toUpperCase(),
      String(row.paymentStatus || "").toUpperCase(),
      Number(row.subtotal || 0),
      Number(row.couponDiscount || 0),
      Number(row.offerDiscount || 0),
      Number(row.totalDiscount || 0),
      Number(row.grandTotal || 0)
    ];

    for (let i = 0; i < values.length; i += 1) {
      const cell = sheet.getCell(currentRow, i + 1);
      cell.value = values[i];
      cell.font = { name: "Calibri", size: 10 };
      cell.alignment = {
        horizontal: i >= 5 ? "right" : "left",
        vertical: "middle",
        wrapText: false
      };

      if (i >= 5) cell.numFmt = '"Rs." #,##0.00';

      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FCFB" } };
      }

      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } }
      };
    }

    sheet.getRow(currentRow).height = 20;
    currentRow += 1;
  });

  // Totals row (standard report footer)
  const totalsRowNumber = currentRow;
  const totalsRow = sheet.getRow(totalsRowNumber);

  totalsRow.getCell(1).value = "TOTAL";
  totalsRow.getCell(1).font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FF0F172A" }
  };
  totalsRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

  // Merge label area A:E
  sheet.mergeCells(`A${totalsRowNumber}:E${totalsRowNumber}`);

  // Use summary totals to avoid recalculation mismatch
  totalsRow.getCell(6).value = Number(reportData.summary?.orderAmount || 0);
  totalsRow.getCell(7).value = Number(reportData.summary?.couponDiscountAmount || 0);
  totalsRow.getCell(8).value = Number(reportData.summary?.offerDiscountAmount || 0);
  totalsRow.getCell(9).value = Number(reportData.summary?.totalDiscountAmount || 0);
  totalsRow.getCell(10).value = Number(reportData.summary?.orderAmount || 0);

  for (let col = 6; col <= 10; col += 1) {
    const cell = totalsRow.getCell(col);
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF0F172A" } };
    cell.alignment = { horizontal: "right", vertical: "middle" };
    cell.numFmt = '"Rs." #,##0.00';
  }

  // Highlight totals row
  for (let col = 1; col <= 10; col += 1) {
    const cell = totalsRow.getCell(col);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7F4F2" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF64748B" } },
      left: { style: "thin", color: { argb: "FF64748B" } },
      bottom: { style: "thin", color: { argb: "FF64748B" } },
      right: { style: "thin", color: { argb: "FF64748B" } }
    };
  }

  totalsRow.height = 22;

  const fileName = `sales-report-${Date.now()}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  await workbook.xlsx.write(res);
  res.end();
}
