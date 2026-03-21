document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!data.success) return;

    const user = data.data;

    if (user.authProvider === "google") {
      const changePasswordItem = document.querySelector(
        'a[href="/profile/change-password"]'
      );

      if (changePasswordItem) {
        changePasswordItem.closest("li").style.display = "none";
      }
    }

    const avatar = document.querySelector(".avatar-img");
    if (avatar) {
      avatar.src = user.profileImage || "/images/user-dp.jpg";
    }

    // Update sidebar name
    const nameEl = document.querySelector(".sidebar .name");
    if (nameEl) {
      nameEl.textContent = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
    }

  } catch (err) {
    console.error("Sidebar user load failed");
  }
});



// Sidebar logout
const sidebarLogout = document.getElementById("sidebarLogout");

if (sidebarLogout) {
  sidebarLogout.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "/login";
  });
}
