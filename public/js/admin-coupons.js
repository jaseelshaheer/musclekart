const couponTableContent = document.getElementById("couponTableContent");
const couponModal = document.getElementById("couponModal");
const couponForm = document.getElementById("couponForm");
const couponFormError = document.getElementById("couponFormError");

const couponSearchInput = document.getElementById("couponSearchInput");
const clearCouponSearch = document.getElementById("clearSearch");
const couponPrevBtn = document.getElementById("couponPrevBtn");
const couponNextBtn = document.getElementById("couponNextBtn");
const couponPageInfo = document.getElementById("couponPageInfo");

const couponModalTitle = document.getElementById("couponModalTitle");
const couponIdInput = document.getElementById("couponId");
const couponSubmitBtn = document.getElementById("couponSubmitBtn");



let currentCouponPage = 1;
let totalCouponPages = 1;
let couponSearchDebounce;



function getAdminToken() {
  return localStorage.getItem("adminToken");
}

function openCouponModal() {
  if (couponModalTitle) {
    couponModalTitle.textContent = "Add Coupon";
  }

  if (couponSubmitBtn) {
    couponSubmitBtn.textContent = "Create Coupon";
  }

  if (couponIdInput) {
    couponIdInput.value = "";
  }

  toggleMaxDiscountField();

  if (couponModal) couponModal.classList.remove("hidden");
}



function closeCouponModal() {
  if (couponModal) couponModal.classList.add("hidden");
  if (couponForm) couponForm.reset();
  if (couponIdInput) couponIdInput.value = "";

  if (couponModalTitle) {
    couponModalTitle.textContent = "Add Coupon";
  }

  if (couponSubmitBtn) {
    couponSubmitBtn.textContent = "Create Coupon";
  }

  toggleMaxDiscountField();

  if (couponFormError) {
    couponFormError.textContent = "";
    couponFormError.classList.add("hidden");
  }

  clearCouponFieldErrors();
}



async function loadCoupons() {
  const token = getAdminToken();

  const params = new URLSearchParams({
    page: currentCouponPage,
    limit: 10
  });

  if (couponSearchInput?.value.trim()) {
    params.set("search", couponSearchInput.value.trim());
  }

  const res = await fetch(`/admin/coupons/data?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });


  const data = await res.json();

  if (!res.ok || !data.success) {
    if (couponTableContent) {
      couponTableContent.innerHTML = `
        <div class="shop-empty">
          <h3>Unable to load coupons</h3>
          <p>${data.message || "Something went wrong."}</p>
        </div>
      `;
    }
    return;
  }

  currentCouponPage = data.data.currentPage;
  totalCouponPages = data.data.totalPages;

  renderCoupons(data.data.coupons);
  renderCouponPagination(data.data.currentPage, data.data.totalPages);

}

function renderCoupons(coupons) {
  if (!couponTableContent) return;

  if (!coupons.length) {
    couponTableContent.innerHTML = `
      <div class="shop-empty">
        <h3>No coupons found</h3>
        <p>Create your first coupon to get started.</p>
      </div>
    `;
    return;
  }

  couponTableContent.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Min Purchase</th>
            <th>Discount</th>
            <th>Usage</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>Expiry Date</th>
            <th>Action</th>
        </tr>
      </thead>

      <tbody>
        ${coupons
          .map(
            (coupon) => `
              <tr>
                <td><strong>${coupon.coupon_code}</strong></td>
                <td>${coupon.description}</td>
                <td>Rs. ${coupon.min_purchase}</td>
                <td>
                    ${
                    coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : `Rs. ${coupon.discount_value}`
                    }
                </td>
                <td>
                    ${coupon.used_count}/${coupon.usage_limit}
                    <br>
                    <small>Per user: ${coupon.usage_per_user}</small>
                </td>
                <td>
                    <span class="${
                    coupon.computed_status === "active"
                        ? "status-active"
                        : coupon.computed_status === "scheduled"
                        ? "status-scheduled"
                        : coupon.computed_status === "expired"
                            ? "status-expired"
                            : "status-blocked"
                    }">
                    ${coupon.computed_status.charAt(0).toUpperCase() + coupon.computed_status.slice(1)}
                    </span>
                </td>
                <td>${new Date(coupon.start_date).toLocaleDateString("en-IN")}</td>
                <td>${new Date(coupon.expiry_date).toLocaleDateString("en-IN")}</td>
                <td>
                    <button
                        type="button"
                        class="btn-edit btn-edit-coupon"
                        data-coupon-id="${coupon._id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="${coupon.is_active ? "btn-deactivate" : "btn-activate"} btn-toggle-coupon"
                        data-coupon-id="${coupon._id}"
                    >
                        ${coupon.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                        type="button"
                        class="btn-delete"
                        data-coupon-id="${coupon._id}"
                    >
                        Delete
                    </button>
                </td>

              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function toggleMaxDiscountField() {
  const discountType = document.getElementById("couponDiscountType")?.value;
  const maxDiscountGroup = document.getElementById("couponMaxDiscountGroup");
  const maxDiscountInput = document.getElementById("couponMaxDiscount");

  if (!maxDiscountGroup || !maxDiscountInput) return;

  if (discountType === "percentage") {
    maxDiscountGroup.classList.remove("hidden");
  } else {
    maxDiscountGroup.classList.add("hidden");
    maxDiscountInput.value = "";
  }
}


function renderCouponPagination(currentPage, totalPages) {
  const pagination = document.getElementById("couponPagination");
  if (!couponPageInfo || !couponPrevBtn || !couponNextBtn || !pagination) return;

  if (totalPages < 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";
  couponPageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  couponPrevBtn.disabled = currentPage <= 1;
  couponNextBtn.disabled = currentPage >= totalPages;
}


function getCouponFormFields() {
  return {
    coupon_code: document.getElementById("couponCode"),
    description: document.getElementById("couponDescription"),
    min_purchase: document.getElementById("couponMinPurchase"),
    discount_type: document.getElementById("couponDiscountType"),
    discount_value: document.getElementById("couponDiscountValue"),
    usage_limit: document.getElementById("couponUsageLimit"),
    usage_per_user: document.getElementById("couponUsagePerUser"),
    max_discount: document.getElementById("couponMaxDiscount"),
    start_date: document.getElementById("couponStartDate"),
    expiry_date: document.getElementById("couponExpiryDate")
  };
}


function showCouponFieldError(input, message) {
  removeCouponFieldError(input);

  if (!input) return;

  const error = document.createElement("small");
  error.className = "field-error";
  error.textContent = message;

  input.parentElement.appendChild(error);
  input.classList.add("input-error");
}

function removeCouponFieldError(input) {
  if (!input) return;

  const existing = input.parentElement.querySelector(".field-error");
  if (existing) existing.remove();

  input.classList.remove("input-error");
}

function clearCouponFieldErrors() {
  const fields = getCouponFormFields();

  Object.values(fields).forEach((input) => {
    if (input) removeCouponFieldError(input);
  });
}


function validateCouponForm() {
  const fields = getCouponFormFields();
  clearCouponFieldErrors();

  let valid = true;

  if (!fields.coupon_code?.value.trim()) {
    showCouponFieldError(fields.coupon_code, "Coupon code is required");
    valid = false;
  }

  if (!fields.description?.value.trim()) {
    showCouponFieldError(fields.description, "Description is required");
    valid = false;
  }

  if (Number(fields.min_purchase?.value || 0) < 0) {
    showCouponFieldError(fields.min_purchase, "Minimum purchase cannot be negative");
    valid = false;
  }

  if (!["flat", "percentage"].includes(fields.discount_type?.value)) {
    showCouponFieldError(fields.discount_type, "Choose a valid discount type");
    valid = false;
  }

  if (Number(fields.discount_value?.value || 0) <= 0) {
    showCouponFieldError(fields.discount_value, "Discount value must be greater than 0");
    valid = false;
  }

  if (
    fields.discount_type?.value === "percentage" &&
    Number(fields.discount_value?.value || 0) > 100
  ) {
    showCouponFieldError(fields.discount_value, "Percentage discount cannot exceed 100");
    valid = false;
  }

  if (Number(fields.usage_limit?.value || 0) <= 0) {
    showCouponFieldError(fields.usage_limit, "Usage limit must be greater than 0");
    valid = false;
  }

  if (Number(fields.usage_per_user?.value || 0) <= 0) {
    showCouponFieldError(fields.usage_per_user, "Usage per user must be greater than 0");
    valid = false;
  }

  if (
    Number(fields.usage_per_user?.value || 0) >
    Number(fields.usage_limit?.value || 0)
  ) {
    showCouponFieldError(fields.usage_per_user, "Usage per user cannot exceed usage limit");
    valid = false;
  }

  if (
    fields.discount_type?.value === "percentage" &&
    Number(fields.max_discount?.value || 0) <= 0
  ) {
    showCouponFieldError(fields.max_discount, "Max discount is required for percentage coupon");
    valid = false;
  }

  if (!fields.start_date?.value) {
    showCouponFieldError(fields.start_date, "Start date is required");
    valid = false;
  }

  if (!fields.expiry_date?.value) {
    showCouponFieldError(fields.expiry_date, "Expiry date is required");
    valid = false;
  }

  if (fields.start_date?.value && fields.expiry_date?.value) {
    const startDate = new Date(fields.start_date.value);
    const expiryDate = new Date(fields.expiry_date.value);

    if (expiryDate <= startDate) {
      showCouponFieldError(fields.expiry_date, "Expiry date must be after start date");
      valid = false;
    }
  }

  return valid;
}


function bindCouponFieldValidation() {
  const fields = getCouponFormFields();

  Object.values(fields).forEach((input) => {
    if (!input) return;

    const eventName =
      input.tagName === "SELECT" ? "change" : "input";

    input.addEventListener(eventName, () => {
      removeCouponFieldError(input);

      if (couponFormError) {
        couponFormError.textContent = "";
        couponFormError.classList.add("hidden");
      }
    });
  });
}




function getCouponPayload() {
  const discountType = document.getElementById("couponDiscountType")?.value || "flat";

  return {
    coupon_code: document.getElementById("couponCode")?.value.trim() || "",
    description: document.getElementById("couponDescription")?.value.trim() || "",
    min_purchase: document.getElementById("couponMinPurchase")?.value || 0,
    discount_type: discountType,
    discount_value: document.getElementById("couponDiscountValue")?.value || 0,
    usage_limit: document.getElementById("couponUsageLimit")?.value || 0,
    usage_per_user: document.getElementById("couponUsagePerUser")?.value || 0,
    max_discount:
      discountType === "percentage"
        ? document.getElementById("couponMaxDiscount")?.value || 0
        : 0,
    start_date: document.getElementById("couponStartDate")?.value || "",
    expiry_date: document.getElementById("couponExpiryDate")?.value || ""
  };
}


async function getCouponById(couponId) {
  const token = getAdminToken();

  const res = await fetch(`/admin/coupons/${couponId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Failed to load coupon");
    return null;
  }

  return data.data;
}

function formatDateTimeLocal(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fillCouponForm(coupon) {
  if (!coupon) return;

  if (couponModalTitle) couponModalTitle.textContent = "Edit Coupon";
  if (couponSubmitBtn) couponSubmitBtn.textContent = "Update Coupon";
  if (couponIdInput) couponIdInput.value = coupon._id;

  document.getElementById("couponCode").value = coupon.coupon_code || "";
  document.getElementById("couponDescription").value = coupon.description || "";
  document.getElementById("couponMinPurchase").value = coupon.min_purchase ?? "";
  document.getElementById("couponDiscountType").value = coupon.discount_type || "flat";
  document.getElementById("couponDiscountValue").value = coupon.discount_value ?? "";
  document.getElementById("couponUsageLimit").value = coupon.usage_limit ?? "";
  document.getElementById("couponUsagePerUser").value = coupon.usage_per_user ?? "";
  document.getElementById("couponMaxDiscount").value = coupon.max_discount ?? "";
  document.getElementById("couponStartDate").value = formatDateTimeLocal(coupon.start_date);
  document.getElementById("couponExpiryDate").value = formatDateTimeLocal(coupon.expiry_date);

  toggleMaxDiscountField();

  if (couponModal) {
    couponModal.classList.remove("hidden");
  }
}



async function createCoupon(payload) {
  const token = getAdminToken();

  const res = await fetch("/admin/coupons", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    if (couponFormError) {
      couponFormError.textContent = data.message || "Failed to create coupon";
      couponFormError.classList.remove("hidden");
    }
    return;
  }

  closeCouponModal();
  showToast(data.message || "Coupon created successfully", "success");
  loadCoupons();
}


async function updateCoupon(couponId, payload) {
  const token = getAdminToken();

  const res = await fetch(`/admin/coupons/${couponId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    if (couponFormError) {
      couponFormError.textContent = data.message || "Failed to update coupon";
      couponFormError.classList.remove("hidden");
    }
    return;
  }

  closeCouponModal();
  showToast(data.message || "Coupon updated successfully", "success");
  loadCoupons();
}



async function toggleCouponStatus(couponId) {
  const token = getAdminToken();

  const res = await fetch(`/admin/coupons/${couponId}/toggle-status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Failed to update coupon status");
    return;
  }

  showToast(data.message || "Coupon status updated", "success");
  loadCoupons();
}



async function deleteCoupon(couponId) {
  const token = getAdminToken();

  const res = await fetch(`/admin/coupons/${couponId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    showAlertModal(data.message || "Failed to delete coupon");
    return;
  }

  showToast(data.message || "Coupon deleted successfully", "success");
  loadCoupons();
}

document.getElementById("openCouponModalBtn")?.addEventListener("click", openCouponModal);
document.getElementById("cancelCouponModalBtn")?.addEventListener("click", closeCouponModal);
document.getElementById("couponModalBackdrop")?.addEventListener("click", closeCouponModal);

couponForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearCouponFieldErrors();

  if (couponFormError) {
    couponFormError.textContent = "";
    couponFormError.classList.add("hidden");
  }

  if (!validateCouponForm()) {
    return;
  }

  const payload = getCouponPayload();
  const couponId = couponIdInput?.value;

  if (couponId) {
    await updateCoupon(couponId, payload);
  } else {
    await createCoupon(payload);
  }
});



couponTableContent?.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".btn-edit-coupon");
  if (editBtn) {
    const couponId = editBtn.dataset.couponId;
    const coupon = await getCouponById(couponId);
    if (coupon) {
      fillCouponForm(coupon);
    }
    return;
  }

  const toggleBtn = e.target.closest(".btn-toggle-coupon");
  if (toggleBtn) {
    const couponId = toggleBtn.dataset.couponId;

    showConfirm("Do you want to update this coupon status?", async () => {
      await toggleCouponStatus(couponId);
    });

    return;
  }

  const deleteBtn = e.target.closest(".btn-delete");
  if (deleteBtn) {
    const couponId = deleteBtn.dataset.couponId;

    showConfirm("Do you want to delete this coupon?", async () => {
      await deleteCoupon(couponId);
    });
  }
});




document.getElementById("couponDiscountType")?.addEventListener("change", toggleMaxDiscountField);

if (couponSearchInput) {
  couponSearchInput.addEventListener("input", () => {
    clearTimeout(couponSearchDebounce);

    couponSearchDebounce = setTimeout(() => {
      currentCouponPage = 1;
      loadCoupons();
    }, 400);
  });
}

if (clearCouponSearch && couponSearchInput) {
  clearCouponSearch.addEventListener("click", () => {
    couponSearchInput.value = "";
    currentCouponPage = 1;
    loadCoupons();
  });
}


couponPrevBtn?.addEventListener("click", () => {
  if (currentCouponPage > 1) {
    currentCouponPage -= 1;
    loadCoupons();
  }
});

couponNextBtn?.addEventListener("click", () => {
  if (currentCouponPage < totalCouponPages) {
    currentCouponPage += 1;
    loadCoupons();
  }
});



toggleMaxDiscountField();
bindCouponFieldValidation();

loadCoupons();
