import PDFDocument from "pdfkit";


function drawLine(doc, y) {
  doc
    .strokeColor("#d9e6e3")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(545, y)
    .stroke();
}

function drawTableRow(doc, y, columns, options = {}) {
  const {
    fontSize = 10.5,
    header = false,
    color = "#0f172a",
    background = null
  } = options;

  if (background) {
    doc
      .save()
      .fillColor(background)
      .roundedRect(50, y - 6, 495, 28, 6)
      .fill()
      .restore();
  }

  doc
    .fontSize(fontSize)
    .fillColor(color)
    .font(header ? "Helvetica-Bold" : "Helvetica");

  columns.forEach((column) => {
    doc.text(column.text, column.x, y, {
      width: column.width,
      align: column.align || "left"
    });
  });
}

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}


function getTableRowHeight(doc, itemText, variantText) {
  const itemHeight = doc.heightOfString(itemText, { width: 150 });
  const variantHeight = doc.heightOfString(variantText, { width: 120 });
  return Math.max(itemHeight, variantHeight, 16) + 12;
}



export function generateInvoicePdf(order, res) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  const fileName = `invoice-${order.order_id}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  doc.pipe(res);

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor("#0f766e")
    .text("MUSCLEKART", 50, 50);

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#0f172a")
    .text("INVOICE", 420, 52, { align: "right", width: 125 });

  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#475569")
    .text("Health and supplement store", 50, 80);

  drawLine(doc, 105);


  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text("Invoice Details", 50, 122);

  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#334155")
    .text(`Order ID: ${order.order_id}`, 50, 145)
    .text(
      `Order Date: ${new Date(order.order_date).toLocaleString("en-IN")}`,
      50,
      162,
    )
    .text(
      `Payment Method: ${String(order.payment_method || "").toUpperCase()}`,
      50,
      179,
    )
    .text(
      `Payment Status: ${String(order.payment_status || "").toUpperCase()}`,
      50,
      196,
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text("Billing / Delivery Address", 300, 122);

  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#334155")
    .text(order.address_snapshot.name, 300, 145)
    .text(order.address_snapshot.phone, 300, 162)
    .text(order.address_snapshot.house, 300, 179)
    .text(
      `${order.address_snapshot.district}, ${order.address_snapshot.state} - ${order.address_snapshot.pincode}`,
      300,
      196,
      { width: 220 },
    )
    .text(order.address_snapshot.country, 300, 230);

  if (order.address_snapshot.landmark) {
    doc.text(`Landmark: ${order.address_snapshot.landmark}`, 300, 247, {
      width: 220,
    });
  }


  doc.moveDown(1.2);

  let tableY = 300;

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text("Items", 50, tableY - 24);

  drawTableRow(
    doc,
    tableY,
    [
      { text: "Item", x: 58, width: 190 },
      { text: "Variant", x: 220, width: 130 },
      { text: "Qty", x: 355, width: 40, align: "center" },
      { text: "Price", x: 402, width: 60, align: "right" },
      { text: "Total", x: 472, width: 60, align: "right" },
    ],
    {
      header: true,
      color: "#ffffff",
      background: "#0f766e",
    },
  );

  tableY += 34;

  order.items.forEach((item) => {
    const itemText = item.product_name;
    const variantText = item.attributes?.length
      ? item.attributes.map((attr) => `${attr.type}: ${attr.value}`).join(" / ")
      : "Standard Variant";

    const rowHeight = getTableRowHeight(doc, itemText, variantText);

    drawTableRow(
      doc,
      tableY,
      [
        { text: itemText, x: 58, width: 150 },
        { text: variantText, x: 220, width: 120 },
        { text: String(item.quantity), x: 355, width: 40, align: "center" },
        { text: formatCurrency(item.price), x: 402, width: 60, align: "right" },
        { text: formatCurrency(item.total), x: 472, width: 60, align: "right" },
      ],
      {
        fontSize: 10,
        color: "#1e293b",
      },
    );

    drawLine(doc, tableY + rowHeight - 6);
    tableY += rowHeight;
  });



  doc.moveDown(0.6);

  let summaryY = tableY + 20;

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text("Order Summary", 340, summaryY);

  summaryY += 24;

  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#334155")
    .text("Subtotal", 360, summaryY)
    .text(formatCurrency(order.subtotal), 455, summaryY, {
      width: 80,
      align: "right",
    });

  summaryY += 18;

  doc
    .text("Delivery Charge", 360, summaryY)
    .text(formatCurrency(order.delivery_charge), 455, summaryY, {
      width: 80,
      align: "right",
    });

  summaryY += 18;

  doc
    .text("Discount", 360, summaryY)
    .text(formatCurrency(order.discount), 455, summaryY, {
      width: 80,
      align: "right",
    });

  summaryY += 22;
  drawLine(doc, summaryY);
  summaryY += 8;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#0f172a")
    .text("Grand Total", 360, summaryY)
    .text(formatCurrency(order.grand_total), 455, summaryY, {
      width: 80,
      align: "right",
    });


  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#64748b")
    .text("Thank you for shopping with MuscleKart.", 50, 760, {
      align: "center",
      width: 495,
    });


  doc.end();
}
