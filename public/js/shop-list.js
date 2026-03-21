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
    page: currentPage
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
          const priceRange =
            product.max_price && product.max_price !== product.min_price
              ? `₹${product.min_price} - ₹${product.max_price}`
              : `₹${product.min_price}`;

          const brandPart = product.brand_name
            ? ` • ${product.brand_name}`
            : "";

          const stockClass = product.total_stock > 0 ? "in-stock" : "out-stock";
          const stockText = product.total_stock > 0 ? "In stock" : "Out of stock";

          return `
            <article class="shop-card">
              <a href="/shop/${product._id}" class="shop-card-link">
                <img
                  src="${product.main_image || "/images/no-image.png"}"
                  alt="${product.product_name}"
                >
                <h3>${product.product_name}</h3>
                <p class="shop-meta">
                  ${product.category_name || "Category"}${brandPart}
                </p>
                <p class="shop-price">${priceRange}</p>
                <p class="shop-stock ${stockClass}">
                  ${stockText}
                </p>
              </a>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
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
        Accept: "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      renderShopError(data.message || "Failed to load filtered products.");
      return;
    }

    renderProducts(data.data.products);
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


// if (shopFilterForm) {
//   shopFilterForm.addEventListener("submit", (e) => {
//     e.preventDefault();
//     currentPage = 1;
//     loadShopProducts();
//   });
// }
