const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login";
}

function renderCart(data) {
  if (!cartContent) return;

  const { items, subtotal, totalItems, hasUnavailableItems } = data;

  if (!items.length) {
    cartContent.innerHTML = `
    <div class="cart-empty-state">
      <div class="cart-empty-inner">
        <h3>Your cart is empty</h3>
        <p>Add products from the shop to continue.</p>
        <a href="/shop" class="btn-primary">Continue Shopping</a>
      </div>
    </div>
  `;
    return;
  }

  cartContent.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items" id="cartItems">
        ${items
          .map(
            (item) => `
              <article
                class="cart-card ${item.isAvailable && item.stock_qty > 0 ? "" : "cart-card-disabled"}"
                data-variant-id="${item.variant_id}"
              >
                <div class="cart-card-image">
                  <img
                    src="${item.main_image || "/images/no-image.png"}"
                    alt="${item.product_name}"
                  >
                </div>

                <div class="cart-card-main">
                  <div class="cart-card-content">
                    <p class="cart-card-label">Cart Item</p>
                    <h3>${item.product_name}</h3>

                    <p class="cart-variant-text">
                      ${
                        item.attributes?.length
                          ? item.attributes.map((attr) => `${attr.type}: ${attr.value}`).join(" / ")
                          : "Standard Variant"
                      }
                    </p>

                    <div class="cart-meta-row">
                      <div class="cart-price-block">
                        ${
                          item.hasOffer
                            ? `<span class="cart-price-original">Rs. ${Number(item.originalPrice || 0).toFixed(2)}</span>`
                            : ""
                        }
                        <p class="cart-price">Rs. ${Number(item.unitPrice || 0).toFixed(2)}</p>
                        ${
                          item.hasOffer
                            ? `<span class="cart-price-save">You save Rs. ${Number(item.discountAmount || 0).toFixed(2)} per unit</span>`
                            : ""
                        }
                      </div>

                      <p class="cart-status ${item.isAvailable && item.stock_qty > 0 ? "in-stock" : "out-stock"}">
                        ${
                          !item.isAvailable
                            ? "Unavailable"
                            : item.stock_qty <= 0
                              ? "Out of stock"
                              : "In stock"
                        }
                      </p>
                    </div>

                  </div>

                  <div class="cart-card-actions">
                    <div class="cart-qty-block">
                      <span class="cart-qty-label">Quantity</span>

                      <div class="cart-qty-box">
                        <button
                          type="button"
                          class="cart-qty-btn"
                          data-action="decrement"
                          ${item.quantity <= 1 ? "disabled" : ""}
                        >
                          -
                        </button>

                        <span class="cart-qty-value">${item.quantity}</span>

                        <button
                          type="button"
                          class="cart-qty-btn"
                          data-action="increment"
                          ${!item.isAvailable || item.stock_qty <= item.quantity ? "disabled" : ""}
                        >
                          +
                        </button>
                      </div>

                      ${
                        item.isAvailable && item.stock_qty > 0 && item.quantity >= item.stock_qty
                          ? `<p class="cart-qty-note">Only ${item.stock_qty} unit${item.stock_qty > 1 ? "s" : ""} available</p>`
                          : ""
                      }
                    </div>


                    <div class="cart-card-footer">
                      <div class="cart-total-block">
                        <p class="cart-item-total">
                          Item Total: <strong>Rs. ${Number(item.itemTotal || 0).toFixed(2)}</strong>
                        </p>

                        ${
                          item.hasOffer
                            ? `<p class="cart-line-save">Total savings: Rs. ${Number(item.lineDiscountAmount || 0).toFixed(2)}</p>`
                            : ""
                        }
                      </div>

                      <button type="button" class="cart-remove-btn">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            `
          )
          .join("")}
      </div>

      <div class="cart-summary-wrap">
        <div class="cart-summary-top-actions">
          <a href="/shop" class="btn-shop-outline">Continue Shopping</a>

          <button type="button" id="clearCartBtn" class="btn-danger-soft">
            Empty Cart
          </button>
        </div>

        <aside class="cart-summary">
          <div class="cart-summary-header">
            <p class="cart-summary-label">Order Summary</p>
            <h2>Cart Total</h2>
          </div>

          <div class="cart-summary-row">
            <span>Total Items</span>
            <strong>${totalItems}</strong>
          </div>

          <div class="cart-summary-row">
            <span>Subtotal</span>
            <strong>Rs. ${subtotal}</strong>
          </div>

          <p class="cart-summary-note">
            Shipping, discounts, and taxes will be calculated at checkout.
          </p>

          ${
            hasUnavailableItems
              ? `<p class="cart-checkout-warning">Remove unavailable or out-of-stock items to continue.</p>`
              : ""
          }

          <button
            type="button"
            id="checkoutBtn"
            class="btn-primary"
            ${hasUnavailableItems ? "disabled" : ""}
          >
            Proceed to Checkout
          </button>

        </aside>
      </div>

    </div>
  `;
}

async function loadCart() {
  const res = await fetch("/cart/data", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to load cart");
    return;
  }

  renderCart(data.data);
}

const cartContent = document.getElementById("cartContent");

async function refreshCartPage() {
  await loadCart();
}

async function updateCartItemQuantity(variantId, action) {
  const res = await fetch(`/cart/${variantId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action })
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to update cart item");
    return;
  }

  await refreshCartPage();
}

async function removeCartItem(variantId) {
  const res = await fetch(`/cart/${variantId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to remove cart item");
    return;
  }

  showToast(data.message || "Item removed from cart", "success");
  await refreshCartPage();
}

async function clearCart() {
  const res = await fetch("/cart", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to clear cart");
    return;
  }

  showToast(data.message || "Cart cleared successfully", "success");
  await refreshCartPage();
}

if (cartContent) {
  cartContent.addEventListener("click", async (e) => {
    if (e.target.id === "clearCartBtn") {
      showConfirm("Empty your cart?", async () => {
        await clearCart();
      });
      return;
    }

    if (e.target.id === "checkoutBtn") {
      if (e.target.disabled) return;
      window.location.href = "/checkout";
      return;
    }

    const card = e.target.closest("[data-variant-id]");
    if (!card) return;

    const variantId = card.dataset.variantId;

    if (e.target.classList.contains("cart-remove-btn")) {
      await removeCartItem(variantId);
      return;
    }

    if (e.target.classList.contains("cart-qty-btn")) {
      const btn = e.target;

      if (btn.dataset.loading === "true") return;

      const action = btn.dataset.action;

      try {
        btn.dataset.loading = "true";
        btn.disabled = true;
        await updateCartItemQuantity(variantId, action);
      } finally {
        btn.dataset.loading = "false";
      }

      return;
    }
  });
}

loadCart();
