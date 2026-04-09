const ordersContent = document.getElementById("ordersContent");
const orderSearchInput = document.getElementById("orderSearchInput");
const token = localStorage.getItem("token");
const clearOrderSearchBtn = document.getElementById("clearSearch");
const ordersPagination = document.getElementById("ordersPagination");

if (!token) {
  window.location.href = "/login";
}

let currentPage = 1;
let totalPages = 1;

function renderOrders(data) {
  if (!ordersContent) return;

  const { orders, currentPage, totalPages } = data;

  if (!orders.length) {
    ordersContent.innerHTML = `
        <div class="shop-empty">
        <h3>No orders found</h3>
        <p>You have not placed any orders yet.</p>
        <a href="/shop" class="btn-primary">Start Shopping</a>
        </div>
    `;

    if (ordersPagination) {
      ordersPagination.innerHTML = "";
    }

    return;
  }

  ordersContent.innerHTML = `
    <div class="order-list-grid">
        ${orders
          .map(
            (order) => `
            <article class="order-list-card">
                <div class="order-list-card-top">
                    <div>
                    <h3>${order.order_id}</h3>
                    <p>Placed on ${new Date(order.order_date).toLocaleDateString("en-IN")}</p>
                    </div>

                    <div class="order-list-card-side">
                    <span class="order-status-pill ${order.order_status}">
                        ${order.order_status
                          .replaceAll("_", " ")
                          .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </span>

                    <a href="/orders/${order.order_id}" class="order-list-view-link">View Details</a>
                    </div>
                </div>

                <div class="order-list-card-body compact">
                    <p><strong>Items:</strong> ${order.items.length}</p>
                    <p><strong>Payment:</strong> ${order.payment_method.toUpperCase()}</p>
                    <p><strong>Total:</strong> Rs. ${order.grand_total}</p>
                </div>
            </article>

            `
          )
          .join("")}
    </div>
  `;

  if (ordersPagination) {
    ordersPagination.innerHTML = `
        <button
        type="button"
        id="prevOrdersPageBtn"
        ${currentPage <= 1 ? "disabled" : ""}
        >
        Previous
        </button>

        <span>Page ${currentPage} of ${totalPages}</span>

        <button
        type="button"
        id="nextOrdersPageBtn"
        ${currentPage >= totalPages ? "disabled" : ""}
        >
        Next
        </button>
    `;
  }
}

async function loadOrders(page = 1, search = "") {
  const params = new URLSearchParams({
    page,
    limit: 3
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const res = await fetch(`/orders/data?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to load orders");
    return;
  }

  currentPage = data.data.currentPage;
  totalPages = data.data.totalPages;
  renderOrders(data.data);
}

let searchDebounce;
if (orderSearchInput) {
  orderSearchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      loadOrders(1, orderSearchInput.value);
    }, 300);
  });
}

if (clearOrderSearchBtn && orderSearchInput) {
  clearOrderSearchBtn.addEventListener("click", () => {
    orderSearchInput.value = "";
    loadOrders(1, "");
    orderSearchInput.focus();
  });
}

if (ordersPagination) {
  ordersPagination.addEventListener("click", (e) => {
    if (e.target.id === "prevOrdersPageBtn" && currentPage > 1) {
      loadOrders(currentPage - 1, orderSearchInput?.value || "");
    }

    if (e.target.id === "nextOrdersPageBtn" && currentPage < totalPages) {
      loadOrders(currentPage + 1, orderSearchInput?.value || "");
    }
  });
}

loadOrders();
