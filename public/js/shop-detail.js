const mainProductImage = document.getElementById("mainProductImage");
const zoomBox = document.getElementById("zoomBox");
const addToCartBtn = document.getElementById("addToCartBtn");
const buyNowBtn = document.getElementById("buyNowBtn");
const outOfStockBtn = document.getElementById("outOfStockBtn");
const detailActionRow = document.getElementById("detailActionRow");
const detailPriceValue = document.getElementById("detailPriceValue");
const detailOriginalPrice = document.getElementById("detailOriginalPrice");
const detailDiscountBadge = document.getElementById("detailDiscountBadge");
const detailStockLabel = document.getElementById("detailStockLabel");
const detailStockMeta = document.getElementById("detailStockMeta");
const variantOptions = document.querySelectorAll(".variant-option");
const variantCountText = document.getElementById("variantCountText");
const thumbnailRow = document.querySelector(".product-thumbnail-row");
const thumbnailButtons = document.querySelectorAll(".product-thumb-btn");
const variantDataEl = document.getElementById("variantData");

const productWishlistBtn = document.getElementById("productWishlistBtn");
const productDetailMeta = document.getElementById("productDetailMeta");


function syncProductWishlistButton(isWishlisted) {
  if (!productWishlistBtn) return;

  productWishlistBtn.classList.toggle("active", isWishlisted);
  productWishlistBtn.setAttribute(
    "aria-label",
    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
  );
}

async function loadProductWishlistState() {
  if (!productWishlistBtn || !productDetailMeta) return;

  const token = localStorage.getItem("token");
  const productId = productDetailMeta.dataset.productId;

  if (!token || !productId) {
    syncProductWishlistButton(false);
    return;
  }

  try {
    const res = await fetch("/wishlist/data", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      syncProductWishlistButton(false);
      return;
    }

    const isWishlisted = (data.data.items || []).some(
      (item) => String(item.product_id) === String(productId)
    );

    syncProductWishlistButton(isWishlisted);
  } catch {
    syncProductWishlistButton(false);
  }
}

async function toggleProductWishlist() {
  if (!productWishlistBtn || !productDetailMeta) return;

  const token = localStorage.getItem("token");
  const productId = productDetailMeta.dataset.productId;

  if (!token) {
    window.location.href = "/login";
    return;
  }

  const isWishlisted = productWishlistBtn.classList.contains("active");

  const res = await fetch(
    isWishlisted ? `/wishlist/${productId}` : "/wishlist",
    {
      method: isWishlisted ? "DELETE" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      ...(isWishlisted
        ? {}
        : {
            body: JSON.stringify({ productId })
          })
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Failed to update wishlist");
    return;
  }

  syncProductWishlistButton(!isWishlisted);
  showToast(
    data.message || (isWishlisted ? "Removed from wishlist" : "Added to wishlist"),
    "success"
  );
}



let inStock = detailActionRow?.dataset.inStock === "true";
let variants = [];

if (variantDataEl) {
  try {
    variants = JSON.parse(variantDataEl.textContent);
  } catch (error) {
    variants = [];
  }
}

function buildImages(variant) {
  return [
    ...(variant.main_image ? [variant.main_image] : []),
    ...(variant.gallery_images || [])
  ].filter(Boolean);
}

function renderThumbnails(images) {
  if (!thumbnailRow) return;

  thumbnailRow.innerHTML = "";

  images.forEach((image, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `product-thumb-btn ${index === 0 ? "active" : ""}`;
    button.dataset.image = image;

    button.innerHTML = `<img src="${image}" alt="Thumbnail">`;

    button.addEventListener("click", () => {
      if (!mainProductImage) return;

      mainProductImage.src = image;

      document
        .querySelectorAll(".product-thumb-btn")
        .forEach((btn) => btn.classList.remove("active"));

      button.classList.add("active");
    });

    thumbnailRow.appendChild(button);
  });
}

thumbnailButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextImage = button.dataset.image;

    if (!nextImage || !mainProductImage) return;

    mainProductImage.src = nextImage;

    document
      .querySelectorAll(".product-thumb-btn")
      .forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");
  });
});


function updateVariantUI(variant, clickedButton) {
  if (!variant) return;

  const finalPrice = Number(variant.final_price || variant.price || 0);
  const originalPrice = Number(variant.original_price || variant.price || 0);
  const discountAmount = Number(variant.discount_amount || 0);
  const hasOffer = Boolean(variant.has_offer);

  if (detailPriceValue) {
    detailPriceValue.textContent = `Rs. ${finalPrice.toFixed(2)}`;
  }

  if (detailOriginalPrice) {
    detailOriginalPrice.textContent = `Rs. ${originalPrice.toFixed(2)}`;
    detailOriginalPrice.classList.toggle("hidden", !hasOffer);
  }

  if (detailDiscountBadge) {
    detailDiscountBadge.textContent = `Save Rs. ${discountAmount.toFixed(2)}`;
    detailDiscountBadge.classList.toggle("hidden", !hasOffer);
  }


  if (detailStockLabel && detailStockMeta && detailActionRow) {
    if (variant.stock_qty > 0) {
      detailStockLabel.textContent = "In stock";
      detailStockLabel.classList.remove("out-stock");
      detailStockLabel.classList.add("in-stock");

      detailStockMeta.textContent = `${variant.stock_qty} units available`;

      detailActionRow.dataset.inStock = "true";
      inStock = true;

      if (addToCartBtn) addToCartBtn.style.display = "";
      if (buyNowBtn) buyNowBtn.style.display = "";
      if (outOfStockBtn) outOfStockBtn.style.display = "none";
    } else {
      detailStockLabel.textContent = "Out of stock";
      detailStockLabel.classList.remove("in-stock");
      detailStockLabel.classList.add("out-stock");

      detailStockMeta.textContent = "Currently unavailable";

      detailActionRow.dataset.inStock = "false";
      inStock = false;

      if (addToCartBtn) addToCartBtn.style.display = "none";
      if (buyNowBtn) buyNowBtn.style.display = "none";
      if (outOfStockBtn) outOfStockBtn.style.display = "";
    }
  }


  const images = buildImages(variant);

  if (images.length && mainProductImage) {
    mainProductImage.src = images[0];
  }

  renderThumbnails(images);

  if (variantCountText) {
    variantCountText.textContent = variants.length;
  }

  variantOptions.forEach((button) => button.classList.remove("active"));
  if (clickedButton) {
    clickedButton.classList.add("active");
  }
}

variantOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.variantIndex);
    const variant = variants[index];

    updateVariantUI(variant, button);
  });
});

if (variants.length) {
  const initialActiveButton =
    document.querySelector(".variant-option.active") || variantOptions[0];

  const initialIndex = initialActiveButton
    ? Number(initialActiveButton.dataset.variantIndex)
    : 0;

  updateVariantUI(variants[initialIndex], initialActiveButton);
}


if (zoomBox && mainProductImage) {
  zoomBox.addEventListener("mousemove", (event) => {
    const rect = zoomBox.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    mainProductImage.style.transformOrigin = `${x}% ${y}%`;
    mainProductImage.classList.add("zoomed");
  });

  zoomBox.addEventListener("mouseleave", () => {
    mainProductImage.classList.remove("zoomed");
    mainProductImage.style.transformOrigin = "center center";
  });
}

if (addToCartBtn) {
  addToCartBtn.addEventListener("click", async () => {
    if (!inStock) {
      showAlertModal("This variant is currently out of stock.");
      return;
    }

    const activeVariantBtn = document.querySelector(".variant-option.active");
    const activeVariantIndex = activeVariantBtn
      ? Number(activeVariantBtn.dataset.variantIndex)
      : 0;

    const selectedVariant = variants[activeVariantIndex];

    if (!selectedVariant?._id || !selectedVariant?.product_id) {
      showAlertModal("Unable to identify selected variant.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const res = await fetch("/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        productId: selectedVariant.product_id,
        variantId: selectedVariant._id,
        quantity: 1
      })
    });

    const data = await res.json();

    if (!data.success) {
      const message = data.message || "Failed to add item to cart";

      const normalizedMessage = message.toLowerCase();
      const shouldRedirect =
        normalizedMessage.includes("unavailable") ||
        normalizedMessage.includes("not found");

      if (shouldRedirect) {
        window.location.href = "/shop?notice=This product is unavailable";
        return;
      }

      showAlertModal(message);
      return;
    }



    showToast(data.message || "Item added to cart", "success");
  });
}


if (buyNowBtn) {
  buyNowBtn.addEventListener("click", () => {
    if (!inStock) {
      showAlertModal("This variant is currently unavailable for purchase.");
      return;
    }

    // showAlertModal("Checkout flow is not implemented yet.");
  });
}



if (productWishlistBtn) {
  productWishlistBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleProductWishlist();
  });
}


loadProductWishlistState();


