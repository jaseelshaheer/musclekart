const mainProductImage = document.getElementById("mainProductImage");
const zoomBox = document.getElementById("zoomBox");
const addToCartBtn = document.getElementById("addToCartBtn");
const buyNowBtn = document.getElementById("buyNowBtn");
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

  const price = Number(variant.price || 0);
  const originalPrice = Math.round(price * 1.12);
  const discountPercent = Math.max(
    0,
    Math.round(((originalPrice - price) / originalPrice) * 100)
  );

  if (detailPriceValue) {
    detailPriceValue.textContent = `₹${price}`;
  }

  if (detailOriginalPrice) {
    detailOriginalPrice.textContent = `₹${originalPrice}`;
  }

  if (detailDiscountBadge) {
    detailDiscountBadge.textContent = `${discountPercent}% OFF`;
  }

  if (detailStockLabel && detailStockMeta && detailActionRow) {
    if (variant.stock_qty > 0) {
      detailStockLabel.textContent = "In stock";
      detailStockLabel.classList.remove("out-stock");
      detailStockLabel.classList.add("in-stock");

      detailStockMeta.textContent = `${variant.stock_qty} units available`;

      detailActionRow.dataset.inStock = "true";
      inStock = true;
    } else {
      detailStockLabel.textContent = "Out of stock";
      detailStockLabel.classList.remove("in-stock");
      detailStockLabel.classList.add("out-stock");

      detailStockMeta.textContent = "Currently unavailable";

      detailActionRow.dataset.inStock = "false";
      inStock = false;
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
  addToCartBtn.addEventListener("click", () => {
    if (!inStock) {
      showAlertModal("This variant is currently out of stock.");
      return;
    }

    // showAlertModal("Cart flow is not implemented yet.");
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

