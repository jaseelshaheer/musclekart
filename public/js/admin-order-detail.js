if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin/login";
}

const adminOrderDetailContent = document.getElementById("adminOrderDetailContent");
const adminToken = localStorage.getItem("adminToken");

function renderAdminOrderDetail(order) {
  if (!adminOrderDetailContent) return;

  adminOrderDetailContent.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1>Order Details</h1>
        <p class="breadcrumb">Dashboard / Orders / ${order.order_id}</p>
      </div>

      <a href="/admin/orders-page" class="btn-primary">Back to Orders</a>
    </div>

    <div class="admin-card" style="margin-bottom:20px;">
      <div class="order-detail-meta-grid">
        <div class="order-detail-meta-box">
          <span>Order ID</span>
          <strong>${order.order_id}</strong>
        </div>

        <div class="order-detail-meta-box">
          <span>Order Date</span>
          <strong>${new Date(order.order_date).toLocaleString("en-IN")}</strong>
        </div>

        <div class="order-detail-meta-box">
          <span>Customer</span>
          <strong>${order.user_id?.firstName || ""} ${order.user_id?.lastName || ""}</strong>
        </div>

        <div class="order-detail-meta-box">
          <span>Payment Method</span>
          <strong>${String(order.payment_method || "").toUpperCase()}</strong>
        </div>

        <div class="order-detail-meta-box">
          <span>Payment Status</span>
          <strong>${order.payment_status.replaceAll("_", " ")}</strong>
        </div>

      </div>
    </div>

    <div class="admin-card" style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:16px;">
        <h2 style="margin:0;">Update Status</h2>

        <div style="display:flex; gap:12px; align-items:center;">
          <select id="statusSelect" class="form-control">
            <option value="pending" ${order.order_status === "pending" ? "selected" : ""}>Pending</option>
            <option value="confirmed" ${order.order_status === "confirmed" ? "selected" : ""}>Confirmed</option>
            <option value="packed" ${order.order_status === "packed" ? "selected" : ""}>Packed</option>
            <option value="shipped" ${order.order_status === "shipped" ? "selected" : ""}>Shipped</option>
            <option value="out_for_delivery" ${order.order_status === "out_for_delivery" ? "selected" : ""}>Out for Delivery</option>
            <option value="delivered" ${order.order_status === "delivered" ? "selected" : ""}>Delivered</option>
            <option value="cancelled" ${order.order_status === "cancelled" ? "selected" : ""}>Cancelled</option>
            <option value="returned" ${order.order_status === "returned" ? "selected" : ""}>Returned</option>
          </select>

          <button id="updateStatusBtn" class="btn-primary" data-order-id="${order.order_id}">
            Update Status
          </button>
        </div>
      </div>
    </div>

    <div class="admin-card" style="margin-bottom:20px;">
      <h2>Items</h2>

      <table class="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
            <th>Item Status</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item) => `
            <tr>
              <td>${item.product_name}</td>
              <td>${
                item.attributes?.length
                  ? item.attributes.map((attr) => `${attr.type}: ${attr.value}`).join(" / ")
                  : "Standard Variant"
              }</td>
              <td>${item.quantity}</td>
              <td>Rs. ${item.price}</td>
              <td>Rs. ${item.total}</td>
              <td>${item.item_status}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="admin-card">
      <h2>Address & Totals</h2>

      <p><strong>${order.address_snapshot.name}</strong></p>
      <p>${order.address_snapshot.phone}</p>
      <p>${order.address_snapshot.house}</p>
      <p>${order.address_snapshot.district}, ${order.address_snapshot.state}, ${order.address_snapshot.pincode}</p>
      <p>${order.address_snapshot.country}</p>

      <hr style="margin:16px 0;">

      <p><strong>Subtotal:</strong> Rs. ${order.subtotal}</p>
      <p><strong>Delivery Charge:</strong> Rs. ${order.delivery_charge}</p>
      <p><strong>Discount:</strong> Rs. ${order.discount}</p>
      <p><strong>Grand Total:</strong> Rs. ${order.grand_total}</p>
    </div>
  `;
}

async function loadAdminOrderDetail() {
  const orderId = adminOrderDetailContent?.dataset.orderId;
  if (!orderId) return;

  const res = await fetch(`/admin/orders/${orderId}/data`, {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to load order details");
    return;
  }

  renderAdminOrderDetail(data.data);
}

if (adminOrderDetailContent) {
  adminOrderDetailContent.addEventListener("click", async (e) => {
    if (e.target.id === "updateStatusBtn") {
      const orderId = e.target.dataset.orderId;
      const statusSelect = document.getElementById("statusSelect");
      const status = statusSelect?.value;

      const res = await fetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (!data.success) {
        showAlertModal(data.message || "Failed to update order status");
        return;
      }

      showToast(data.message || "Order status updated successfully", "success");
      await loadAdminOrderDetail();
    }
  });
}

loadAdminOrderDetail();

