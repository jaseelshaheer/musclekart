document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  const form = document.getElementById("profileEditForm");
  const previewImage = document.getElementById("previewImage");

  const firstNameInput = form.querySelector("input[name='firstName']");
  const lastNameInput = form.querySelector("input[name='lastName']");
  const phoneInput = form.querySelector("input[name='phone']");
  const emailInput = document.getElementById("currentEmail");


  try {
    const res = await fetch("/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!data.success) throw new Error();

    const user = data.data;

    if (user.authProvider === "google") {
      const changeBtn = document.getElementById("openEmailBtn");
      if (changeBtn) changeBtn.style.display = "none";
    }

    firstNameInput.value = user.firstName || "";
    lastNameInput.value = user.lastName || "";
    phoneInput.value = user.phone || "";
    emailInput.value = user.email || "";

    if (user.profileImage) {
      previewImage.src = user.profileImage;
    }

  } catch {
    window.location.href = "/login";
  }


  form.profileImage?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      previewImage.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  
  // submit of profile edit,
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const res = await fetch("/user/profile/edit", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      sessionStorage.setItem(
        "toast",
        JSON.stringify({
          message: "Profile updated successfully.",
          type: "success",
        })
      );

      window.location.href = "/profile";

    } catch (err) {
      showAlertModal(err.message || "Failed to update profile");
    }
  });

});


