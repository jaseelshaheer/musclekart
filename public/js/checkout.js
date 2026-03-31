const checkoutContent = document.getElementById("checkoutContent");
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login";
}

function formatAddress(address) {
  if (!address) return "";

  return [
    address.name,
    address.phone,
    address.house,
    address.landmark || "",
    address.district,
    address.state,
    address.pincode,
    address.country
  ]
    .filter(Boolean)
    .join(", ");
}

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
    finalTotal,
    canCheckout,
    hasUnavailableItems
  } = data;

  if (!items.length) {
    checkoutContent.innerHTML = `
      <div class="shop-empty">
        <h3>Your cart is empty</h3>
        <p>Add products before proceeding to checkout.</p>
        <a href="/shop" class="btn-primary">Continue Shopping</a>
      </div>
    `;
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
                              defaultAddress &&
                              String(defaultAddress._id) === String(address._id)
                                ? "selected"
                                : ""
                            }"
                            data-address-id="${address._id}"
                        >

                            <div class="checkout-address-radio">
                            <span class="checkout-radio-dot ${
                              defaultAddress &&
                              String(defaultAddress._id) === String(address._id)
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
                        `,
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
                    <a href="/user/addresses" class="btn-primary">Add Address</a>
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
                <input type="radio" disabled>
                <span>Debit Card / Credit Card</span>
                <small>Coming soon</small>
            </label>

            <label class="checkout-payment-option disabled">
                <input type="radio" disabled>
                <span>Bank</span>
                <small>Coming soon</small>
            </label>

            <label class="checkout-payment-option disabled">
                <input type="radio" disabled>
                <span>UPI Method</span>
                <small>Coming soon</small>
            </label>

            <label class="checkout-payment-option active">
                <input type="radio" checked disabled>
                <span>Cash on Delivery</span>
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
                      item.isAvailable && item.stock_qty > 0
                        ? ""
                        : "checkout-item-disabled"
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
                        Rs. ${item.itemTotal}
                    </div>
                    </article>
                `,
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

            <div class="checkout-summary-row">
                <span>Tax</span>
                <strong>Rs. ${tax}</strong>
            </div>

            <div class="checkout-summary-row total">
                <span>Total</span>
                <strong>Rs. ${finalTotal}</strong>
            </div>
            </div>

            <div class="checkout-coupon-row">
            <button type="button" class="checkout-coupon-secondary" id="showCouponsBtn">
                Show Coupons
            </button>

            <button type="button" class="checkout-coupon-primary" id="applyCouponBtn">
                Apply Coupon
            </button>
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

    const eventName =
      input.tagName === "SELECT" || input.type === "checkbox"
        ? "change"
        : "input";

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
      showAlertModal("Coupon list will be added after order placement flow.");
      return;
    }

    if (e.target.id === "applyCouponBtn") {
      showAlertModal("Coupon apply flow will be implemented later.");
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

      const res = await fetch("/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          addressId,
          paymentMethod: "cod"
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
