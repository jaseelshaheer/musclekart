document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("addressList");
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  loadAddresses();

  async function loadAddresses() {
    container.innerHTML = `<p>Loading addresses...</p>`;

    try {
      const res = await fetch("/user/address", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      renderAddresses(data.data);
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="error-text">${err.message}</p>
        </div>
      `;
    }
  }

  function renderAddresses(addresses) {
    if (!addresses.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No addresses found.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = addresses
      .map(
        (address) => `
      <div class="address-card ${address.isDefault ? "default" : ""}">
        ${address.isDefault ? `<span class="default-badge">Default</span>` : ""}

        <h4>${address.name}</h4>
        <p>${address.house}, ${address.district}</p>
        <p>${address.state} - ${address.pincode}</p>
        <p>Phone: ${address.phone}</p>
        <p>Type: ${address.addressType}</p>

        <div class="address-actions">
          <a href="/addresses/${address._id}/edit" class="secondary-btn small">
            Edit
          </a>

          ${
            !address.isDefault
              ? `
            <button class="btn-set-default" data-id="${address._id}">
              Set Default
            </button>
          `
              : ""
          }

          <button class="btn-delete danger-btn" data-id="${address._id}">
            Delete
          </button>
        </div>
      </div>
    `
      )
      .join("");

    attachActionListeners();
  }

  function attachActionListeners() {
    // DELETE
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        const confirmed = await confirmAction("Delete this address?");
        if (!confirmed) return;

        try {
          const res = await fetch(`/user/address/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const data = await res.json();

          if (!data.success) {
            throw new Error(data.message);
          }
          showToast("Address deleted successfully.", "success");
          loadAddresses();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    // SET DEFAULT
    document.querySelectorAll(".btn-set-default").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        try {
          const res = await fetch(`/user/address/${id}/default`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const data = await res.json();

          if (!data.success) {
            throw new Error(data.message);
          }
          showToast("Default address updated.", "success");
          loadAddresses();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }
});
