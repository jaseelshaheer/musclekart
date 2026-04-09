let page = 1;
let totalPages = 1;
const limit = 5;

const table = document.getElementById("userTable");
const searchInput = document.getElementById("searchInput");
const pageInfo = document.getElementById("pageInfo");

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

async function loadUsers() {
  const token = getAdminToken();

  if (!token) {
    await confirmAction("Admin session expired. Please login again.");
    window.location.href = "/admin/login";
    return;
  }

  const search = searchInput.value;

  const res = await fetch(`/admin/users?page=${page}&limit=${limit}&search=${search}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.success) return;

  table.innerHTML = "";

  data.data.users.forEach((user) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <strong>${user.firstName} ${user.lastName || ""}</strong>
      </td>

      <td>${user.email}</td>

      <td>${user.phone || "-"}</td>

      <td>
        <span class="${user.isBlocked ? "status-blocked" : "status-active"}">
          ${user.isBlocked ? "Blocked" : "Active"}
        </span>
      </td>

      <td>
        <button
          class="${user.isBlocked ? "btn-unblock" : "btn-block"}"
          onclick="toggleBlock('${user._id}', ${user.isBlocked})"
        >
          ${user.isBlocked ? "Unblock" : "Block"}
        </button>
      </td>
    `;

    table.appendChild(tr);
  });

  pageInfo.textContent = `Page ${data.data.currentPage} of ${data.data.totalPages}`;
  totalPages = data.data.totalPages;
}

function toggleBlock(userId, isBlocked) {
  showConfirm(isBlocked ? "Unblock this user?" : "Block this user?", async () => {
    const res = await fetch(`/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`
      },
      body: JSON.stringify({ isBlocked: !isBlocked })
    });

    const data = await res.json();

    if (!data.success) {
      showAlertModal(data.message || "Failed to update user status");
      return;
    }

    showToast(isBlocked ? "User unblocked successfully." : "User blocked successfully.", "success");

    loadUsers();
  });
}

document.getElementById("prevBtn").onclick = () => {
  if (page > 1) {
    page--;
    loadUsers();
  }
};

document.getElementById("nextBtn").onclick = () => {
  if (page < totalPages) {
    page++;
    loadUsers();
  }
};

searchInput.addEventListener("input", () => {
  page = 1;
  loadUsers();
});

document.getElementById("clearSearch").onclick = () => {
  searchInput.value = "";
  page = 1;
  loadUsers();
};

loadUsers();
