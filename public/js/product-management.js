if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin/login";
}

let page = 1;
let totalPages = 1;
const limit = 10;

const table = document.getElementById("productTable");
const searchInput = document.getElementById("searchInput");
const pageInfo = document.getElementById("pageInfo");
const addProductBtn = document.getElementById("addProductBtn");

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

addProductBtn.onclick = () => {
  const token = getAdminToken();

  if (!token) {
    window.location.href = "/admin/login";
    return;
  }

  window.location.href = "/admin/products/create";
};

async function loadProducts() {
  const token = getAdminToken();

  if (!token) {
    await confirmAction("Admin session expired. Please login again.");
    window.location.href = "/admin/login";
    return;
  }

  const search = searchInput.value;

  const res = await fetch(`/admin/products?page=${page}&limit=${limit}&search=${search}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // if (!res.ok) {
  //   const text = await res.text();
  //   console.error("Server returned:", text);
  //   throw new Error("API error");
  // }

  const data = await res.json();

  if (!data.success) return;

  table.innerHTML = "";

  data.data.products.forEach((product) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <img src="${product.main_image || "/images/no-image.png"}"
             style="width:40px;height:40px;object-fit:cover;border-radius:6px;">
      </td>

      <td>
        <strong>${product.product_name}</strong>
      </td>

      <td>${product.category || "-"}</td>

      <td>
        ₹${product.min_price || 0} - ₹${product.max_price || 0}
      </td>

      <td>${product.total_stock || 0}</td>

      <td>
        <span class="${product.isActive ? "status-active" : "status-blocked"}">
          ${product.isActive ? "Listed" : "Unlisted"}
        </span>
      </td>

      <td>${product.brand || "-"}</td>

      <td>

        <button
          class="btn-unblock"
          onclick="editProduct('${product._id}')"
        >
          Edit
        </button>

        <button
          class="${product.isActive ? "btn-block" : "btn-unblock"}"
          onclick="toggleProductStatus('${product._id}', ${product.isActive})"
        >
          ${product.isActive ? "Unlist" : "List"}
        </button>

        <button
          class="btn-block"
          onclick="deleteProduct('${product._id}')"
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

/* -----------------------------
   TOGGLE PRODUCT STATUS
------------------------------ */

async function toggleProductStatus(productId, isActive) {
  showConfirm(isActive ? "Unlist this product?" : "List this product?", async () => {
    const res = await fetch(`/admin/products/${productId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`
      }
    });

    const data = await res.json();

    if (!data.success) {
      showAlertModal(data.message || "Failed to update product status");
      return;
    }

    showToast(
      isActive ? "Product unlisted successfully." : "Product listed successfully.",
      "success"
    );

    loadProducts();
  });
}

/* -----------------------------
   DELETE PRODUCT
------------------------------ */

async function deleteProduct(productId) {
  showConfirm("Delete this product?", async () => {
    const res = await fetch(`/admin/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAdminToken()}`
      }
    });

    const data = await res.json();

    if (!data.success) {
      showAlertModal(data.message || "Failed to delete product");
      return;
    }

    showToast("Product deleted successfully.", "success");
    loadProducts();
  });
}

/* -----------------------------
   EDIT PRODUCT
------------------------------ */

function editProduct(productId) {
  window.location.href = `/admin/products/${productId}/edit`;
}

/* -----------------------------
   PAGINATION
------------------------------ */

document.getElementById("prevBtn").onclick = () => {
  if (page > 1) {
    page--;
    loadProducts();
  }
};

document.getElementById("nextBtn").onclick = () => {
  if (page < totalPages) {
    page++;
    loadProducts();
  }
};

/* -----------------------------
   SEARCH
------------------------------ */

searchInput.addEventListener("input", () => {
  page = 1;
  loadProducts();
});

document.getElementById("clearSearch").onclick = () => {
  searchInput.value = "";
  page = 1;
  loadProducts();
};

loadProducts();
