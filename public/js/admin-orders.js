if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin/login";
}

let page = 1;
let totalPages = 1;
const limit = 10;

const table = document.getElementById("ordersTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const pageInfo = document.getElementById("pageInfo");

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

async function loadOrders() {
  const token = getAdminToken();

  if (!token) {
    window.location.href = "/admin/login";
    return;
  }

  const search = searchInput.value;
  const status = statusFilter.value;

  const res = await fetch(
    `/admin/orders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to load orders");
    return;
  }

  table.innerHTML = "";

  data.data.orders.forEach((order) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td><strong>${order.order_id}</strong></td>
        <td>${new Date(order.order_date).toLocaleDateString("en-IN")}</td>
        <td>${order.user_id?.firstName || ""} ${order.user_id?.lastName || ""}</td>
        <td>${order.items.length}</td>
        <td>Rs. ${order.grand_total}</td>
        <td>${String(order.payment_method || "").toUpperCase()}</td>
        <td>
            <span class="payment-status-pill ${order.payment_status}">
            ${order.payment_status.replaceAll("_", " ")}
            </span>
        </td>
        <td>
            <span class="order-status-pill ${order.order_status}">
                ${order.order_status
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
            </span>
        </td>
        <td>
            <button class="btn-unblock" onclick="viewOrderDetail('${order.order_id}')">
            View
            </button>
        </td>
    `;


    table.appendChild(tr);
  });

  pageInfo.textContent = `Page ${data.data.currentPage} of ${data.data.totalPages}`;
  totalPages = data.data.totalPages;
}

window.viewOrderDetail = function (orderId) {
  window.location.href = `/admin/orders/${orderId}`;
};

document.getElementById("prevBtn").onclick = () => {
  if (page > 1) {
    page--;
    loadOrders();
  }
};

document.getElementById("nextBtn").onclick = () => {
  if (page < totalPages) {
    page++;
    loadOrders();
  }
};

searchInput.addEventListener("input", () => {
  page = 1;
  loadOrders();
});

statusFilter.addEventListener("change", () => {
  page = 1;
  loadOrders();
});

document.getElementById("clearSearch").onclick = () => {
  searchInput.value = "";
  statusFilter.value = "";
  page = 1;
  loadOrders();
};

loadOrders();
