const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchInput = document.getElementById("search");
// const shopFilterForm = document.getElementById("shopFilterForm");
const sortSelect = document.getElementById("sort");
const categorySelect = document.getElementById("category");
const brandSelect = document.getElementById("brand");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");

const shopResults = document.getElementById("shopResults");
const shopPagination = document.getElementById("shopPagination");
const shopCountText = document.getElementById("shopCountText");
const shopNoticeData = document.getElementById("shopNoticeData");

const shopVariantModal = document.getElementById("shopVariantModal");
const shopVariantOptions = document.getElementById("shopVariantOptions");
const shopVariantModalTitle = document.getElementById("shopVariantModalTitle");
const shopVariantAddToCartBtn = document.getElementById(
  "shopVariantAddToCartBtn",
);

let wishlistedProductIds = new Set();
let cartVariantQuantities = new Map();

let selectedVariantForModal = null;
let selectedProductForModal = null;

async function loadCartVariantQuantities() {
  const token = localStorage.getItem("token");

  if (!token) {
    cartVariantQuantities = new Map();
    return;
  }

  try {
    const res = await fetch("/cart/data", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      cartVariantQuantities = new Map();
      return;
    }

    cartVariantQuantities = new Map(
      (data.data.items || []).map((item) => [
        String(item.variant_id),
        Number(item.quantity) || 0,
      ]),
    );
  } catch {
    cartVariantQuantities = new Map();
  }
}

function getCartQuantityForVariant(variantId) {
  return cartVariantQuantities.get(String(variantId)) || 0;
}

function renderShopVariantOptions(variants) {
  if (!shopVariantOptions) return;

  shopVariantOptions.innerHTML = variants
    .map((variant) => {
      const attrs = variant.attributes?.length
        ? variant.attributes
            .map((attr) => `${attr.type}: ${attr.value}`)
            .join(" / ")
        : "Standard Variant";
      const cartQty = getCartQuantityForVariant(variant._id);
      const remainingQty = Math.max((variant.stock_qty || 0) - cartQty, 0);
      const reachedCartLimit = cartQty > 0 && remainingQty <= 0;
      const isSelectable = remainingQty > 0;

      let stockText = "Out of stock";
      let stockClass = "out-stock";

      if (reachedCartLimit) {
        stockText = `Already in cart. Only ${variant.stock_qty} unit${variant.stock_qty > 1 ? "s" : ""} available`;
        stockClass = "cart-limit";
      } else if (remainingQty > 0) {
        stockText = `${remainingQty} in stock`;
        stockClass = "in-stock";
      }

      return `
        <button
          type="button"
          class="shop-variant-option-card ${isSelectable ? "" : "disabled"}"
          data-variant-id="${variant._id}"
          ${isSelectable ? "" : "disabled"}
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
            <small class="${stockClass}">
              ${stockText}
            </small>
          </div>
        </button>
      `;
    })
    .join("");
}

function syncShopVariantAddToCartBtnState() {
  if (!shopVariantAddToCartBtn) return;

  shopVariantAddToCartBtn.disabled = !selectedVariantForModal;
}

async function openShopVariantModal(productId, productName, variants) {
  if (!shopVariantModal || !shopVariantOptions || !shopVariantModalTitle)
    return;

  await loadCartVariantQuantities();

  selectedProductForModal = productId;
  selectedVariantForModal = null;
  shopVariantModalTitle.textContent = `Choose Variant - ${productName}`;

  renderShopVariantOptions(variants);

  const firstAvailable = variants.find(
    (variant) =>
      Math.max((variant.stock_qty || 0) - getCartQuantityForVariant(variant._id), 0) > 0,
  );
  if (firstAvailable) {
    selectedVariantForModal = firstAvailable._id;
  }

  shopVariantModal.classList.remove("hidden");
  highlightSelectedVariantCard();
  syncShopVariantAddToCartBtnState();
}

function closeShopVariantModal() {
  if (shopVariantModal) {
    shopVariantModal.classList.add("hidden");
  }

  selectedVariantForModal = null;
  selectedProductForModal = null;
  syncShopVariantAddToCartBtnState();
}

function highlightSelectedVariantCard() {
  document.querySelectorAll(".shop-variant-option-card").forEach((card) => {
    card.classList.toggle(
      "active",
      card.dataset.variantId === String(selectedVariantForModal),
    );
  });

  syncShopVariantAddToCartBtnState();
}

async function loadWishlistState() {
  const token = localStorage.getItem("token");

  if (!token) {
    wishlistedProductIds = new Set();
    syncWishlistIcons();
    return;
  }

  try {
    const res = await fetch("/wishlist/data", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      wishlistedProductIds = new Set();
      syncWishlistIcons();
      return;
    }

    wishlistedProductIds = new Set(
      (data.data.items || []).map((item) => String(item.product_id)),
    );

    syncWishlistIcons();
  } catch {
    wishlistedProductIds = new Set();
    syncWishlistIcons();
  }
}

function syncWishlistIcons() {
  document.querySelectorAll(".wishlist-icon-btn").forEach((button) => {
    const productId = String(button.dataset.productId || "");
    const isActive = wishlistedProductIds.has(productId);

    button.classList.toggle("active", isActive);
    button.setAttribute(
      "aria-label",
      isActive ? "Remove from wishlist" : "Add to wishlist",
    );
  });
}

async function toggleWishlist(productId) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  const isWishlisted = wishlistedProductIds.has(String(productId));

  const res = await fetch(
    isWishlisted ? `/wishlist/${productId}` : "/wishlist",
    {
      method: isWishlisted ? "DELETE" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(isWishlisted
        ? {}
        : {
            body: JSON.stringify({ productId }),
          }),
    },
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Failed to update wishlist");
    return;
  }

  if (isWishlisted) {
    wishlistedProductIds.delete(String(productId));
  } else {
    wishlistedProductIds.add(String(productId));
  }

  syncWishlistIcons();
  showToast(
    data.message ||
      (isWishlisted ? "Removed from wishlist" : "Added to wishlist"),
    "success",
  );
}

async function addProductToCart(productId, variantId) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  const res = await fetch("/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      productId,
      variantId,
      quantity: 1,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to add item to cart");
    return false;
  }

  const currentQty = getCartQuantityForVariant(variantId);
  cartVariantQuantities.set(String(variantId), currentQty + 1);

  wishlistedProductIds.delete(String(productId));
  syncWishlistIcons();
  loadWishlistState();

  showToast(data.message || "Added to cart", "success");
  return true;
}

const initialParams = new URLSearchParams(window.location.search);
let currentPage = Number(initialParams.get("page")) || 1;
let searchDebounce;
let priceDebounce;

function getCurrentFilters() {
  return {
    search: searchInput?.value.trim() || "",
    sort: sortSelect?.value || "",
    category: categorySelect?.value || "",
    brand: brandSelect?.value || "",
    minPrice: minPriceInput?.value || "",
    maxPrice: maxPriceInput?.value || "",
    page: currentPage,
  };
}

function buildQueryString(filters) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.category) params.set("category", filters.category);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  params.set("page", filters.page);

  return params.toString();
}

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function renderShopPriceBlock(product) {
  const hasOffer = Boolean(product.has_offer);

  const isRange =
    Number(product.min_final_price || 0) !== Number(product.max_final_price || 0);

  const finalPriceText = isRange
    ? `${formatCurrency(product.min_final_price)} - ${formatCurrency(product.max_final_price)}`
    : formatCurrency(product.min_final_price);

  const originalPriceText =
    Number(product.min_original_price || 0) !== Number(product.max_original_price || 0)
      ? `${formatCurrency(product.min_original_price)} - ${formatCurrency(product.max_original_price)}`
      : formatCurrency(product.min_original_price);

  return `
    <div class="shop-price-block">
      <span class="shop-offer-badge ${hasOffer ? "" : "is-placeholder"}">
        ${hasOffer ? "Offer Applied" : "&nbsp;"}
      </span>

      <div class="shop-price-stack">
        ${
          hasOffer
            ? `<span class="shop-price-original">${originalPriceText}</span>`
            : ""
        }
        <strong class="shop-price-final">${finalPriceText}</strong>
      </div>
    </div>
  `;
}



function renderProducts(products) {
  if (!shopResults) return;

  if (!products.length) {
    shopResults.innerHTML = `
      <div class="shop-empty">
        <h3>No products found</h3>
        <p>Try changing search, sort, or filter options.</p>
      </div>
    `;
    return;
  }

  shopResults.innerHTML = `
    <div class="shop-grid">
      ${products
        .map((product) => {

          const brandPart = product.brand_name
            ? ` • ${product.brand_name}`
            : "";

          const stockClass = product.total_stock > 0 ? "in-stock" : "out-stock";
          const stockText =
            product.total_stock > 0 ? "In stock" : "Out of stock";

          return `
            <article class="shop-card" data-product-id="${product._id}">
              <button
                type="button"
                class="wishlist-icon-btn"
                data-product-id="${product._id}"
                aria-label="Toggle wishlist"
              >
                <span class="wishlist-icon-outline">♡</span>
                <span class="wishlist-icon-filled">♥</span>
              </button>

              <a href="/shop/${product._id}" class="shop-card-link">

                <img
                  src="${product.main_image || "/images/no-image.png"}"
                  alt="${product.product_name}"
                >
                <h3>${product.product_name}</h3>
                <p class="shop-meta">
                  ${product.category_name || "Category"}${brandPart}
                </p>
                ${renderShopPriceBlock(product)}
                <div class="shop-card-footer">
                  <p class="shop-stock ${stockClass}">
                    ${stockText}
                  </p>

                  ${
                    product.total_stock > 0 && product.variant_count === 1
                      ? `<button
                          type="button"
                          class="shop-add-cart-btn"
                          data-product-id="${product._id}"
                          data-variant-id="${product.single_variant_id}"
                        >
                          Add to Cart
                        </button>`
                      : product.total_stock > 0 && product.variant_count > 1
                        ? `<button
                            type="button"
                            class="shop-choose-options-btn"
                            data-product-id="${product._id}"
                            data-product-name="${product.product_name}"
                            data-variants='${JSON.stringify(product.variant_options)}'
                          >
                            View All Variants
                          </button>`
                        : `<button type="button" class="shop-add-cart-btn" disabled>
                            Out of Stock
                          </button>`
                  }
                </div>

              </a>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
  syncWishlistIcons();
}

function renderShopError(message) {
  if (!shopResults) return;

  shopResults.innerHTML = `
    <div class="shop-empty">
      <h3>Unable to load products</h3>
      <p>${message}</p>
    </div>
  `;
}

function renderCount(productsLength, totalProducts) {
  if (!shopCountText) return;

  shopCountText.innerHTML = `
    Showing <strong>${productsLength}</strong> of
    <strong>${totalProducts}</strong> products
  `;
}

function renderPagination(pagination) {
  if (!shopPagination) return;

  if (pagination.totalPages <= 1) {
    shopPagination.innerHTML = "";
    return;
  }

  const prevDisabled = pagination.currentPage <= 1;
  const nextDisabled = pagination.currentPage >= pagination.totalPages;

  shopPagination.innerHTML = `
    <div class="shop-pagination">
      ${
        prevDisabled
          ? `<span class="page-btn disabled">Previous</span>`
          : `<button class="page-btn" data-page="${pagination.currentPage - 1}">Previous</button>`
      }

      <span class="page-current">
        Page ${pagination.currentPage} of ${pagination.totalPages}
      </span>

      ${
        nextDisabled
          ? `<span class="page-btn disabled">Next</span>`
          : `<button class="page-btn" data-page="${pagination.currentPage + 1}">Next</button>`
      }
    </div>
  `;

  shopPagination.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      currentPage = Number(button.dataset.page);
      loadShopProducts();
    });
  });
}

async function loadShopProducts() {
  const filters = getCurrentFilters();
  filters.page = currentPage;

  const queryString = buildQueryString(filters);

  try {
    const res = await fetch(`/shop/data?${queryString}`, {
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      renderShopError(data.message || "Failed to load filtered products.");
      return;
    }

    renderProducts(data.data.products);
    syncWishlistIcons();
    loadWishlistState();
    renderCount(data.data.products.length, data.data.pagination.totalProducts);
    renderPagination(data.data.pagination);

    const url = queryString ? `/shop?${queryString}` : "/shop";
    window.history.replaceState({}, "", url);
  } catch (error) {
    renderShopError("Something went wrong while filtering products.");
  }
}

if (clearSearchBtn && searchInput) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentPage = 1;
    loadShopProducts();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);

    searchDebounce = setTimeout(() => {
      currentPage = 1;
      loadShopProducts();
    }, 400);
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    currentPage = 1;
    loadShopProducts();
  });
}

if (categorySelect) {
  categorySelect.addEventListener("change", () => {
    currentPage = 1;
    loadShopProducts();
  });
}

if (brandSelect) {
  brandSelect.addEventListener("change", () => {
    currentPage = 1;
    loadShopProducts();
  });
}

if (minPriceInput) {
  minPriceInput.addEventListener("input", () => {
    clearTimeout(priceDebounce);

    priceDebounce = setTimeout(() => {
      currentPage = 1;
      loadShopProducts();
    }, 500);
  });
}

if (maxPriceInput) {
  maxPriceInput.addEventListener("input", () => {
    clearTimeout(priceDebounce);

    priceDebounce = setTimeout(() => {
      currentPage = 1;
      loadShopProducts();
    }, 500);
  });
}

if (shopResults) {
  shopResults.addEventListener("click", async (e) => {
    const wishlistBtn = e.target.closest(".wishlist-icon-btn");
    if (wishlistBtn) {
      e.preventDefault();
      e.stopPropagation();

      const productId = wishlistBtn.dataset.productId;
      await toggleWishlist(productId);
      return;
    }

    const addBtn = e.target.closest(".shop-add-cart-btn");
    if (addBtn && !addBtn.disabled) {
      e.preventDefault();
      e.stopPropagation();

      const productId = addBtn.dataset.productId;
      const variantId = addBtn.dataset.variantId;

      await addProductToCart(productId, variantId);
      return;
    }

    const chooseBtn = e.target.closest(".shop-choose-options-btn");
    if (chooseBtn) {
      e.preventDefault();
      e.stopPropagation();

      const productId = chooseBtn.dataset.productId;
      const productName = chooseBtn.dataset.productName;
      const variants = JSON.parse(chooseBtn.dataset.variants || "[]");

      await openShopVariantModal(productId, productName, variants);
      return;
    }
  });
}

if (shopVariantOptions) {
  shopVariantOptions.addEventListener("click", (e) => {
    const variantCard = e.target.closest(".shop-variant-option-card");
    if (!variantCard || variantCard.disabled) return;

    selectedVariantForModal = variantCard.dataset.variantId;
    highlightSelectedVariantCard();
  });
}

document
  .getElementById("closeShopVariantModalBtn")
  ?.addEventListener("click", closeShopVariantModal);
document
  .getElementById("shopVariantCancelBtn")
  ?.addEventListener("click", closeShopVariantModal);
document
  .getElementById("shopVariantModalBackdrop")
  ?.addEventListener("click", closeShopVariantModal);

shopVariantAddToCartBtn?.addEventListener("click", async () => {
  if (!selectedProductForModal || !selectedVariantForModal) {
    showAlertModal("Please choose a variant");
    return;
  }

  const success = await addProductToCart(
    selectedProductForModal,
    selectedVariantForModal,
  );
  if (success) {
    closeShopVariantModal();
  }
});

window.addEventListener("load", () => {
  if (!shopNoticeData) return;

  const noticeMessage = shopNoticeData.dataset.notice?.trim();

  if (!noticeMessage) return;

  showAlertModal(noticeMessage);

  const cleanUrl =
    window.location.pathname +
    window.location.search
      .replace(/([?&])notice=[^&]*&?/, "$1")
      .replace(/[?&]$/, "");

  window.history.replaceState({}, "", cleanUrl || "/shop");
});

loadWishlistState();
