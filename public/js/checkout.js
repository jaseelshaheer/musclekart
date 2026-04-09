const checkoutContent = document.getElementById("checkoutContent");
const token = localStorage.getItem("token");
let selectedPaymentMethod = "cod";

if (!token) {
  window.location.href = "/login";
}

// function formatAddress(address) {
//   if (!address) return "";

//   return [
//     address.name,
//     address.phone,
//     address.house,
//     address.landmark || "",
//     address.district,
//     address.state,
//     address.pincode,
//     address.country
//   ]
//     .filter(Boolean)
//     .join(", ");
// }

function renderCheckout(data) {
  if (!checkoutContent) return;

  const {
    items,
    addresses,
    defaultAddress,
    subtotal,
    shipping,
    tax,
    discount,
    itemOfferSavings,
    totalSavings,
    finalTotal,
    appliedCoupon,
    walletBalance,
    canCheckout,
    hasUnavailableItems
  } = data;

  if (appliedCoupon) {
    selectedCoupon = null;
  }

  if (!items.length) {
    window.location.replace("/cart");
    return;
  }

  checkoutContent.innerHTML = `
    <div class="checkout-layout checkout-layout-expanded">
        <div class="checkout-main">
        <section class="checkout-section-title-block">
            <div class="checkout-title-row">
                <h1>Billing Details</h1>
                <a href="/cart" class="checkout-back-cart-btn">Back to Cart</a>
            </div>
        </section>


        <section class="checkout-card checkout-address-section">
            <div class="checkout-card-head">
                <h2>Delivery Address</h2>
            </div>

            ${
              addresses.length
                ? `
                <div class="checkout-address-list">
                    ${addresses
                      .map(
                        (address) => `
                        <label
                            class="checkout-address-card ${
                              defaultAddress && String(defaultAddress._id) === String(address._id)
                                ? "selected"
                                : ""
                            }"
                            data-address-id="${address._id}"
                        >

                            <div class="checkout-address-radio">
                            <span class="checkout-radio-dot ${
                              defaultAddress && String(defaultAddress._id) === String(address._id)
                                ? "active"
                                : ""
                            }"></span>
                            </div>

                            <div class="checkout-address-body">
                            <div class="checkout-address-top">
                                <strong>${address.name}</strong>
                                ${
                                  address.isDefault
                                    ? `<span class="checkout-address-badge">Default</span>`
                                    : ""
                                }
                            </div>

                            <p>${address.house}, ${address.district}, ${address.state}</p>
                            <p>${address.country} - ${address.pincode}</p>
                            <p>Contact: ${address.phone}</p>
                            ${address.landmark ? `<p>Landmark: ${address.landmark}</p>` : ""}
                            </div>
                        </label>
                        `
                      )
                      .join("")}
                </div>

                <div class="checkout-address-actions">
                    <button type="button" class="btn-primary checkout-add-address-btn" id="openAddressModalBtn">
                        Add New Address
                    </button>
                </div>

                `
                : `
                <div class="checkout-empty-block">
                    <p>No address found. Add an address to continue.</p>
                    <button type="button" class="btn-primary checkout-add-address-btn" id="openAddressModalBtn">
                      Add New Address
                    </button>
                </div>
                `
            }
        </section>

        <section class="checkout-card checkout-payment-section">
            <div class="checkout-card-head">
            <h2>Select any payment methods</h2>
            </div>

            <div class="checkout-payment-list">
                <label class="checkout-payment-option disabled">
                    <input type="radio" name="paymentMethod" value="card" disabled>
                    <span>Debit Card / Credit Card</span>
                    <small>Coming soon</small>
                </label>

                <label class="checkout-payment-option disabled">
                    <input type="radio" name="paymentMethod" value="bank" disabled>
                    <span>Bank</span>
                    <small>Coming soon</small>
                </label>

                <label class="checkout-payment-option disabled">
                    <input type="radio" name="paymentMethod" value="upi" disabled>
                    <span>UPI Method</span>
                    <small>Coming soon</small>
                </label>

                <label class="checkout-payment-option active">
                    <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        ${selectedPaymentMethod === "cod" ? "checked" : ""}
                    />
                    <span>Cash on Delivery</span>
                </label>

                <label class="checkout-payment-option ${walletBalance >= finalTotal ? "active" : "disabled"}">
                    <input
                        type="radio"
                        name="paymentMethod"
                        value="wallet"
                        ${selectedPaymentMethod === "wallet" && walletBalance >= finalTotal ? "checked" : ""}
                        ${walletBalance >= finalTotal ? "" : "disabled"}
                    >
                    <span>Wallet</span>
                    <small>
                    Balance: Rs. ${Number(walletBalance || 0).toFixed(2)}
                    ${walletBalance < finalTotal ? " • Insufficient balance" : ""}
                    </small>
                </label>

                <label class="checkout-payment-option active">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    ${selectedPaymentMethod === "razorpay" ? "checked" : ""}
                  />
                  <span>Online Payment</span>
                  <small>Pay securely with Razorpay</small>
                </label>

            </div>

        </section>
        </div>

        <aside class="checkout-sidebar checkout-sidebar-expanded">
        <section class="checkout-summary-card">
            <div class="checkout-summary-items">
            ${items
              .map(
                (item) => `
                    <article class="checkout-summary-item ${
                      item.isAvailable && item.stock_qty > 0 ? "" : "checkout-item-disabled"
                    }">
                    <div class="checkout-summary-item-image">
                        <img
                        src="${item.main_image || "/images/no-image.png"}"
                        alt="${item.product_name}"
                        >
                    </div>

                    <div class="checkout-summary-item-info">
                        <h3>${item.product_name}</h3>
                        <p>
                        ${
                          item.attributes?.length
                            ? item.attributes
                                .map((attr) => `${attr.type}: ${attr.value}`)
                                .join(" / ")
                            : "Standard Variant"
                        }
                        </p>
                        <p>Qty: ${item.quantity}</p>
                    </div>

                    <div class="checkout-summary-item-price">
                      ${
                        item.hasOffer
                          ? `<span class="checkout-summary-item-original">Rs. ${Number((item.originalPrice || 0) * (item.quantity || 0)).toFixed(2)}</span>`
                          : ""
                      }

                      <strong class="checkout-summary-item-final">
                        Rs. ${Number(item.itemTotal || 0).toFixed(2)}
                      </strong>

                      ${
                        item.hasOffer
                          ? `<span class="checkout-summary-item-save">You save Rs. ${Number((item.discountAmount || 0) * (item.quantity || 0)).toFixed(2)}</span>`
                          : ""
                      }
                    </div>

                    </article>
                `
              )
              .join("")}
            </div>

            <div class="checkout-summary-breakdown">
                <div class="checkout-summary-row">
                    <span>Subtotal</span>
                    <strong>Rs. ${subtotal}</strong>
                </div>

                <div class="checkout-summary-row">
                    <span>Shipping</span>
                    <strong>${shipping === 0 ? "Free" : `Rs. ${shipping}`}</strong>
                </div>

                ${
                  discount > 0
                    ? `
                        <div class="checkout-summary-row">
                            <span>Discount</span>
                            <strong>- Rs. ${discount}</strong>
                        </div>
                        `
                    : ""
                }


                <div class="checkout-summary-row">
                    <span>Tax</span>
                    <strong>Rs. ${tax}</strong>
                </div>

                <div class="checkout-summary-row total">
                  <span>Total</span>
                  <strong>Rs. ${Number(finalTotal || 0).toFixed(2)}</strong>
                </div>

                ${
                  Number(totalSavings || 0) > 0
                    ? `
                    <div class="checkout-summary-row checkout-summary-savings-row">
                      <span>Your Total Savings</span>
                      <strong>Rs. ${Number(totalSavings || 0).toFixed(2)}</strong>
                    </div>
                    `
                    : ""
                }
            </div>

            <div class="checkout-coupon-row">
              <button
                  type="button"
                  class="checkout-coupon-secondary ${appliedCoupon ? "is-disabled" : ""}"
                  id="showCouponsBtn"
                  ${appliedCoupon ? "disabled" : ""}
              >
                  ${
                    appliedCoupon
                      ? appliedCoupon.coupon_code
                      : selectedCoupon?.coupon_code || "Show Coupons"
                  }
              </button>

                ${
                  appliedCoupon
                    ? `<button type="button" class="checkout-coupon-primary" id="removeCouponBtn">
                        Remove Coupon
                        </button>`
                    : `<button type="button" class="checkout-coupon-primary" id="applyCouponBtn">
                        Apply Coupon
                        </button>`
                }

                ${
                  appliedCoupon
                    ? `<p class="checkout-selected-coupon-note">
                            Applied coupon: <strong>${appliedCoupon.coupon_code}</strong>
                        </p>`
                    : selectedCoupon
                      ? `<p class="checkout-selected-coupon-note">
                            Selected coupon: <strong>${selectedCoupon.coupon_code}</strong>
                            </p>`
                      : ""
                }

            </div>


            ${
              hasUnavailableItems
                ? `<p class="checkout-warning">Remove unavailable or out-of-stock items before checkout.</p>`
                : ""
            }

            ${
              !defaultAddress
                ? `<p class="checkout-warning">Add a delivery address to continue.</p>`
                : ""
            }

            ${
              selectedPaymentMethod === "wallet" && walletBalance < finalTotal
                ? `<p class="checkout-wallet-warning">
                        Wallet balance is lower than the payable amount.
                    </p>`
                : ""
            }

            <button
            type="button"
            id="placeOrderBtn"
            class="checkout-place-order-btn"
            ${canCheckout ? "" : "disabled"}
            >
            Place Order
            </button>
        </section>
        </aside>
    </div>

    <div class="checkout-address-modal hidden" id="checkoutAddressModal">
        <div class="checkout-address-modal-backdrop" id="checkoutAddressModalBackdrop"></div>

        <div class="checkout-address-modal-card">
            <div class="checkout-address-modal-head">
            <h3>Add New Address</h3>
            <button type="button" id="closeAddressModalBtn" class="checkout-address-close-btn">×</button>
            </div>

            <form id="checkoutAddressForm" class="checkout-address-form">
            <div class="checkout-address-grid">
                <div class="form-group">
                <label for="checkoutAddressName">Name</label>
                <input id="checkoutAddressName" type="text" name="name">
                </div>

                <div class="form-group">
                <label for="checkoutAddressPhone">Phone</label>
                <input id="checkoutAddressPhone" type="tel" name="phone">
                </div>

                <div class="form-group">
                <label for="checkoutAddressHouse">House / Building</label>
                <input id="checkoutAddressHouse" type="text" name="house">
                </div>

                <div class="form-group">
                <label for="checkoutAddressCountry">Country</label>
                <input id="checkoutAddressCountry" type="text" name="country">
                </div>

                <div class="form-group">
                <label for="checkoutAddressDistrict">District / City</label>
                <input id="checkoutAddressDistrict" type="text" name="district">
                </div>

                <div class="form-group">
                <label for="checkoutAddressState">State</label>
                <input id="checkoutAddressState" type="text" name="state">
                </div>

                <div class="form-group">
                <label for="checkoutAddressPincode">Pincode</label>
                <input id="checkoutAddressPincode" type="text" name="pincode">
                </div>

                <div class="form-group">
                <label for="checkoutAddressLandmark">Landmark</label>
                <input id="checkoutAddressLandmark" type="text" name="landmark">
                </div>

                <div class="form-group">
                <label for="checkoutAddressType">Address Type</label>
                <select id="checkoutAddressType" name="addressType">
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                </select>
                </div>

                <div class="form-group checkout-address-checkbox-group">
                <label class="checkbox-label">
                    <input id="checkoutAddressDefault" type="checkbox" name="isDefault">
                    <span>Make this default address</span>
                </label>
                </div>
            </div>

            <div id="checkoutAddressFormError" class="checkout-address-form-error hidden"></div>

            <div class="checkout-address-form-actions">
                <button type="button" class="checkout-coupon-secondary" id="cancelAddressModalBtn">
                Cancel
                </button>
                <button type="submit" class="checkout-coupon-primary">
                Save Address
                </button>
            </div>
            </form>
        </div>
    </div>

    <div class="checkout-address-modal hidden" id="checkoutCouponModal">
        <div class="checkout-address-modal-backdrop" id="checkoutCouponModalBackdrop"></div>

        <div class="checkout-address-modal-card checkout-coupon-modal-card">
            <div class="checkout-address-modal-head">
            <h3>Available Coupons</h3>
            <button type="button" id="closeCouponListModalBtn" class="checkout-address-close-btn">✕</button>
            </div>

            <div id="checkoutCouponList" class="checkout-coupon-list">
            <div class="shop-empty">
                <p>Loading coupons...</p>
            </div>
            </div>
        </div>
    </div>
  `;

  bindCheckoutAddressFieldValidation();
}

function openAddressModal() {
  const modal = document.getElementById("checkoutAddressModal");
  if (!modal) return;
  modal.classList.remove("hidden");
}

function closeAddressModal() {
  const modal = document.getElementById("checkoutAddressModal");
  const form = document.getElementById("checkoutAddressForm");
  const errorBox = document.getElementById("checkoutAddressFormError");

  if (modal) modal.classList.add("hidden");
  if (form) form.reset();

  clearCheckoutFieldErrors();

  if (errorBox) {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }
}

function getCheckoutAddressFields() {
  return {
    name: document.getElementById("checkoutAddressName"),
    phone: document.getElementById("checkoutAddressPhone"),
    house: document.getElementById("checkoutAddressHouse"),
    country: document.getElementById("checkoutAddressCountry"),
    district: document.getElementById("checkoutAddressDistrict"),
    state: document.getElementById("checkoutAddressState"),
    pincode: document.getElementById("checkoutAddressPincode"),
    landmark: document.getElementById("checkoutAddressLandmark"),
    addressType: document.getElementById("checkoutAddressType"),
    isDefault: document.getElementById("checkoutAddressDefault")
  };
}

function showCheckoutFieldError(input, message) {
  removeCheckoutFieldError(input);

  const error = document.createElement("small");
  error.className = "field-error";
  error.textContent = message;

  input.parentElement.appendChild(error);
  input.classList.add("input-error");
}

function removeCheckoutFieldError(input) {
  if (!input) return;

  const existing = input.parentElement.querySelector(".field-error");
  if (existing) existing.remove();

  input.classList.remove("input-error");
}

function clearCheckoutFieldErrors() {
  const fields = getCheckoutAddressFields();

  Object.values(fields).forEach((input) => {
    if (input) removeCheckoutFieldError(input);
  });
}

function getCheckoutAddressPayload() {
  return {
    name: document.getElementById("checkoutAddressName")?.value.trim() || "",
    phone: document.getElementById("checkoutAddressPhone")?.value.trim() || "",
    house: document.getElementById("checkoutAddressHouse")?.value.trim() || "",
    country: document.getElementById("checkoutAddressCountry")?.value.trim() || "",
    district: document.getElementById("checkoutAddressDistrict")?.value.trim() || "",
    state: document.getElementById("checkoutAddressState")?.value.trim() || "",
    pincode: document.getElementById("checkoutAddressPincode")?.value.trim() || "",
    landmark: document.getElementById("checkoutAddressLandmark")?.value.trim() || "",
    addressType: document.getElementById("checkoutAddressType")?.value || "home",
    isDefault: Boolean(document.getElementById("checkoutAddressDefault")?.checked)
  };
}

function validateCheckoutAddressFields() {
  const fields = getCheckoutAddressFields();
  clearCheckoutFieldErrors();

  let valid = true;

  if (!fields.name?.value.trim()) {
    showCheckoutFieldError(fields.name, "Name is required");
    valid = false;
  }

  if (!/^[0-9]{10}$/.test(fields.phone?.value.trim() || "")) {
    showCheckoutFieldError(fields.phone, "Enter valid 10-digit phone number");
    valid = false;
  }

  if (!fields.house?.value.trim()) {
    showCheckoutFieldError(fields.house, "House is required");
    valid = false;
  }

  if (!fields.country?.value.trim()) {
    showCheckoutFieldError(fields.country, "Country is required");
    valid = false;
  }

  if (!fields.district?.value.trim()) {
    showCheckoutFieldError(fields.district, "District is required");
    valid = false;
  }

  if (!fields.state?.value.trim()) {
    showCheckoutFieldError(fields.state, "State is required");
    valid = false;
  }

  if (!/^[0-9]{6}$/.test(fields.pincode?.value.trim() || "")) {
    showCheckoutFieldError(fields.pincode, "Enter valid 6-digit pincode");
    valid = false;
  }

  return valid;
}

async function saveCheckoutAddress() {
  const payload = getCheckoutAddressPayload();
  const errorBox = document.getElementById("checkoutAddressFormError");

  clearCheckoutFieldErrors();

  if (errorBox) {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }

  if (!validateCheckoutAddressFields()) {
    return;
  }

  const res = await fetch("/user/address", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!data.success) {
    if (errorBox) {
      errorBox.textContent = data.message || "Failed to save address";
      errorBox.classList.remove("hidden");
    }
    return;
  }

  closeAddressModal();
  await loadCheckout();
  showToast(data.message || "Address added successfully", "success");
}

function bindCheckoutAddressFieldValidation() {
  const fields = getCheckoutAddressFields();

  Object.values(fields).forEach((input) => {
    if (!input) return;

    const eventName = input.tagName === "SELECT" || input.type === "checkbox" ? "change" : "input";

    input.addEventListener(eventName, () => {
      removeCheckoutFieldError(input);

      const errorBox = document.getElementById("checkoutAddressFormError");
      if (errorBox) {
        errorBox.textContent = "";
        errorBox.classList.add("hidden");
      }
    });
  });
}

let selectedCoupon = null;

function openCouponModal() {
  const modal = document.getElementById("checkoutCouponModal");
  if (modal) modal.classList.remove("hidden");
}

function closeCouponModal() {
  const modal = document.getElementById("checkoutCouponModal");
  if (modal) modal.classList.add("hidden");
}

async function loadAvailableCoupons() {
  const couponList = document.getElementById("checkoutCouponList");
  if (!couponList) return;

  couponList.innerHTML = `
    <div class="shop-empty">
      <p>Loading coupons...</p>
    </div>
  `;

  const res = await fetch("/coupons/data", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    couponList.innerHTML = `
      <div class="shop-empty">
        <h3>Unable to load coupons</h3>
        <p>${data.message || "Something went wrong."}</p>
      </div>
    `;
    return;
  }

  renderAvailableCoupons(data.data);
}

function renderAvailableCoupons(coupons) {
  const couponList = document.getElementById("checkoutCouponList");
  if (!couponList) return;

  if (!coupons.length) {
    couponList.innerHTML = `
      <div class="shop-empty">
        <h3>No coupons available</h3>
        <p>No coupon is applicable for your current cart.</p>
      </div>
    `;
    return;
  }

  couponList.innerHTML = `
    <div class="checkout-coupon-cards">
      ${coupons
        .map(
          (coupon) => `
            <label class="checkout-coupon-card ${selectedCoupon?.coupon_code === coupon.coupon_code ? "selected" : ""}">
              <input
                type="radio"
                name="selectedCoupon"
                class="checkout-coupon-radio"
                value="${coupon.coupon_code}"
                data-coupon-code="${coupon.coupon_code}"
                data-description="${coupon.description}"
                data-min-purchase="${coupon.min_purchase}"
                data-discount-type="${coupon.discount_type}"
                data-discount-value="${coupon.discount_value}"
                ${selectedCoupon?.coupon_code === coupon.coupon_code ? "checked" : ""}
              />

              <div class="checkout-coupon-card-content">
                <div class="checkout-coupon-card-top">
                  <div>
                    <h4>${coupon.coupon_code}</h4>
                    <p>${coupon.description}</p>
                  </div>
                </div>

                <div class="checkout-coupon-card-meta">
                  <span>Min Purchase: Rs. ${coupon.min_purchase}</span>
                  <span>
                    ${
                      coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}% off`
                        : `Rs. ${coupon.discount_value} off`
                    }
                  </span>
                  <span>Valid till: ${new Date(coupon.expiry_date).toLocaleDateString("en-IN")}</span>
                </div>
              </div>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

async function applySelectedCoupon() {
  if (!selectedCoupon?.coupon_code) {
    showAlertModal("Please choose a coupon");
    return;
  }

  const res = await fetch("/checkout/coupon/apply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ code: selectedCoupon.coupon_code })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Failed to apply coupon");
    return;
  }

  closeCouponModal();
  selectedCoupon = null;
  showToast(data.message || "Coupon applied successfully", "success");
  await loadCheckout();
}

async function removeCoupon() {
  const res = await fetch("/checkout/coupon", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Failed to remove coupon");
    return;
  }

  selectedCoupon = null;
  showToast(data.message || "Coupon removed successfully", "success");
  await loadCheckout();
}

async function createRazorpayOrder(addressId) {
  const res = await fetch("/payments/razorpay/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ addressId })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Failed to initiate online payment");
    return null;
  }

  return data.data;
}

async function verifyRazorpayPayment({
  addressId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
}) {
  const res = await fetch("/payments/razorpay/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      addressId,
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

async function startRazorpayPayment(addressId) {
  const paymentData = await createRazorpayOrder(addressId);
  if (!paymentData) return;

  const options = {
    key: paymentData.key,
    amount: paymentData.amount,
    currency: paymentData.currency,
    name: "MuscleKart",
    description: "Order Payment",
    order_id: paymentData.razorpayOrderId,
    handler: async function (response) {
      const verified = await verifyRazorpayPayment({
        addressId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });

      if (!verified) return;

      window.location.href = `/payment/success?orderId=${encodeURIComponent(verified.orderId)}`;
    },
    modal: {
      ondismiss: function () {
        window.location.href = "/payment/failure";
      }
    },
    theme: {
      color: "#1b7f79"
    }
  };

  const razorpayInstance = new Razorpay(options);
  razorpayInstance.open();
}

window.addEventListener("pageshow", async (event) => {
  if (event.persisted) {
    await loadCheckout();
  }
});

async function loadCheckout() {
  const res = await fetch("/checkout/data", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to load checkout");
    return;
  }

  renderCheckout(data.data);
}

if (checkoutContent) {
  checkoutContent.addEventListener("click", async (e) => {
    if (e.target.id === "openAddressModalBtn") {
      openAddressModal();
      return;
    }

    if (
      e.target.id === "closeAddressModalBtn" ||
      e.target.id === "cancelAddressModalBtn" ||
      e.target.id === "checkoutAddressModalBackdrop"
    ) {
      closeAddressModal();
      return;
    }

    if (e.target.id === "showCouponsBtn") {
      openCouponModal();
      await loadAvailableCoupons();
      return;
    }

    if (e.target.id === "applyCouponBtn") {
      await applySelectedCoupon();
      return;
    }

    if (e.target.id === "removeCouponBtn") {
      await removeCoupon();
      return;
    }

    if (
      e.target.id === "closeCouponListModalBtn" ||
      e.target.id === "checkoutCouponModalBackdrop"
    ) {
      closeCouponModal();
      return;
    }

    if (e.target.id === "placeOrderBtn") {
      if (e.target.disabled) return;

      const selectedAddressCard = document.querySelector(".checkout-address-card.selected");

      if (!selectedAddressCard) {
        showAlertModal("Please select a delivery address");
        return;
      }

      const addressId = selectedAddressCard.dataset.addressId;

      const chosenPaymentMethod =
        document.querySelector('input[name="paymentMethod"]:checked')?.value || "cod";

      if (chosenPaymentMethod === "razorpay") {
        await startRazorpayPayment(addressId);
        return;
      }

      const res = await fetch("/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          addressId,
          paymentMethod: chosenPaymentMethod
        })
      });

      const data = await res.json();

      if (!data.success) {
        showAlertModal(data.message || "Failed to place order");
        return;
      }

      window.location.href = `/orders/success/${data.data.orderId}`;
      return;
    }

    const addressCard = e.target.closest(".checkout-address-card");
    if (addressCard) {
      document
        .querySelectorAll(".checkout-address-card")
        .forEach((card) => card.classList.remove("selected"));

      document
        .querySelectorAll(".checkout-radio-dot")
        .forEach((dot) => dot.classList.remove("active"));

      addressCard.classList.add("selected");
      const dot = addressCard.querySelector(".checkout-radio-dot");
      if (dot) dot.classList.add("active");
    }
  });

  checkoutContent.addEventListener("change", async (e) => {
    if (e.target.name === "paymentMethod") {
      selectedPaymentMethod = e.target.value;

      const checkoutRes = await fetch("/checkout/data", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutData.success) {
        showAlertModal(checkoutData.message || "Failed to refresh checkout");
        return;
      }

      renderCheckout(checkoutData.data);
      return;
    }

    if (e.target.classList.contains("checkout-coupon-radio")) {
      selectedCoupon = {
        coupon_code: e.target.dataset.couponCode,
        description: e.target.dataset.description,
        min_purchase: Number(e.target.dataset.minPurchase || 0),
        discount_type: e.target.dataset.discountType,
        discount_value: Number(e.target.dataset.discountValue || 0)
      };

      closeCouponModal();

      const checkoutRes = await fetch("/checkout/data", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutData.success) {
        showAlertModal(checkoutData.message || "Failed to refresh checkout");
        return;
      }

      renderCheckout(checkoutData.data);
    }
  });

  if (checkoutContent) {
    checkoutContent.addEventListener("submit", async (e) => {
      if (e.target.id === "checkoutAddressForm") {
        e.preventDefault();
        await saveCheckoutAddress();
      }
    });
  }
}

loadCheckout();
