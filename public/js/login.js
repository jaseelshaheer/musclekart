document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  // password eye visibility
  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
      const input = icon.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  const emailInput = form.querySelector('input[name="email"]');
  const passwordInput = form.querySelector('input[name="password"]');

  emailInput.addEventListener("input", () => {
    removeFieldError(emailInput);
    formMessage.textContent = "";
  });

  passwordInput.addEventListener("input", () => {
    removeFieldError(passwordInput);
    formMessage.textContent = "";
  });

  const formMessage = document.createElement("div");
  formMessage.className = "form-message";
  form.insertBefore(formMessage, form.firstChild);

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
    removeFieldError(emailInput);
    removeFieldError(passwordInput);
  }

  function showFormError(message) {
    formMessage.style.color = "#dc2626";
    formMessage.textContent = message;
  }

  function validate() {
    clearErrors();
    let valid = true;

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, "Email is required");
      valid = false;
    }else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
      showFieldError(emailInput, "Invalid email format Ex: user@email.com");
      valid = false;
    }

    if (!passwordInput.value.trim()) {
      showFieldError(passwordInput, "Password is required");
      valid = false;
    }

    return valid;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message);
      }

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("role", "user");

      sessionStorage.setItem(
        "toast",
        JSON.stringify({
          message: "Welcome back!",
          type: "success",
        })
      );

      window.location.replace("/home");

    } catch (err) {
      clearErrors();
      formMessage.textContent = "";

      const message = err.message;

      if (message === "User not found") {
        showFieldError(emailInput, "Email not registered.");
        return;
      }

      if (message === "Invalid password") {
        showFieldError(passwordInput, "Incorrect password.");
        return;
      }

      if (message === "User is blocked") {
        showFormError("Your account is blocked. Contact support.");
        return;
      }

      // fallback
      showFormError(message);
    }
  });
});


