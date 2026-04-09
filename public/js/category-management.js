if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin/login";
}

let currentCategories = [];

let page = 1;
let totalPages = 1;
const limit = 10;

const table = document.getElementById("categoryTable");
const searchInput = document.getElementById("searchInput");
const pageInfo = document.getElementById("pageInfo");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const clearBtn = document.getElementById("clearSearch");

const categoryNameError = document.getElementById("categoryNameError");
const categoryNameCount = document.getElementById("categoryNameCount");
const categoryDescriptionCount = document.getElementById("categoryDescriptionCount");
const categoryOfferIsActive = document.getElementById("categoryOfferIsActive");
const categoryOfferFields = document.getElementById("categoryOfferFields");
const categoryOfferDiscountType = document.getElementById("categoryOfferDiscountType");
const categoryOfferDiscountValue = document.getElementById("categoryOfferDiscountValue");
const categoryOfferStartDate = document.getElementById("categoryOfferStartDate");
const categoryOfferExpiryDate = document.getElementById("categoryOfferExpiryDate");

/* =========================
   CATEGORY MODAL
========================= */

const modal = document.getElementById("categoryModal");
const form = document.getElementById("categoryForm");

const idInput = document.getElementById("categoryId");
const nameInput = document.getElementById("categoryName");
const descInput = document.getElementById("categoryDescription");

const modalTitle = document.getElementById("modalTitle");

function updateCategoryCounts() {
  if (categoryNameCount) {
    categoryNameCount.textContent = `${nameInput.value.length} / 50`;
  }

  if (categoryDescriptionCount) {
    categoryDescriptionCount.textContent = `${descInput.value.length} / 200`;
  }
}

nameInput.addEventListener("input", () => {
  updateCategoryCounts();
  nameInput.classList.remove("input-error");
  if (categoryNameError) {
    categoryNameError.textContent = "";
  }
});

descInput.addEventListener("input", () => {
  updateCategoryCounts();
});

categoryOfferDiscountType?.addEventListener("change", () => {
  categoryOfferDiscountType.classList.remove("input-error");
  document.getElementById("categoryOfferDiscountTypeError").textContent = "";
});

categoryOfferDiscountValue?.addEventListener("input", () => {
  categoryOfferDiscountValue.classList.remove("input-error");
  document.getElementById("categoryOfferDiscountValueError").textContent = "";
});

categoryOfferStartDate?.addEventListener("input", () => {
  categoryOfferStartDate.classList.remove("input-error");
  document.getElementById("categoryOfferStartDateError").textContent = "";
});

categoryOfferExpiryDate?.addEventListener("input", () => {
  categoryOfferExpiryDate.classList.remove("input-error");
  document.getElementById("categoryOfferExpiryDateError").textContent = "";
});

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

async function loadCategories() {
  const token = getAdminToken();

  if (!token) {
    await confirmAction("Admin session expired. Please login again.");
    window.location.href = "/admin/login";
    return;
  }

  const search = searchInput.value;

  const res = await fetch(`/admin/categories?page=${page}&limit=${limit}&search=${search}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) return;

  currentCategories = data.data.categories;

  table.innerHTML = "";

  data.data.categories.forEach((cat, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${(page - 1) * limit + index + 1}</td>

      <td>${cat.name}</td>

      <td>${cat.description || "-"}</td>

      <td>
        <span class="${cat.isActive ? "status-active" : "status-blocked"}">
          ${cat.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td>

        <button
          class="${cat.isActive ? "btn-deactivate" : "btn-activate"}"
          onclick="toggleCategoryStatus('${cat._id}', ${cat.isActive})"
        >
          ${cat.isActive ? "Deactivate" : "Activate"}
        </button>

        <button
            class="btn-edit"
            onclick="openEditModal('${cat._id}')"
          >
            Edit
        </button>

        <button
          class="btn-delete"
          onclick="deleteCategory('${cat._id}')"
        >
          Delete
        </button>

      </td>
    `;

    table.appendChild(tr);
  });

  pageInfo.textContent = `Page ${data.data.currentPage} of ${data.data.totalPages}`;

  totalPages = data.data.totalPages;
}

/* =========================
   TOGGLE CATEGORY STATUS
========================= */

function toggleCategoryStatus(categoryId, isActive) {
  showConfirm(isActive ? "Deactivate this category?" : "Activate this category?", async () => {
    const res = await fetch(`/admin/categories/${categoryId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`
      }
    });

    const data = await res.json();

    if (!data.success) {
      showAlertModal(data.message || "Failed to update category status");
      return;
    }

    showToast(
      isActive ? "Category deactivated successfully." : "Category activated successfully.",
      "success"
    );

    loadCategories();
  });
}

function toggleCategoryOfferFields() {
  if (!categoryOfferFields || !categoryOfferIsActive) return;

  categoryOfferFields.classList.toggle("hidden", !categoryOfferIsActive.checked);
}

categoryOfferIsActive?.addEventListener("change", () => {
  toggleCategoryOfferFields();
});

/* =========================
   DELETE CATEGORY
========================= */

function deleteCategory(categoryId) {
  showConfirm("Delete this category?", async () => {
    const res = await fetch(`/admin/categories/${categoryId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`
      }
    });

    const data = await res.json();

    if (!data.success) {
      showAlertModal(data.message || "Failed to delete category");
      return;
    }

    showToast("Category deleted successfully.", "success");
    loadCategories();
  });
}

/* =========================
   SEARCH
========================= */

searchInput.addEventListener("input", () => {
  page = 1;
  loadCategories();
});

clearBtn.onclick = () => {
  searchInput.value = "";
  page = 1;
  loadCategories();
};

/* =========================
   PAGINATION
========================= */

prevBtn.onclick = () => {
  if (page > 1) {
    page--;
    loadCategories();
  }
};

nextBtn.onclick = () => {
  if (page < totalPages) {
    page++;
    loadCategories();
  }
};

document.getElementById("addCategoryBtn").onclick = () => {
  modal.classList.remove("hidden");

  modalTitle.textContent = "Add Category";

  idInput.value = "";
  nameInput.value = "";
  descInput.value = "";

  categoryOfferIsActive.checked = false;
  categoryOfferDiscountType.value = "";
  categoryOfferDiscountValue.value = "";
  categoryOfferStartDate.value = "";
  categoryOfferExpiryDate.value = "";
  toggleCategoryOfferFields();

  clearValidation();
  updateCategoryCounts();
};

document.getElementById("closeModalBtn").onclick = () => {
  modal.classList.add("hidden");

  clearValidation();

  updateCategoryCounts();
};

function formatDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function openEditModal(id) {
  const category = currentCategories.find((cat) => cat._id === id);
  if (!category) return;

  modal.classList.remove("hidden");
  modalTitle.textContent = "Edit Category";

  idInput.value = category._id;
  nameInput.value = category.name || "";
  descInput.value = category.description || "";

  categoryOfferIsActive.checked = Boolean(category.offer_is_active);
  categoryOfferDiscountType.value = category.offer_discount_type || "";
  categoryOfferDiscountValue.value = category.offer_discount_value
    ? String(category.offer_discount_value)
    : "";
  categoryOfferStartDate.value = formatDateTimeLocal(category.offer_start_date);
  categoryOfferExpiryDate.value = formatDateTimeLocal(category.offer_expiry_date);

  clearValidation();
  updateCategoryCounts();
  toggleCategoryOfferFields();
}

/* =========================
   VALIDATION
========================= */

function clearValidation() {
  if (categoryNameError) {
    categoryNameError.textContent = "";
  }

  [
    "categoryOfferDiscountTypeError",
    "categoryOfferDiscountValueError",
    "categoryOfferStartDateError",
    "categoryOfferExpiryDateError"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });

  categoryOfferDiscountType?.classList.remove("input-error");
  categoryOfferDiscountValue?.classList.remove("input-error");
  categoryOfferStartDate?.classList.remove("input-error");
  categoryOfferExpiryDate?.classList.remove("input-error");

  nameInput.classList.remove("input-error");
}

function showError(input, message) {
  input.classList.add("input-error");

  if (input === nameInput && categoryNameError) {
    categoryNameError.textContent = message;
  }
}

function showOfferFieldError(input, errorId, message) {
  input?.classList.add("input-error");

  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = message;
  }
}

/* =========================
   CREATE / UPDATE CATEGORY
========================= */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearValidation();

  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  let isValid = true;

  if (!name) {
    showError(nameInput, "Category name is required");
    isValid = false;
  }

  if (name.length > 50) {
    showError(nameInput, "Category name must be 50 characters or fewer");
    isValid = false;
  }

  if (categoryOfferIsActive.checked) {
    if (!["flat", "percentage"].includes(categoryOfferDiscountType.value)) {
      showOfferFieldError(
        categoryOfferDiscountType,
        "categoryOfferDiscountTypeError",
        "Select a valid offer type"
      );
      isValid = false;
    }

    if (Number(categoryOfferDiscountValue.value || 0) <= 0) {
      showOfferFieldError(
        categoryOfferDiscountValue,
        "categoryOfferDiscountValueError",
        "Offer value must be greater than 0"
      );
      isValid = false;
    }

    if (
      categoryOfferDiscountType.value === "percentage" &&
      Number(categoryOfferDiscountValue.value || 0) > 100
    ) {
      showOfferFieldError(
        categoryOfferDiscountValue,
        "categoryOfferDiscountValueError",
        "Percentage offer cannot exceed 100"
      );
      isValid = false;
    }

    if (!categoryOfferStartDate.value) {
      showOfferFieldError(
        categoryOfferStartDate,
        "categoryOfferStartDateError",
        "Offer start date is required"
      );
      isValid = false;
    }

    if (!categoryOfferExpiryDate.value) {
      showOfferFieldError(
        categoryOfferExpiryDate,
        "categoryOfferExpiryDateError",
        "Offer expiry date is required"
      );
      isValid = false;
    }

    if (
      categoryOfferStartDate.value &&
      categoryOfferExpiryDate.value &&
      new Date(categoryOfferExpiryDate.value) <= new Date(categoryOfferStartDate.value)
    ) {
      showOfferFieldError(
        categoryOfferExpiryDate,
        "categoryOfferExpiryDateError",
        "Expiry date must be after start date"
      );
      isValid = false;
    }
  }

  if (!isValid) return;

  const payload = {
    name,
    description,
    offer_is_active: categoryOfferIsActive.checked,
    offer_discount_type: categoryOfferIsActive.checked ? categoryOfferDiscountType.value : null,
    offer_discount_value: categoryOfferIsActive.checked
      ? Number(categoryOfferDiscountValue.value || 0)
      : 0,
    offer_start_date: categoryOfferIsActive.checked ? categoryOfferStartDate.value : null,
    offer_expiry_date: categoryOfferIsActive.checked ? categoryOfferExpiryDate.value : null
  };

  const token = getAdminToken();
  const id = idInput.value;

  let res;

  if (id) {
    res = await fetch(`/admin/categories/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } else {
    res = await fetch("/admin/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  }

  const data = await res.json();

  if (!data.success) {
    showAlertModal(data.message || "Failed to save category");
    return;
  }

  modal.classList.add("hidden");

  showToast(id ? "Category updated successfully." : "Category created successfully.", "success");

  loadCategories();
});

loadCategories();
