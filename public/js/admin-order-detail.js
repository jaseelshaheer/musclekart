if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin/login";
}

const adminOrderDetailContent = document.getElementById("adminOrderDetailContent");
const adminToken = localStorage.getItem("adminToken");


function getAdminStatusOptions(currentStatus) {
  const statusMap = {
    order_placed: ["pending", "confirmed", "cancelled"],
    pending: ["confirmed", "cancelled"],
    confirmed: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["out_for_delivery"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    return_requested: [],
    return_rejected: [],
    cancelled: [],
    returned: []
  };

  return statusMap[currentStatus] || [];
}


function formatStatusLabel(status) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}


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

        <div class="order-detail-meta-box">
            <span>Order Status</span>
            <strong>${formatStatusLabel(order.order_status)}</strong>
        </div>

      </div>
    </div>

    ${
        order.order_status === "return_requested"
            ? `
            <div class="admin-card" style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">
                <div>
                    <h2 style="margin:0 0 8px;">Return Request</h2>
                    <p style="margin:0; color:#b45309; font-weight:700;">Pending Admin Approval</p>
                    <p style="margin:8px 0 0; color:#475569;">
                    ${
                        order.items
                        .filter((item) => item.item_status === "return_requested")
                        .map((item) => item.return_reason)
                        .filter(Boolean)
                        .join(" | ") || "No reason provided"
                    }
                    </p>
                </div>

                <div style="display:flex; gap:12px; align-items:center;">
                    <button id="approveReturnBtn" class="btn-primary" data-order-id="${order.order_id}">
                    Approve
                    </button>
                    <button id="rejectReturnBtn" class="btn-delete" data-order-id="${order.order_id}">
                    Reject
                    </button>
                </div>
                </div>
            </div>
            `
            : ""
    }

    ${
      getAdminStatusOptions(order.order_status).length
        ? `
          <div class="admin-card" style="margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:16px;">
              <h2 style="margin:0;">Update Status</h2>

              <div style="display:flex; gap:12px; align-items:center;">
                <select id="statusSelect" class="form-control">
                  <option value="">Select Next Status</option>
                  ${getAdminStatusOptions(order.order_status)
                    .map(
                      (status) => `
                        <option value="${status}">
                          ${formatStatusLabel(status)}
                        </option>
                      `
                    )
                    .join("")}
                </select>

                <button id="updateStatusBtn" class="btn-primary" data-order-id="${order.order_id}">
                  Update Status
                </button>
              </div>
            </div>
          </div>
        `
        : ""
    }


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
            <th>Return Reason</th>
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
              <td>${formatStatusLabel(item.item_status)}</td>
              <td>${item.return_reason || "-"}</td>
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

    <div id="rejectReturnModal" class="modal hidden">
        <div class="modal-backdrop" id="rejectReturnModalBackdrop"></div>

        <div class="modal-card" style="max-width:520px;">
            <div class="modal-header">
            <h3>Reject Return Request</h3>
            <button type="button" id="closeRejectReturnModalBtn" class="checkout-address-close-btn">×</button>
            </div>

            <div class="modal-body">
            <div class="form-group">
                <label for="rejectReturnReason">Reason</label>
                <textarea id="rejectReturnReason" class="form-control" rows="4" placeholder="Enter rejection reason"></textarea>
                <small id="rejectReturnReasonError" class="field-error hidden"></small>
            </div>
            </div>

            <div class="modal-footer">
            <button type="button" id="cancelRejectReturnBtn" class="btn-shop-outline">Cancel</button>
            <button type="button" id="confirmRejectReturnBtn" class="btn-delete" data-order-id="${order.order_id}">
                Submit Rejection
            </button>
            </div>
        </div>
    </div>
  `;
}

function openRejectReturnModal() {
  document.getElementById("rejectReturnModal")?.classList.remove("hidden");
}

function closeRejectReturnModal() {
  document.getElementById("rejectReturnModal")?.classList.add("hidden");

  const reasonInput = document.getElementById("rejectReturnReason");
  const reasonError = document.getElementById("rejectReturnReasonError");

  if (reasonInput) reasonInput.value = "";
  if (reasonError) {
    reasonError.textContent = "";
    reasonError.classList.add("hidden");
  }
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

    if (e.target.id === "approveReturnBtn") {
      const orderId = e.target.dataset.orderId;

      const res = await fetch(`/admin/orders/${orderId}/approve-return`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        showAlertModal(data.message || "Failed to approve return request");
        return;
      }

      showToast(
        data.message || "Return request approved successfully",
        "success",
      );
      await loadAdminOrderDetail();
      return;
    }

    if (e.target.id === "rejectReturnBtn") {
      openRejectReturnModal();
      return;
    }

    if (
      e.target.id === "closeRejectReturnModalBtn" ||
      e.target.id === "cancelRejectReturnBtn" ||
      e.target.id === "rejectReturnModalBackdrop"
    ) {
      closeRejectReturnModal();
      return;
    }

    if (e.target.id === "confirmRejectReturnBtn") {
      const orderId = e.target.dataset.orderId;
      const reasonInput = document.getElementById("rejectReturnReason");
      const reasonError = document.getElementById("rejectReturnReasonError");
      const reason = reasonInput?.value.trim() || "";

      if (!reason) {
        if (reasonError) {
          reasonError.textContent = "Rejection reason is required";
          reasonError.classList.remove("hidden");
        }
        return;
      }

      const res = await fetch(`/admin/orders/${orderId}/reject-return`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (!data.success) {
        showAlertModal(data.message || "Failed to reject return request");
        return;
      }

      closeRejectReturnModal();
      showToast(
        data.message || "Return request rejected successfully",
        "success",
      );
      await loadAdminOrderDetail();
      return;
    }


    if (e.target.id === "updateStatusBtn") {
      const orderId = e.target.dataset.orderId;
      const statusSelect = document.getElementById("statusSelect");
      const status = statusSelect?.value;

      if (!status) {
        showAlertModal("Please select the next status");
        return;
      }

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

