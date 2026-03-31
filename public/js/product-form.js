if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin/login";
}

const token = localStorage.getItem("adminToken");

/* -----------------------------
   DOM
----------------------------- */

const categorySelect = document.getElementById("categorySelect");
const brandSelect = document.getElementById("brandSelect");

const productName = document.getElementById("productName");
const description = document.getElementById("description");
const specifications = document.getElementById("specifications");
const cancelProductBtn = document.getElementById("cancelProductBtn");


const addVariantBtn = document.getElementById("addVariantBtn");
const variantForm = document.getElementById("variantFormWrapper");

const priceInput = document.getElementById("variantPrice");
const stockInput = document.getElementById("variantStock");

const variantTable = document.getElementById("variantTable");
const attributesContainer = document.getElementById("attributesContainer");
const addAttributeBtn = document.getElementById("addAttributeBtn");

const cancelVariantBtn = document.getElementById("cancelVariantBtn");
const variantFormWrapper = document.getElementById("variantFormWrapper");


// image upload
const mainImageUpload = document.getElementById("mainImageUpload");
const mainImageInput = document.getElementById("variantMainImage");

// const galleryUpload = document.getElementById("galleryUpload");
const galleryInput = document.getElementById("variantImages");

const mainImagePreviewWrapper = document.getElementById("mainImagePreviewWrapper");
const mainImagePreview = document.getElementById("mainImagePreview");
const removeMainImage = document.getElementById("removeMainImage");
const galleryPreview = document.getElementById("galleryPreview");
const productIdInput = document.getElementById("productId");
const saveProductBtn = document.getElementById("saveProductBtn");


const productNameCount = document.getElementById("productNameCount");
const descriptionCount = document.getElementById("descriptionCount");
const specificationsCount = document.getElementById("specificationsCount");



function updateProductCounts() {
  if (productNameCount) {
    productNameCount.textContent = `${productName.value.length} / 120`;
  }

  if (descriptionCount) {
    descriptionCount.textContent = `${description.value.length} / 1000`;
  }

  if (specificationsCount) {
    specificationsCount.textContent = `${specifications.value.length} / 2000`;
  }
}


productName.addEventListener("input", () => {
  clearFieldError(productName, document.getElementById("productNameError"));
  updateProductCounts();
});

description.addEventListener("input", updateProductCounts);
specifications.addEventListener("input", updateProductCounts);




function clearFieldError(inputEl, errorEl) {
  if (inputEl) inputEl.classList.remove("input-error");
  if (errorEl) errorEl.textContent = "";
}

function setFieldError(inputEl, errorEl, message) {
  if (inputEl) inputEl.classList.add("input-error");
  if (errorEl) errorEl.textContent = message;
}

function clearProductErrors() {
  clearFieldError(productName, document.getElementById("productNameError"));
  clearFieldError(categorySelect, document.getElementById("categoryError"));
  clearFieldError(brandSelect, document.getElementById("brandError"));
  document.getElementById("variantsError").textContent = "";
}

function clearVariantErrors() {
  document.getElementById("variantAttributesError").textContent = "";
  clearFieldError(priceInput, document.getElementById("variantPriceError"));
  clearFieldError(stockInput, document.getElementById("variantStockError"));
  document.getElementById("variantMainImageError").textContent = "";
  document.getElementById("variantGalleryError").textContent = "";
}


productName.addEventListener("input", () => {
  clearFieldError(productName, document.getElementById("productNameError"));
});

categorySelect.addEventListener("change", () => {
  clearFieldError(categorySelect, document.getElementById("categoryError"));
});

brandSelect.addEventListener("change", () => {
  clearFieldError(brandSelect, document.getElementById("brandError"));
});


priceInput.addEventListener("input", () => {
  clearFieldError(priceInput, document.getElementById("variantPriceError"));
});

stockInput.addEventListener("input", () => {
  clearFieldError(stockInput, document.getElementById("variantStockError"));
});




function showConfirm(message, onConfirm){

  const modal = document.getElementById("confirmModal");
  const msg = document.getElementById("confirmMessage");
  const okBtn = document.getElementById("confirmOk");
  const cancelBtn = document.getElementById("confirmCancel");

  msg.textContent = message;

  modal.classList.remove("hidden");

  okBtn.onclick = () => {
    modal.classList.add("hidden");
    onConfirm();
  };

  cancelBtn.onclick = () => {
    modal.classList.add("hidden");
  };

}


mainImageUpload.onclick = () => {
  mainImageInput.click();
};

// galleryUpload.onclick = () => {
//   galleryInput.click();
// };

let cropper;
let currentImageType = null;

mainImageInput.addEventListener("change", (e) => {

  const file = e.target.files[0];
  if (!file) return;

  openCropModal(file, "main");

  // reset input so same file can be selected again
  e.target.value = "";

});



galleryInput.addEventListener("change", (e) => {

  const files = Array.from(e.target.files);

  if(!files.length) return;

  files.forEach(file=>{
    openCropModal(file,"gallery");
  });

  // reset input
  e.target.value = "";

});



function openCropModal(file, type){

  currentImageType = type;

  const reader = new FileReader();

  reader.onload = function(event){

    const image = document.getElementById("cropImage");

    image.src = event.target.result;

    document.getElementById("cropModal").classList.remove("hidden");

    if(cropper){
      cropper.destroy();
    }

    cropper = new Cropper(image,{
      aspectRatio:1,
      viewMode:1
    });

  };

  reader.readAsDataURL(file);

}


document.getElementById("cropConfirmBtn").onclick = async function () {
  const canvas = cropper.getCroppedCanvas({
    width: 1000,
    height: 1000
  });

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );

  if (!blob) return;

  const file = new File(
    [blob],
    `cropped-${Date.now()}.jpg`,
    { type: "image/jpeg" }
  );

  const previewUrl = URL.createObjectURL(blob);

  if (currentImageType === "main") {
    currentMainImageFile = file;
    currentMainImagePreview = previewUrl;

    mainImagePreview.src = previewUrl;
    mainImagePreviewWrapper.classList.remove("hidden");
    mainImageUpload.classList.add("hidden");
  }

  if (currentImageType === "gallery") {
    galleryFiles.push(file);
    galleryImages.push(previewUrl);

    renderGallery();
  }

  cropper.destroy();
  document.getElementById("cropModal").classList.add("hidden");
};

removeMainImage.onclick = function () {
  currentMainImageFile = null;
  currentMainImagePreview = "";

  mainImagePreview.src = "";
  mainImagePreviewWrapper.classList.add("hidden");
  mainImageUpload.classList.remove("hidden");
};



function renderGallery(){

  galleryPreview.innerHTML = "";

  const initialSlots = 3;

  const showUpload = galleryImages.length < MAX_GALLERY_IMAGES;

  const totalSlots = showUpload
    ? Math.max(initialSlots, galleryImages.length + 1)
    : galleryImages.length;

  for(let i=0;i<totalSlots;i++){

    const div = document.createElement("div");

    if(galleryImages[i]){

      div.className = "gallery-item";

      div.innerHTML = `
        <img src="${galleryImages[i]}">
        <span class="gallery-delete">✕</span>
      `;

      div.querySelector(".gallery-delete").onclick = function () {
        galleryImages.splice(i, 1);
        galleryFiles.splice(i, 1);
        renderGallery();
      }

    }
    else if(showUpload){

      // use the same upload style
      div.className = "image-upload-box";

      div.innerHTML = `
        <span>Upload</span>
      `;

      div.onclick = function(){
        galleryInput.click();
      };

    }

    galleryPreview.appendChild(div);

  }

}



document.getElementById("cropCancelBtn").onclick = function(){

  cropper.destroy();

  document.getElementById("cropModal").classList.add("hidden");

};



/* -----------------------------
   ADD ATTRIBUTE ROW
----------------------------- */

addAttributeBtn.onclick = () => {

  const row = document.createElement("div");
  row.className = "attribute-row";
  row.style = "display:flex;gap:10px;margin-bottom:8px;";

  row.innerHTML = `
    <input type="text" class="attr-type form-control small" maxlength="30" placeholder="Attribute (ex: Flavour)">
    <input type="text" class="attr-value form-control small" maxlength="50" placeholder="Value (ex: Chocolate)">
    <button type="button" class="attr-remove">
      Remove
    </button>
  `;

  attributesContainer.appendChild(row);

};


/* -----------------------------
   REMOVE ATTRIBUTE ROW
----------------------------- */

attributesContainer.addEventListener("click", (e) => {

  if (e.target.classList.contains("attr-remove")) {

    const row = e.target.closest(".attribute-row");
    row.remove();

  }

});

/* -----------------------------
   TEMP STORAGE
----------------------------- */


let isProductSubmitting = false;

let variants = [];
let editIndex = null;
let galleryImages = [];
let galleryFiles = [];
let currentMainImageFile = null;
let currentMainImagePreview = "";
const MAX_GALLERY_IMAGES = 6;



function normalizeVariantForEdit(variant) {
  return {
    _id: variant._id || null,
    attributes: variant.attributes || [],
    price: variant.price || "",
    stock: variant.stock_qty ?? "",
    main_image_preview: variant.main_image || null,
    main_image_file: null,
    gallery_images: [...(variant.gallery_images || [])],
    gallery_files: new Array((variant.gallery_images || []).length).fill(null)
  };
}



/* -----------------------------
   LOAD CATEGORIES
----------------------------- */

async function loadCategories() {

  const res = await fetch("/admin/categories?page=1&limit=100", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!data.success) return;

  categorySelect.innerHTML = `<option value="">Select Category</option>`;

  data.data.categories.forEach(cat => {

    const option = document.createElement("option");
    option.value = cat._id;
    option.textContent = cat.name;

    categorySelect.appendChild(option);

  });

}


/* -----------------------------
   LOAD BRANDS
----------------------------- */

async function loadBrands() {

  const res = await fetch("/admin/brands?page=1&limit=100", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!data.success) return;

  brandSelect.innerHTML = `<option value="">Select Brand</option>`;

  data.data.brands.forEach(brand => {

    const option = document.createElement("option");
    option.value = brand._id;
    option.textContent = brand.name;

    brandSelect.appendChild(option);

  });

}


async function loadProductForEdit() {
  const productId = productIdInput.value;

  if (!productId) return;

  const res = await fetch(`/admin/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to load product");
    return;
  }

  const product = data.data;

  productName.value = product.product_name || "";
  description.value = product.description || "";
  specifications.value = product.specifications || "";
  categorySelect.value = product.category_id ? String(product.category_id) : "";
  brandSelect.value = product.brand_id ? String(product.brand_id) : "";

  updateProductCounts();

  variants = (product.variants || []).map(normalizeVariantForEdit);
  renderVariants();
}


cancelProductBtn.onclick = () => {
  window.location.href = "/admin/products-list";
};


/* -----------------------------
   VARIANT FORM SHOW
----------------------------- */

addVariantBtn.onclick = () => {
  clearVariantForm();

  variantForm.classList.remove("hidden");
  variantFormWrapper.classList.remove("hidden");
  addVariantBtn.style.display = "none";
};



/* -----------------------------
   SAVE VARIANT
----------------------------- */

document.getElementById("saveVariantBtn").onclick = () => {
  const price = priceInput.value;
  const stock = stockInput.value;

  /* collect attributes */

  const attributes = [];

  document.querySelectorAll(".attribute-row").forEach((row) => {
    const type = row.querySelector(".attr-type").value.trim();
    const value = row.querySelector(".attr-value").value.trim();

    if (type && value) {
      attributes.push({ type, value });
    }
  });

  const variantKey = attributes
    .map(a => `${a.type}:${a.value}`)
    .join("|");

  const duplicate = variants.some((v, i) => {

    const key = v.attributes
      .map(a => `${a.type}:${a.value}`)
      .join("|");

    return key === variantKey && i !== editIndex;

  });

  clearVariantErrors();

  let isValid = true;

  if (!attributes.length) {
    document.getElementById("variantAttributesError").textContent =
      "Add at least one attribute";
    isValid = false;
  }

  if (!price || Number(price) <= 0) {
    setFieldError(
      priceInput,
      document.getElementById("variantPriceError"),
      "Enter a valid price greater than 0"
    );
    isValid = false;
  }

  if (stock === "" || Number(stock) < 0) {
    setFieldError(
      stockInput,
      document.getElementById("variantStockError"),
      "Enter valid stock quantity"
    );
    isValid = false;
  }

  const invalidAttribute = attributes.some(
    (attr) => !attr.type?.trim() || !attr.value?.trim()
  );

  if (invalidAttribute) {
    document.getElementById("variantAttributesError").textContent =
      "Each attribute must have both name and value";
    isValid = false;
  }

  if (duplicate) {
    document.getElementById("variantAttributesError").textContent =
      "Variant with same attributes already exists";
    isValid = false;
  }


  const totalImages =
    (currentMainImagePreview || currentMainImageFile ? 1 : 0) +
    galleryImages.length;

  if (totalImages < 3) {
    document.getElementById("variantGalleryError").textContent =
      "Add at least 3 images in total for this variant";
    isValid = false;
  }


  if (!isValid) return;


  const variant = {
    _id: editIndex !== null ? variants[editIndex]?._id || null : null,
    attributes,
    price,
    stock,
    main_image_preview: currentMainImagePreview || null,
    main_image_file: currentMainImageFile,
    gallery_images: [...galleryImages],
    gallery_files: [...galleryFiles]
  };


  if (editIndex !== null) {
    variants[editIndex] = variant;
    editIndex = null;
  } else {
    variants.push(variant);
  }

  document.getElementById("variantsError").textContent = "";

  clearVariantForm();
  renderVariants();

  // collapse form after adding
  variantFormWrapper.classList.add("hidden");
  addVariantBtn.style.display = "inline-block";
};



/* -----------------------------
   RENDER VARIANT TABLE
----------------------------- */

function renderVariants() {

  variantTable.innerHTML = "";

  variants.forEach((v, index) => {

    const tr = document.createElement("tr");

    const imageSrc =
      v.main_image_preview ||
      (v.gallery_images && v.gallery_images.length ? v.gallery_images[0] : null);


    tr.innerHTML = `
      <td>
        ${
          imageSrc
            ? `<img src="${imageSrc}" class="variant-thumb">`
            : `<div class="variant-thumb placeholder"></div>`
        }
      </td>

      <td>${v.attributes.map(a => a.value).join(" / ")}</td>

      <td>₹${v.price}</td>

      <td>${v.stock}</td>

      <td>
        <button class="btn-edit" onclick="editVariant(${index})">
          Edit
        </button>

        <button class="btn-delete" onclick="deleteVariant(${index})">
          Delete
        </button>
      </td>
    `;

    variantTable.appendChild(tr);

  });

}



/* -----------------------------
   EDIT VARIANT
----------------------------- */

window.editVariant = function (index) {
  const v = variants[index];

  attributesContainer.innerHTML = "";

  v.attributes.forEach((attr) => {
    const row = document.createElement("div");
    row.className = "attribute-row";
    row.style = "display:flex;gap:10px;margin-bottom:8px;";

    row.innerHTML = `
      <input type="text" class="attr-type form-control small" maxlength="30" value="${attr.type}">
      <input type="text" class="attr-value form-control small" maxlength="50" value="${attr.value}">
      <button type="button" class="attr-remove">Remove</button>
    `;


    attributesContainer.appendChild(row);
  });
  priceInput.value = v.price;
  stockInput.value = v.stock;


  if (v.main_image_preview) {
    currentMainImageFile = v.main_image_file || null;
    currentMainImagePreview = v.main_image_preview;

    mainImagePreview.src = v.main_image_preview;
    mainImagePreviewWrapper.classList.remove("hidden");
    mainImageUpload.classList.add("hidden");
  } else {
    currentMainImageFile = null;
    currentMainImagePreview = "";

    mainImagePreview.src = "";
    mainImagePreviewWrapper.classList.add("hidden");
    mainImageUpload.classList.remove("hidden");
  }

  galleryImages = v.gallery_images ? [...v.gallery_images] : [];
  galleryFiles = v.gallery_files ? [...v.gallery_files] : [];
  renderGallery();

  editIndex = index;

  variantFormWrapper.classList.remove("hidden");
  addVariantBtn.style.display = "none";
};


/* -----------------------------
   DELETE VARIANT
----------------------------- */

window.deleteVariant = function(index) {

  showConfirm("Delete this variant?", () => {

    variants.splice(index, 1);

    renderVariants();

  });

};



/* -----------------------------
   CLEAR VARIANT FORM
----------------------------- */

function clearVariantForm(){

  editIndex = null;

  /* reset attributes */

 attributesContainer.innerHTML = `
  <div class="attribute-row">
    <input type="text" class="attr-type form-control small" maxlength="30" placeholder="Attribute">
    <input type="text" class="attr-value form-control small" maxlength="50" placeholder="Value">
    <button type="button" class="attr-remove">Remove</button>
  </div>
 `;


  /* reset inputs */

  priceInput.value = "";
  stockInput.value = "";

  /* reset main image */

  currentMainImageFile = null;
  currentMainImagePreview = "";

  mainImagePreview.src = "";
  mainImagePreviewWrapper.classList.add("hidden");
  mainImageUpload.classList.remove("hidden");

  /* reset gallery */

  galleryImages = [];
  galleryFiles = [];
  renderGallery();


}


function setProductSubmittingState(isSubmitting, isEditMode) {
  if (!saveProductBtn) return;

  saveProductBtn.disabled = isSubmitting;
  saveProductBtn.style.pointerEvents = isSubmitting ? "none" : "auto";
  saveProductBtn.textContent = isSubmitting
    ? (isEditMode ? "Updating..." : "Saving...")
    : (isEditMode ? "Update Product" : "Save Product");
}



/* -----------------------------
   SAVE PRODUCT
----------------------------- */

saveProductBtn.onclick = async () => {
  const productId = productIdInput.value;
  const isEditMode = Boolean(productId);

  if (isProductSubmitting) return;

  clearProductErrors();

  let isValid = true;

  if (!productName.value.trim()) {
    setFieldError(
      productName,
      document.getElementById("productNameError"),
      "Product name is required"
    );
    isValid = false;
  }

  if (productName.value.trim().length > 120) {
    setFieldError(
      productName,
      document.getElementById("productNameError"),
      "Product name must be 120 characters or fewer",
    );
    isValid = false;
  }


  if (!categorySelect.value) {
    setFieldError(
      categorySelect,
      document.getElementById("categoryError"),
      "Please select a category"
    );
    isValid = false;
  }

  if (!brandSelect.value) {
    setFieldError(
      brandSelect,
      document.getElementById("brandError"),
      "Please select a brand"
    );
    isValid = false;
  }


  if (!variants.length) {
    document.getElementById("variantsError").textContent =
      "Add at least one variant";
    isValid = false;
  }

  if (!isValid) return;

  isProductSubmitting = true;
  setProductSubmittingState(true, isEditMode);

  const formData = new FormData();


  formData.append("product_name", productName.value);
  formData.append("description", description.value);
  formData.append("specifications", specifications.value);
  formData.append("category_id", categorySelect.value);
  formData.append("brand_id", brandSelect.value);


  if (isEditMode) {
    formData.append("isActive", "true");
  }

  const variantMeta = [];

  variants.forEach((v, index) => {
    const existingGalleryImages = v.gallery_images.filter(
      (img, i) => img && !v.gallery_files[i]
    );

    const newGalleryFiles = v.gallery_files.filter(Boolean);

    variantMeta.push({
      _id: v._id || null,
      attributes: v.attributes,
      price: v.price,
      stock: v.stock,
      existing_main_image: v.main_image_file ? null : (v.main_image_preview || null),
      has_new_main_image: Boolean(v.main_image_file),
      existing_gallery_images: existingGalleryImages,
      new_gallery_count: newGalleryFiles.length
    });

    if (v.main_image_file) {
      formData.append(
        "main_images",
        v.main_image_file,
        `main_${index}.jpg`
      );
    }

    newGalleryFiles.forEach((file, i) => {
      formData.append(
        "gallery_images",
        file,
        `gallery_${index}_${i}.jpg`
      );
    });
  });

  formData.append("variants", JSON.stringify(variantMeta));

  const url = isEditMode
    ? `/admin/products/${productId}`
    : "/admin/products";

  const method = isEditMode ? "PATCH" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (!data.success) {
      showAlertModal(data.message || "Failed to save product");
      return;
    }

    sessionStorage.setItem(
      "toast",
      JSON.stringify({
        message: isEditMode
          ? "Product updated successfully."
          : "Product created successfully.",
        type: "success",
      }),
    );

    window.location.href = "/admin/products-list";
  } catch (error) {
    showAlertModal("Failed to save product");
  }finally {
    isProductSubmitting = false;
    setProductSubmittingState(false, isEditMode);
  }

};




cancelVariantBtn.onclick = function(){
  addVariantBtn.style.display = "inline-block";
  variantFormWrapper.classList.add("hidden");

  document.getElementById("variantPrice").value = "";
  document.getElementById("variantStock").value = "";

  document.getElementById("attributesContainer").innerHTML = `
  <div class="attribute-row">
    <input type="text" class="attr-type form-control small" maxlength="30" placeholder="Attribute">
    <input type="text" class="attr-value form-control small" maxlength="50" placeholder="Value">
    <button type="button" class="attr-remove">Remove</button>
  </div>
  `;


  /* clear main image */

  mainImagePreview.src = "";
  mainImagePreviewWrapper.classList.add("hidden");
  mainImageUpload.classList.remove("hidden");


  /* clear gallery images */

  currentMainImageFile = null;
  currentMainImagePreview = "";

  galleryImages = [];
  galleryFiles = [];
  renderGallery();

};




/* -----------------------------
   INIT
----------------------------- */

async function initProductForm() {
  await loadCategories();
  await loadBrands();
  renderGallery();
  updateProductCounts();
  await loadProductForEdit();
}

initProductForm();