if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin/login";
}

let page = 1;
let totalPages = 1;
const limit = 10;

const table = document.getElementById("brandTable");
const searchInput = document.getElementById("searchInput");
const pageInfo = document.getElementById("pageInfo");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const clearBtn = document.getElementById("clearSearch");

const brandNameError = document.getElementById("brandNameError");
const brandNameCount = document.getElementById("brandNameCount");


/* MODAL */

const modal=document.getElementById("brandModal");
const form=document.getElementById("brandForm");

const idInput=document.getElementById("brandId");
const nameInput=document.getElementById("brandName");

const modalTitle=document.getElementById("modalTitle");



function clearBrandValidation() {
  nameInput.classList.remove("input-error");
  if (brandNameError) brandNameError.textContent = "";
}

function showBrandError(message) {
  nameInput.classList.add("input-error");
  if (brandNameError) brandNameError.textContent = message;
}

function updateBrandCount() {
  if (brandNameCount) {
    brandNameCount.textContent = `${nameInput.value.length} / 50`;
  }
}

nameInput.addEventListener("input", () => {
  clearBrandValidation();
  updateBrandCount();
});


function getAdminToken() {
  return localStorage.getItem("adminToken");
}



async function loadBrands(){

  const token = getAdminToken();

  const search = searchInput.value;

  const res = await fetch(
    `/admin/brands?page=${page}&limit=${limit}&search=${search}`,
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  if(!data.success) return;

  table.innerHTML = "";

  data.data.brands.forEach((brand,index)=>{

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${(page - 1) * limit + index + 1}</td>

      <td>${brand.name}</td>

      <td>
        <span class="${brand.status ? "status-active":"status-blocked"}">
          ${brand.status ? "Active":"Inactive"}
        </span>
      </td>

      <td>

        <button
          class="${brand.status ? "btn-deactivate":"btn-activate"}"
          onclick="toggleBrandStatus('${brand._id}',${brand.status})"
        >
          ${brand.status ? "Deactivate":"Activate"}
        </button>

        <button
          class="btn-edit"
          onclick="openEditModal('${brand._id}','${brand.name}')"
        >
          Edit
        </button>

        <button
          class="btn-delete"
          onclick="deleteBrand('${brand._id}')"
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



function toggleBrandStatus(brandId, status) {
  showConfirm(
    status ? "Deactivate this brand?" : "Activate this brand?",
    async () => {
      const res = await fetch(`/admin/brands/${brandId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      });

      const data = await res.json();

      if (!data.success) {
        showAlertModal(data.message || "Failed to update brand status");
        return;
      }

      showToast(
        status ? "Brand deactivated successfully." : "Brand activated successfully.",
        "success"
      );

      loadBrands();
    }
  );
}




function deleteBrand(brandId) {
  showConfirm("Delete this brand?", async () => {
    const res = await fetch(`/admin/brands/${brandId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });

    const data = await res.json();

    if (!data.success) {
      showAlertModal(data.message || "Failed to delete brand");
      return;
    }

    showToast("Brand deleted successfully.", "success");
    loadBrands();
  });
}



/* SEARCH */

searchInput.addEventListener("input",()=>{
  page=1;
  loadBrands();
});

clearBtn.onclick=()=>{
  searchInput.value="";
  page=1;
  loadBrands();
};



/* PAGINATION */

prevBtn.onclick=()=>{
  if(page>1){
    page--;
    loadBrands();
  }
};

nextBtn.onclick=()=>{
  if(page<totalPages){
    page++;
    loadBrands();
  }
};



document.getElementById("addBrandBtn").onclick=()=>{

  modal.classList.remove("hidden");

  modalTitle.textContent="Add Brand";

  idInput.value="";
  nameInput.value="";

  clearBrandValidation();
  updateBrandCount();

};



document.getElementById("closeModalBtn").onclick = () => {
  modal.classList.add("hidden");
  clearBrandValidation();
  updateBrandCount();
};




function openEditModal(id,name){

  modal.classList.remove("hidden");

  modalTitle.textContent="Edit Brand";

  idInput.value=id;
  nameInput.value=name;

  clearBrandValidation();
  updateBrandCount();

}



/* CREATE / UPDATE */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearBrandValidation();

  const name = nameInput.value.trim();
  const token = getAdminToken();
  const id = idInput.value;

  if (!name) {
    showBrandError("Brand name is required");
    return;
  }

  const payload = { name };

  let res;


  if (id) {
    res = await fetch(`/admin/brands/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } else {
    res = await fetch("/admin/brands", {
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
    showAlertModal(data.message || "Failed to save brand");
    return;
  }

  modal.classList.add("hidden");

  showToast(
    id ? "Brand updated successfully." : "Brand created successfully.",
    "success"
  );

  loadBrands();

});




loadBrands();