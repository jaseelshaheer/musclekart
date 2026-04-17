const orderDetailContent = document.getElementById("orderDetailContent");
const token = localStorage.getItem("token");

let pendingReturnAction = null;
let pendingCancelAction = null;

if (!token) {
  window.location.href = "/login";
}

function renderOrderDetail(order) {
  if (!orderDetailContent) return;
  const canRetryPayment =
    order.payment_method === "card" &&
    order.payment_status === "failed" &&
    order.order_status === "pending";

  const itemOfferSavings = (order.items || []).reduce(
    (sum, item) => sum + Number((item.discount_amount || 0) * (item.quantity || 0)),
    0
  );

  const totalSavings = itemOfferSavings + Number(order.discount || 0);

  orderDetailContent.innerHTML = `
    <div class="order-detail-header">
        <div>
            <h1>Order Details</h1>
            <p>Order ID: <strong>${order.order_id}</strong></p>
        </div>

        <div class="order-detail-header-actions">
            <a href="/orders" class="checkout-back-cart-btn">Back to Orders</a>

            <button type="button" class="checkout-back-cart-btn" id="downloadInvoiceBtn">
                Download Invoice
            </button>

            ${
              ["order_placed", "pending", "confirmed", "packed"].includes(order.order_status)
                ? `<button type="button" class="btn-danger-soft" id="cancelOrderBtn">Cancel Order</button>`
                : ""
            }

            ${
              order.order_status === "delivered"
                ? `<button type="button" class="order-item-return-btn" id="returnOrderBtn">Return Order</button>`
                : ""
            }
        </div>


    </div>


    <div class="order-detail-layout">
      <div class="order-detail-main">
        <section class="checkout-card">
          <div class="checkout-card-head">
            <h2>Order Summary</h2>
          </div>

          <div class="order-detail-meta-grid">
            <div class="order-detail-meta-box">
              <span>Order Date</span>
              <strong>${new Date(order.order_date).toLocaleString("en-IN")}</strong>
            </div>

            <div class="order-detail-meta-box">
              <span>Payment Method</span>
              <strong>${String(order.payment_method || "").toUpperCase()}</strong>
            </div>

            <div class="order-detail-meta-box">
              <span>Payment Status</span>
              <div class="order-payment-status-row">
                <strong>${order.payment_status}</strong>
                ${
                  canRetryPayment
                    ? `<button type="button" class="order-retry-payment-btn" id="retryPaymentBtn">Retry Payment</button>`
                    : ""
                }
              </div>
            </div>

            <div class="order-detail-meta-box">
              <span>Order Status</span>
              <strong>
                ${order.order_status
                  .replaceAll("_", " ")
                  .replace(/\b\w/g, (char) => char.toUpperCase())}
              </strong>
            </div>

            ${
              order.order_status === "return_rejected" && order.return_reject_reason
                ? `<p class="order-return-reject-note">
                        Return request rejected: ${order.return_reject_reason}
                    </p>`
                : ""
            }

          </div>
        </section>

        <section class="checkout-card">
          <div class="checkout-card-head">
            <h2>Items</h2>
          </div>

          <div class="checkout-item-list">
            ${order.items
              .map(
                (item, index) => `
              <article class="checkout-item">
                <div class="checkout-item-image">
                  <img src="${item.main_image || "/images/no-image.png"}" alt="${item.product_name}">
                </div>

                <div class="checkout-item-info">
                  <h3>${item.product_name}</h3>
                  <p class="checkout-item-meta">
                    ${
                      item.attributes?.length
                        ? item.attributes.map((attr) => `${attr.type}: ${attr.value}`).join(" / ")
                        : "Standard Variant"
                    }
                  </p>
                  <p>Quantity: ${item.quantity}</p>

                  ${
                    Number(item.discount_amount || 0) > 0
                      ? `<p class="order-item-original-price">
                          Rs. ${Number(item.original_price || item.price || 0).toFixed(2)} each
                        </p>`
                      : ""
                  }

                  <p class="order-item-final-price">
                    Price: Rs. ${Number(item.price || 0).toFixed(2)} each
                  </p>
                </div>

                <div class="checkout-item-total">
                    <strong>Rs. ${Number(item.total || 0).toFixed(2)}</strong>

                    ${
                      Number(item.discount_amount || 0) > 0
                        ? `<p class="order-item-savings">
                            You saved Rs. ${Number((item.discount_amount || 0) * (item.quantity || 0)).toFixed(2)}
                          </p>`
                        : ""
                    }
                    <span class="${item.item_status === "active" ? "checkout-status-good" : "checkout-status-bad"}">
                        ${item.item_status
                          .replaceAll("_", " ")
                          .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </span>

                    ${
                      item.item_status === "return_rejected" && item.return_reject_reason
                        ? `<p class="order-item-reject-note">
                                Rejected: ${item.return_reject_reason}
                            </p>`
                        : ""
                    }

                    ${
                      item.item_status === "active" &&
                      ["order_placed", "pending", "confirmed", "packed"].includes(
                        order.order_status
                      )
                        ? `<button
                                type="button"
                                class="order-item-cancel-btn"
                                data-item-index="${index}"
                            >
                                Cancel Item
                            </button>`
                        : ""
                    }

                    ${
                      item.item_status === "active" && order.order_status === "delivered"
                        ? `<button
                                type="button"
                                class="order-item-return-btn"
                                data-item-index="${index}"
                            >
                                Return Item
                            </button>`
                        : ""
                    }

                </div>

              </article>
            `
              )
              .join("")}
          </div>
        </section>
      </div>

      <aside class="checkout-sidebar">
        <section class="checkout-summary-card">
          <h2>Delivery Address</h2>
          <p><strong>${order.address_snapshot.name}</strong></p>
          <p>${order.address_snapshot.phone}</p>
          <p>${order.address_snapshot.house}</p>
          <p>${order.address_snapshot.district}, ${order.address_snapshot.state}, ${order.address_snapshot.pincode}</p>
          <p>${order.address_snapshot.country}</p>
          ${order.address_snapshot.landmark ? `<p>Landmark: ${order.address_snapshot.landmark}</p>` : ""}

          <hr>

          <div class="checkout-summary-row">
            <span>Subtotal</span>
            <strong>Rs. ${order.subtotal}</strong>
          </div>

          <div class="checkout-summary-row">
            <span>Delivery Charge</span>
            <strong>Rs. ${order.delivery_charge}</strong>
          </div>

          ${
            Number(order.discount || 0) > 0
              ? `
              <div class="checkout-summary-row">
                <span>Coupon Discount</span>
                <strong>- Rs. ${Number(order.discount || 0).toFixed(2)}</strong>
              </div>
              `
              : ""
          }

          <div class="checkout-summary-row total">
            <span>Grand Total</span>
            <strong>Rs. ${Number(order.grand_total || 0).toFixed(2)}</strong>
          </div>

          ${
            totalSavings > 0
              ? `
              <div class="checkout-summary-row order-total-savings-row">
                <span>Your Total Savings</span>
                <strong>Rs. ${Number(totalSavings || 0).toFixed(2)}</strong>
              </div>
              `
              : ""
          }
        </section>
      </aside>
    </div>
  `;
}

async function createRetryRazorpayOrder(orderId) {
  const res = await fetch("/payments/razorpay/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ orderId })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Failed to initiate retry payment");
    return null;
  }

  return data.data;
}

async function verifyRetryRazorpayPayment({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const res = await fetch("/payments/razorpay/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Payment verification failed");
    return null;
  }

  return data.data;
}

async function markRetryPaymentFailed(orderId) {
  await fetch("/payments/razorpay/failure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ orderId })
  });
}

async function startRetryPayment(orderId) {
  const paymentData = await createRetryRazorpayOrder(orderId);
  if (!paymentData) return;

  let failureHandled = false;
  const handleRetryFailure = async () => {
    if (failureHandled) return;
    failureHandled = true;
    await markRetryPaymentFailed(orderId);
    showAlertModal("Payment failed. You can retry again.");
    await loadOrderDetail();
  };

  const options = {
    key: paymentData.key,
    amount: paymentData.amount,
    currency: paymentData.currency,
    name: "MuscleKart",
    description: "Retry Order Payment",
    order_id: paymentData.razorpayOrderId,
    handler: async function (response) {
      const verified = await verifyRetryRazorpayPayment({
        orderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });

      if (!verified) return;

      showToast("Payment completed successfully", "success");
      await loadOrderDetail();
    },
    modal: {
      ondismiss: async function () {
        await handleRetryFailure();
      }
    },
    theme: {
      color: "#1b7f79"
    }
  };

  const razorpayInstance = new Razorpay(options);
  razorpayInstance.on("payment.failed", async () => {
    await handleRetryFailure();
  });
  razorpayInstance.open();
}

async function loadOrderDetail() {
  const orderId = orderDetailContent?.dataset.orderId;
  if (!orderId) return;

  const res = await fetch(`/orders/${orderId}/data`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to load order details");
    return;
  }

  renderOrderDetail(data.data);
}

async function cancelWholeOrder(orderId, reason = "") {
  const res = await fetch(`/orders/${orderId}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      reason
    })
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to cancel order");
    return;
  }

  showToast(data.message || "Order cancelled successfully", "success");
  await loadOrderDetail();
}

async function returnWholeOrder(orderId, reason) {
  const res = await fetch(`/orders/${orderId}/return`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to return order");
    return;
  }

  showToast(data.message || "Return request submitted successfully", "success");
  await loadOrderDetail();
}

async function returnSingleItem(orderId, itemIndex, reason) {
  const res = await fetch(`/orders/${orderId}/items/${itemIndex}/return`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to return item");
    return;
  }

  showToast(data.message || "Return request submitted successfully", "success");
  await loadOrderDetail();
}

function openReturnReasonModal() {
  const modal = document.getElementById("returnReasonModal");
  const input = document.getElementById("returnReasonInput");
  const error = document.getElementById("returnReasonError");

  if (!modal || !input || !error) return;

  input.value = "";
  error.textContent = "";
  modal.classList.remove("hidden");
  input.focus();
}

function closeReturnReasonModal() {
  const modal = document.getElementById("returnReasonModal");
  const input = document.getElementById("returnReasonInput");
  const error = document.getElementById("returnReasonError");

  if (modal) modal.classList.add("hidden");
  if (input) input.value = "";
  if (error) error.textContent = "";
}

function getReturnReasonValue() {
  const input = document.getElementById("returnReasonInput");
  const error = document.getElementById("returnReasonError");

  const reason = input?.value?.trim() || "";

  if (!reason) {
    if (error) error.textContent = "Return reason is required";
    return null;
  }

  if (error) error.textContent = "";
  return reason;
}

function openCancelReasonModal() {
  const modal = document.getElementById("cancelReasonModal");
  const input = document.getElementById("cancelReasonInput");
  const error = document.getElementById("cancelReasonError");

  if (!modal || !input || !error) return;

  input.value = "";
  error.textContent = "";
  modal.classList.remove("hidden");
  input.focus();
}

function closeCancelReasonModal() {
  const modal = document.getElementById("cancelReasonModal");
  const input = document.getElementById("cancelReasonInput");
  const error = document.getElementById("cancelReasonError");

  if (modal) modal.classList.add("hidden");
  if (input) input.value = "";
  if (error) error.textContent = "";
}

function getCancelReasonValue() {
  const input = document.getElementById("cancelReasonInput");
  return input?.value?.trim() || "";
}

if (orderDetailContent) {
  orderDetailContent.addEventListener("click", async (e) => {
    const orderId = orderDetailContent.dataset.orderId;
    if (!orderId) return;

    if (e.target.id === "cancelOrderBtn") {
      pendingCancelAction = {
        type: "order",
        orderId
      };
      openCancelReasonModal();
      return;
    }

    if (e.target.classList.contains("order-item-cancel-btn")) {
      pendingCancelAction = {
        type: "item",
        orderId,
        itemIndex: e.target.dataset.itemIndex
      };
      openCancelReasonModal();
      return;
    }

    if (e.target.id === "returnOrderBtn") {
      pendingReturnAction = {
        type: "order",
        orderId
      };
      openReturnReasonModal();
      return;
    }

    if (e.target.classList.contains("order-item-return-btn")) {
      pendingReturnAction = {
        type: "item",
        orderId,
        itemIndex: e.target.dataset.itemIndex
      };
      openReturnReasonModal();
      return;
    }

    if (e.target.id === "downloadInvoiceBtn") {
      const response = await fetch(`/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let message = "Failed to download invoice";

        try {
          const errorData = await response.json();
          if (errorData?.message) {
            message = errorData.message;
          }
        } catch {
          // keep fallback message
        }

        showAlertModal(message);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return;
    }

    if (e.target.id === "retryPaymentBtn") {
      await startRetryPayment(orderId);
      return;
    }
  });
}

async function cancelSingleItem(orderId, itemIndex, reason = "") {
  const res = await fetch(`/orders/${orderId}/items/${itemIndex}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      reason
    })
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to cancel item");
    return;
  }

  showToast(data.message || "Order item cancelled successfully", "success");
  await loadOrderDetail();
}

const returnReasonCancelBtn = document.getElementById("returnReasonCancelBtn");
const returnReasonSubmitBtn = document.getElementById("returnReasonSubmitBtn");

if (returnReasonCancelBtn) {
  returnReasonCancelBtn.addEventListener("click", () => {
    pendingReturnAction = null;
    closeReturnReasonModal();
  });
}

if (returnReasonSubmitBtn) {
  returnReasonSubmitBtn.addEventListener("click", async () => {
    const reason = getReturnReasonValue();
    if (!reason || !pendingReturnAction) return;

    if (pendingReturnAction.type === "order") {
      await returnWholeOrder(pendingReturnAction.orderId, reason);
    }

    if (pendingReturnAction.type === "item") {
      await returnSingleItem(pendingReturnAction.orderId, pendingReturnAction.itemIndex, reason);
    }

    pendingReturnAction = null;
    closeReturnReasonModal();
  });
}

const cancelReasonCancelBtn = document.getElementById("cancelReasonCancelBtn");
const cancelReasonSubmitBtn = document.getElementById("cancelReasonSubmitBtn");

if (cancelReasonCancelBtn) {
  cancelReasonCancelBtn.addEventListener("click", () => {
    pendingCancelAction = null;
    closeCancelReasonModal();
  });
}

if (cancelReasonSubmitBtn) {
  cancelReasonSubmitBtn.addEventListener("click", async () => {
    const reason = getCancelReasonValue();

    if (!pendingCancelAction) return;

    if (pendingCancelAction.type === "order") {
      await cancelWholeOrder(pendingCancelAction.orderId, reason);
    }

    if (pendingCancelAction.type === "item") {
      await cancelSingleItem(pendingCancelAction.orderId, pendingCancelAction.itemIndex, reason);
    }

    pendingCancelAction = null;
    closeCancelReasonModal();
  });
}

loadOrderDetail();
