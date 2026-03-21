document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");
  const errorEl = document.getElementById("adminLoginError");

  if (localStorage.getItem("adminToken")) {
    window.location.replace("/admin/dashboard");
  }

  if (!form) return;

  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
      const input = icon.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value.trim();

    errorEl.textContent = "";

    if (!email || !password) {
      errorEl.textContent = "Email and password are required";
      return;
    }

    try {
      const res = await fetch("/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Admin login failed");
      }

      localStorage.setItem("adminToken", data.data.token);
      localStorage.setItem("role", "admin");

      window.location.replace("/admin/dashboard");

    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
});

