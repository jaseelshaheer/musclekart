document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("addressForm");
  if (!form) return;

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  const addressId = form.dataset.addressId;

  const fields = {
    name: document.getElementById("name"),
    phone: document.getElementById("phone"),
    house: document.getElementById("house"),
    country: document.getElementById("country"),
    district: document.getElementById("district"),
    state: document.getElementById("state"),
    pincode: document.getElementById("pincode"),
    landmark: document.getElementById("landmark"),
    addressType: document.getElementById("addressType"),
    isDefault: document.getElementById("isDefault")
  };

  // prefill address edit screen
  if (addressId) {
    try {
      const res = await fetch("/user/address", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!data.success) throw new Error();

      const address = data.data.find((a) => a._id === addressId);
      if (!address) return;

      fields.name.value = address.name || "";
      fields.phone.value = address.phone || "";
      fields.house.value = address.house || "";
      fields.country.value = address.country || "";
      fields.district.value = address.district || "";
      fields.state.value = address.state || "";
      fields.pincode.value = address.pincode || "";
      fields.landmark.value = address.landmark || "";
      fields.addressType.value = address.addressType || "home";
      fields.isDefault.checked = address.isDefault || false;
    } catch {
      console.error("Failed to preload address");
    }
  }

  // field error
  function showFieldError(input, message) {
    removeFieldError(input);

    const error = document.createElement("small");
    error.className = "field-error";
    error.textContent = message;

    input.parentElement.appendChild(error);
    input.classList.add("input-error");
  }

  function removeFieldError(input) {
    const existing = input.parentElement.querySelector(".field-error");
    if (existing) existing.remove();
    input.classList.remove("input-error");
  }

  function clearErrors() {
    Object.values(fields).forEach((input) => {
      if (input) removeFieldError(input);
    });
  }

  function showFormError(message) {
    let box = document.getElementById("formError");

    if (!box) {
      box = document.createElement("div");
      box.id = "formError";
      box.className = "field-error";
      form.appendChild(box);
    }

    box.textContent = message;
  }

  // validation
  function validate() {
    clearErrors();

    const formError = document.getElementById("formError");
    if (formError) formError.remove();

    let valid = true;

    if (!fields.name.value.trim()) {
      showFieldError(fields.name, "Name is required");
      valid = false;
    }

    if (!/^[0-9]{10}$/.test(fields.phone.value.trim())) {
      showFieldError(fields.phone, "Enter valid 10-digit phone number");
      valid = false;
    }

    if (!fields.house.value.trim()) {
      showFieldError(fields.house, "House is required");
      valid = false;
    }

    if (!fields.country.value.trim()) {
      showFieldError(fields.country, "Country is required");
      valid = false;
    }

    if (!fields.district.value.trim()) {
      showFieldError(fields.district, "District is required");
      valid = false;
    }

    if (!fields.state.value.trim()) {
      showFieldError(fields.state, "State is required");
      valid = false;
    }

    if (!/^[0-9]{6}$/.test(fields.pincode.value.trim())) {
      showFieldError(fields.pincode, "Enter valid 6-digit pincode");
      valid = false;
    }

    return valid;
  }
  // submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: fields.name.value.trim(),
      phone: fields.phone.value.trim(),
      house: fields.house.value.trim(),
      country: fields.country.value.trim(),
      district: fields.district.value.trim(),
      state: fields.state.value.trim(),
      pincode: fields.pincode.value.trim(),
      landmark: fields.landmark.value.trim(),
      addressType: fields.addressType.value,
      isDefault: fields.isDefault.checked
    };

    const url = addressId ? `/user/address/${addressId}` : `/user/address`;

    const method = addressId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message);
      }
      const isEdit = form.dataset.edit === "true";
      sessionStorage.setItem(
        "toast",
        JSON.stringify({
          message: isEdit ? "Address updated successfully." : "Address added successfully.",
          type: "success"
        })
      );

      window.location.href = "/addresses";
    } catch (err) {
      showFormError(err.message);
    }
  });
});
