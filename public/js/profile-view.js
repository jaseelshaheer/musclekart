document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  try {
    const res = await fetch("/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    const user = data.data;

    if (user.authProvider === "google") {
      const changeBtn = document.getElementById("openEmailBtn");
      if (changeBtn) changeBtn.style.display = "none";
    }

    document.getElementById("profileHeaderName").textContent =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";


    // Update fields
    document.getElementById("profileFirstName").textContent =
      user.firstName || "-";

    document.getElementById("profileLastName").textContent =
      user.lastName || "-";

    document.getElementById("profilePhone").textContent =
      user.phone || "-";

    document.getElementById("currentEmail").textContent =
      user.email || "-";

    const profileImg = document.querySelector(".profile-header img");

    if (profileImg && user.profileImage) {
      profileImg.src = user.profileImage;
    }

  } catch (err) {
    console.error(err);
  }
});

