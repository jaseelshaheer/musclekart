const wishlistContent = document.getElementById("wishlistContent");
const clearWishlistBtn = document.getElementById("clearWishlistBtn");
const token = localStorage.getItem("token");

const wishlistVariantModal = document.getElementById("wishlistVariantModal");
const wishlistVariantOptions = document.getElementById("wishlistVariantOptions");
const wishlistVariantModalTitle = document.getElementById("wishlistVariantModalTitle");
const wishlistVariantAddToCartBtn = document.getElementById("wishlistVariantAddToCartBtn");

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function renderWishlistPriceBlock(item) {
  const hasOffer = Boolean(item.has_offer);

  const isRange = Number(item.min_final_price || 0) !== Number(item.max_final_price || 0);

  const finalPriceText = isRange
    ? `${formatCurrency(item.min_final_price)} - ${formatCurrency(item.max_final_price)}`
    : formatCurrency(item.min_final_price);

  const originalPriceText =
    Number(item.min_original_price || 0) !== Number(item.max_original_price || 0)
      ? `${formatCurrency(item.min_original_price)} - ${formatCurrency(item.max_original_price)}`
      : formatCurrency(item.min_original_price);

  return `
    <div class="shop-price-block">
      <span class="shop-offer-badge ${hasOffer ? "" : "is-placeholder"}">
        ${hasOffer ? "Offer Applied" : "&nbsp;"}
      </span>

      <div class="shop-price-stack">
        ${hasOffer ? `<span class="shop-price-original">${originalPriceText}</span>` : ""}
        <strong class="shop-price-final">${finalPriceText}</strong>
      </div>
    </div>
  `;
}

let selectedWishlistVariantId = null;
let selectedWishlistProductId = null;

if (!token) {
  window.location.href = "/login";
}

function renderWishlist(data) {
  if (!wishlistContent) return;

  const { items, totalItems } = data;

  if (clearWishlistBtn) {
    clearWishlistBtn.style.display = totalItems > 0 ? "inline-flex" : "none";
  }

  const heading = document.querySelector(".wishlist-page-heading h2");
  if (heading) {
    heading.textContent = `My Wishlist (${totalItems})`;
  }

  if (!items.length) {
    wishlistContent.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-inner">
          <h3>Your wishlist is empty</h3>
          <p>Save products here and come back to them later.</p>
          <a href="/shop" class="btn-primary">Continue Shopping</a>
        </div>
      </div>
    `;
    return;
  }

  wishlistContent.innerHTML = `
    <div class="wishlist-grid">
      ${items
        .map((item) => {
          return `
            <article class="wishlist-card" data-product-id="${item.product_id}">
              <a href="/shop/${item.product_id}" class="wishlist-card-link">
                <div class="wishlist-card-image">
                  <img src="${item.main_image || "/images/no-image.png"}" alt="${item.product_name}">
                </div>

                <div class="wishlist-card-body">
                  <h3>${item.product_name}</h3>
                  <p class="wishlist-card-meta">
                    ${item.category_name || "Category"}${item.brand_name ? ` • ${item.brand_name}` : ""}
                  </p>
                  ${renderWishlistPriceBlock(item)}
                  <p class="wishlist-card-stock ${item.total_stock > 0 ? "in-stock" : "out-stock"}">
                    ${item.total_stock > 0 ? "In stock" : "Out of stock"}
                  </p>
                </div>
              </a>

              <div class="wishlist-card-footer">
                ${
                  item.total_stock > 0 && item.variant_count === 1
                    ? `<button
                            type="button"
                            class="wishlist-add-cart-btn"
                            data-product-id="${item.product_id}"
                            data-variant-id="${item.single_variant_id}"
                        >
                            Add to Cart
                        </button>`
                    : item.total_stock > 0 && item.variant_count > 1
                      ? `<button
                            type="button"
                            class="wishlist-add-cart-btn secondary wishlist-choose-variant-btn"
                            data-product-id="${item.product_id}"
                            data-product-name="${item.product_name}"
                            data-variants='${JSON.stringify(item.variant_options)}'
                            >
                            View All Variants
                            </button>`
                      : `<a href="/shop/${item.product_id}" class="wishlist-add-cart-btn secondary">
                            View Details
                            </a>`
                }


                <button
                  type="button"
                  class="wishlist-remove-btn"
                  data-product-id="${item.product_id}"
                >
                  Remove
                </button>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function openWishlistVariantModal(productId, productName, variants) {
  if (!wishlistVariantModal || !wishlistVariantOptions || !wishlistVariantModalTitle) return;

  selectedWishlistProductId = productId;
  selectedWishlistVariantId = null;
  wishlistVariantModalTitle.textContent = `Choose Variant - ${productName}`;

  wishlistVariantOptions.innerHTML = variants
    .map((variant) => {
      const attrs = variant.attributes?.length
        ? variant.attributes.map((attr) => `${attr.type}: ${attr.value}`).join(" / ")
        : "Standard Variant";

      return `
        <button
          type="button"
          class="shop-variant-option-card ${variant.stock_qty > 0 ? "" : "disabled"}"
          data-variant-id="${variant._id}"
          ${variant.stock_qty > 0 ? "" : "disabled"}
        >
          <img src="${variant.main_image || "/images/no-image.png"}" alt="${attrs}">
          <div class="shop-variant-option-content">
            <strong>${attrs}</strong>
            <div class="shop-variant-price-stack">
              ${
                variant.has_offer
                  ? `<span class="shop-price-original">${formatCurrency(variant.original_price)}</span>`
                  : ""
              }
              <span class="shop-price-final">${formatCurrency(variant.final_price || variant.price)}</span>
            </div>
            <small class="${variant.stock_qty > 0 ? "in-stock" : "out-stock"}">
              ${variant.stock_qty > 0 ? `${variant.stock_qty} in stock` : "Out of stock"}
            </small>
          </div>
        </button>
      `;
    })
    .join("");

  const firstAvailable = variants.find((variant) => variant.stock_qty > 0);
  if (firstAvailable) {
    selectedWishlistVariantId = firstAvailable._id;
  }

  wishlistVariantModal.classList.remove("hidden");
  highlightWishlistSelectedVariant();
}

function closeWishlistVariantModal() {
  if (wishlistVariantModal) {
    wishlistVariantModal.classList.add("hidden");
  }

  selectedWishlistVariantId = null;
  selectedWishlistProductId = null;
}

function highlightWishlistSelectedVariant() {
  document.querySelectorAll("#wishlistVariantOptions .shop-variant-option-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.variantId === String(selectedWishlistVariantId));
  });
}

async function loadWishlist() {
  const res = await fetch("/wishlist/data", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to load wishlist");
    return;
  }

  renderWishlist(data.data);
}

async function removeWishlistItem(productId) {
  const res = await fetch(`/wishlist/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to remove wishlist item");
    return;
  }

  showToast(data.message || "Removed from wishlist", "success");
  await loadWishlist();
}

async function clearWishlist() {
  const res = await fetch("/wishlist", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to clear wishlist");
    return;
  }

  showToast(data.message || "Wishlist cleared", "success");
  await loadWishlist();
}

async function addWishlistItemToCart(productId, variantId) {
  const res = await fetch("/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      variantId,
      quantity: 1
    })
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to add item to cart");
    return;
  }

  showToast(data.message || "Added to cart", "success");
  await loadWishlist();
}

if (wishlistContent) {
  wishlistContent.addEventListener("click", async (e) => {
    const removeBtn = e.target.closest(".wishlist-remove-btn");
    if (removeBtn) {
      const productId = removeBtn.dataset.productId;
      await removeWishlistItem(productId);
      return;
    }

    const chooseVariantBtn = e.target.closest(".wishlist-choose-variant-btn");
    if (chooseVariantBtn) {
      const productId = chooseVariantBtn.dataset.productId;
      const productName = chooseVariantBtn.dataset.productName;
      const variants = JSON.parse(chooseVariantBtn.dataset.variants || "[]");

      openWishlistVariantModal(productId, productName, variants);
      return;
    }

    const addBtn = e.target.closest(".wishlist-add-cart-btn");
    if (addBtn && addBtn.tagName === "BUTTON") {
      const productId = addBtn.dataset.productId;
      const variantId = addBtn.dataset.variantId;
      await addWishlistItemToCart(productId, variantId);
    }
  });
}

if (wishlistVariantOptions) {
  wishlistVariantOptions.addEventListener("click", (e) => {
    const variantCard = e.target.closest(".shop-variant-option-card");
    if (!variantCard || variantCard.disabled) return;

    selectedWishlistVariantId = variantCard.dataset.variantId;
    highlightWishlistSelectedVariant();
  });
}

if (clearWishlistBtn) {
  clearWishlistBtn.addEventListener("click", () => {
    showConfirm("Remove all items from wishlist?", async () => {
      await clearWishlist();
    });
  });
}

document
  .getElementById("closeWishlistVariantModalBtn")
  ?.addEventListener("click", closeWishlistVariantModal);
document
  .getElementById("wishlistVariantCancelBtn")
  ?.addEventListener("click", closeWishlistVariantModal);
document
  .getElementById("wishlistVariantModalBackdrop")
  ?.addEventListener("click", closeWishlistVariantModal);

wishlistVariantAddToCartBtn?.addEventListener("click", async () => {
  if (!selectedWishlistProductId || !selectedWishlistVariantId) {
    showAlertModal("Please choose a variant");
    return;
  }

  await addWishlistItemToCart(selectedWishlistProductId, selectedWishlistVariantId);
  closeWishlistVariantModal();
});

loadWishlist();
