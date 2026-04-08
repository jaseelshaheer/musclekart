const periodInput = document.getElementById("reportPeriod");
const fromInput = document.getElementById("reportFrom");
const toInput = document.getElementById("reportTo");

const applyBtn = document.getElementById("reportApplyBtn");
const downloadExcelBtn  = document.getElementById("reportDownloadExcelBtn");
const downloadPdfBtn = document.getElementById("reportDownloadPdfBtn");

const tableBody = document.getElementById("reportTableBody");

const kpiSalesCount = document.getElementById("kpiSalesCount");
const kpiOrderAmount = document.getElementById("kpiOrderAmount");
const kpiCouponDiscount = document.getElementById("kpiCouponDiscount");
const kpiOfferDiscount = document.getElementById("kpiOfferDiscount");
const kpiTotalDiscount = document.getElementById("kpiTotalDiscount");

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "-";
}

function validateCustomRangeOrShowError() {
  const period = periodInput?.value || "monthly";

  if (period !== "custom") return true;

  const from = fromInput?.value || "";
  const to = toInput?.value || "";

  if (!from || !to) {
    showAlertModal("Please select both From and To dates for custom report.");
    return false;
  }

  if (new Date(from) > new Date(to)) {
    showAlertModal("From date cannot be after To date.");
    return false;
  }

  return true;
}


function getQueryString() {
  const params = new URLSearchParams();

  const period = periodInput?.value || "monthly";
  params.set("period", period);

  if (period === "custom") {
    if (fromInput?.value) params.set("from", fromInput.value);
    if (toInput?.value) params.set("to", toInput.value);
  }

  return params.toString();
}

function toggleCustomInputs() {
  const isCustom = periodInput?.value === "custom";
  if (fromInput) fromInput.disabled = !isCustom;
  if (toInput) toInput.disabled = !isCustom;
}

function renderSummary(summary) {
  kpiSalesCount.textContent = String(summary.salesCount || 0);
  kpiOrderAmount.textContent = formatCurrency(summary.orderAmount);
  kpiCouponDiscount.textContent = formatCurrency(summary.couponDiscountAmount);
  kpiOfferDiscount.textContent = formatCurrency(summary.offerDiscountAmount);
  kpiTotalDiscount.textContent = formatCurrency(summary.totalDiscountAmount);
}

function renderRows(rows) {
  if (!rows.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9">No report data found for selected filter.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.orderId}</td>
      <td>${formatDate(row.orderDate)}</td>
      <td>${String(row.orderStatus || "").replaceAll("_", " ")}</td>
      <td>${String(row.paymentMethod || "").toUpperCase()}</td>
      <td>${formatCurrency(row.subtotal)}</td>
      <td>${formatCurrency(row.couponDiscount)}</td>
      <td>${formatCurrency(row.offerDiscount)}</td>
      <td>${formatCurrency(row.totalDiscount)}</td>
      <td>${formatCurrency(row.grandTotal)}</td>
    </tr>
  `).join("");
}

async function loadReports() {
  if (!validateCustomRangeOrShowError()) return;
  const token = getAdminToken();
  const query = getQueryString();

  tableBody.innerHTML = `
    <tr>
      <td colspan="9">Loading report...</td>
    </tr>
  `;

  const res = await fetch(`/admin/reports/data?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9">${data.message || "Failed to load report"}</td>
      </tr>
    `;
    return;
  }

  renderSummary(data.data.summary);
  renderRows(data.data.rows);
}

function openDownload(url) {
  // if (!validateCustomRangeOrShowError()) return;
  const token = getAdminToken();
  const query = getQueryString();
  window.open(`${url}?${query}&token=${encodeURIComponent(token)}`, "_blank");
}

if (periodInput) {
  periodInput.addEventListener("change", () => {
    toggleCustomInputs();
    loadReports();
  });
}

applyBtn?.addEventListener("click", loadReports);

downloadExcelBtn?.addEventListener("click", () => {
  openDownload("/admin/reports/download/excel");
});

downloadPdfBtn?.addEventListener("click", () => {
  openDownload("/admin/reports/download/pdf");
});

toggleCustomInputs();
loadReports();
