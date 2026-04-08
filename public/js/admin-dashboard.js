const viewFilter = document.getElementById("dashboardViewFilter");
const yearFilter = document.getElementById("dashboardYearFilter");
const yearGroup = document.getElementById("dashboardYearGroup");

const chartList = document.getElementById("dashboardChartList");
const topProductsList = document.getElementById("topProductsList");
const topCategoriesList = document.getElementById("topCategoriesList");
const topBrandsList = document.getElementById("topBrandsList");

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function fillYearOptions() {
  const current = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => current - i);

  yearFilter.innerHTML = years
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
}

function renderBarChart(rows) {
  if (!rows.length) {
    chartList.innerHTML = "<p>No chart data available.</p>";
    return;
  }

  const maxAmount = Math.max(...rows.map((item) => Number(item.orderAmount || 0)), 1);

  chartList.innerHTML = rows.map((row) => {
    const width = Math.max(6, Math.round((Number(row.orderAmount || 0) / maxAmount) * 100));

    return `
      <div class="dashboard-chart-row">
        <span class="dashboard-chart-label">${row.label}</span>
        <div class="dashboard-chart-bar-wrap">
          <div class="dashboard-chart-bar" style="width:${width}%"></div>
        </div>
        <span class="dashboard-chart-value">${formatCurrency(row.orderAmount)}</span>
      </div>
    `;
  }).join("");
}

function renderRankList(container, rows, metricKey) {
  if (!rows.length) {
    container.innerHTML = `<p class="dashboard-empty">No data available.</p>`;
    return;
  }

  container.innerHTML = rows.map((row, index) => `
    <div class="dashboard-rank-row">
      <span class="dashboard-rank-index">${index + 1}</span>
      <span class="dashboard-rank-name">${row.name}</span>
      <span class="dashboard-rank-metric">
        ${metricKey === "revenue" ? formatCurrency(row[metricKey]) : row[metricKey]}
      </span>
    </div>
  `).join("");
}

async function loadDashboardData() {
  const token = getAdminToken();
  const view = viewFilter.value;
  const year = yearFilter.value;

  const params = new URLSearchParams({ view, year });

  const res = await fetch(`/admin/dashboard/data?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    chartList.innerHTML = `<p>Failed to load dashboard data.</p>`;
    topProductsList.innerHTML = "";
    topCategoriesList.innerHTML = "";
    topBrandsList.innerHTML = "";
    return;
  }

  const payload = data.data;

  renderBarChart(payload.chart || []);
  renderRankList(topProductsList, payload.topProducts || [], "unitsSold");
  renderRankList(topCategoriesList, payload.topCategories || [], "unitsSold");
  renderRankList(topBrandsList, payload.topBrands || [], "unitsSold");
}

viewFilter?.addEventListener("change", () => {
  const isYearly = viewFilter.value === "yearly";
  yearGroup.style.display = isYearly ? "none" : "block";
  loadDashboardData();
});

yearFilter?.addEventListener("change", loadDashboardData);

fillYearOptions();
yearGroup.style.display = viewFilter.value === "yearly" ? "none" : "block";
loadDashboardData();
