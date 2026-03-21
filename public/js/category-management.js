if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin/login";
}

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
});

descInput.addEventListener("input", () => {
  updateCategoryCounts();
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

  const res = await fetch(
    `/admin/categories?page=${page}&limit=${limit}&search=${search}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  if (!data.success) return;

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
          onclick="openEditModal('${cat._id}','${cat.name}','${cat.description || ""}')"
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

  pageInfo.textContent =
    `Page ${data.data.currentPage} of ${data.data.totalPages}`;

  totalPages = data.data.totalPages;
}



/* =========================
   TOGGLE CATEGORY STATUS
========================= */

function toggleCategoryStatus(categoryId, isActive) {
  showConfirm(
    isActive ? "Deactivate this category?" : "Activate this category?",
    async () => {
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
        isActive
          ? "Category deactivated successfully."
          : "Category activated successfully.",
        "success"
      );

      loadCategories();
    }
  );
}




/* =========================
   DELETE CATEGORY
========================= */

function deleteCategory(categoryId) {
  showConfirm("Delete this category?", async () => {
    const res = await fetch(`/admin/categories/${categoryId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
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

  clearValidation();
  updateCategoryCounts();
};



document.getElementById("closeModalBtn").onclick = () => {

  modal.classList.add("hidden");

  clearValidation();

  updateCategoryCounts();

};


function openEditModal(id, name, description) {

  modal.classList.remove("hidden");

  modalTitle.textContent = "Edit Category";

  idInput.value = id;
  nameInput.value = name;
  descInput.value = description;

  clearValidation();

  updateCategoryCounts();

}



/* =========================
   VALIDATION
========================= */

function clearValidation() {
  if (categoryNameError) {
    categoryNameError.textContent = "";
  }

  nameInput.classList.remove("input-error");
}



function showError(input, message) {
  input.classList.add("input-error");

  if (input === nameInput && categoryNameError) {
    categoryNameError.textContent = message;
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

  if (!isValid) return;

  const payload = { name, description };
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

  showToast(
    id
      ? "Category updated successfully."
      : "Category created successfully.",
    "success"
  );

  loadCategories();

});




loadCategories();