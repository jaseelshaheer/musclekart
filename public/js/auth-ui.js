function showAlertAndLogout(message) {
  const modal = document.getElementById("globalAlertModal");
  const messageEl = document.getElementById("alertMessage");
  const okBtn = document.getElementById("alertOkBtn");

  messageEl.textContent = message;
  modal.classList.remove("hidden");

  okBtn.onclick = () => {
    modal.classList.add("hidden");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };
}


function showToast(message, type = "success") {
  const toast = document.getElementById("globalToast");
  const toastMsg = document.getElementById("toastMessage");

  if (!toast) return;

  toastMsg.textContent = message;

  toast.classList.remove("toast-success", "toast-error");
  toast.classList.add(type === "error" ? "toast-error" : "toast-success");

  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
  
  const toastData = sessionStorage.getItem("toast");

  if (toastData) {
    const { message, type } = JSON.parse(toastData);
    showToast(message, type);
    sessionStorage.removeItem("toast");
  }

  const path = window.location.pathname;
  const userToken = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");

  const guestUI = document.querySelector(".guest-only");
  const userUI = document.querySelector(".user-only");


  let isUserAuthenticated = false;

  if (userToken) {
    try {
      const res = await fetch("/user/profile", {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      if (res.status === 401 || res.status === 403) {
        showAlertAndLogout("Your account has been blocked by admin.");
        return;
      }

      if (res.ok) {
        isUserAuthenticated = true;
      } else {
        localStorage.removeItem("token");
      }

    } catch {
      localStorage.removeItem("token");
    }
  }

  const authPages = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-otp"
  ];

  if (isUserAuthenticated && authPages.includes(path)) {
    window.location.replace("/home");
    return;
  }

  const protectedUserPages = [
    "/profile",
    "/addresses",
    "/wishlist",
    "/cart"
  ];

  if (!isUserAuthenticated && protectedUserPages.some(route => path.startsWith(route))) {
    window.location.replace("/login");
    return;
  }

  if (!adminToken && path.startsWith("/admin") && path !== "/admin/login") {
    window.location.replace("/admin/login");
    return;
  }


  if (guestUI && userUI) {

    guestUI.classList.remove("auth-block");
    userUI.classList.remove("auth-block");

    if (isUserAuthenticated) {
      guestUI.style.display = "none";
      userUI.style.display = "flex";
    } else {
      guestUI.style.display = "flex";
      userUI.style.display = "none";
    }
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (path.startsWith("/admin")) {
        localStorage.removeItem("adminToken");
        window.location.replace("/admin/login");
      } else {
        localStorage.removeItem("token");
        window.location.replace("/home");
      }
    });
  }

});

window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});



