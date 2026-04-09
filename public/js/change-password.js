document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("changePasswordForm");
  const msg = document.getElementById("changePasswordMsg");

  if (!form) return;

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  // password visibility
  document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", () => {
      const input = icon.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  function removeStrengthMessage(input) {
    const existing = input.parentElement.querySelector(".password-strength");
    if (existing) existing.remove();
  }

  function showStrengthMessage(input, text, className) {
    removeStrengthMessage(input);

    const msg = document.createElement("small");
    msg.className = `password-strength ${className}`;
    msg.textContent = text;

    input.parentElement.appendChild(msg);
  }

  function evaluatePasswordStrength(password) {
    const lengthValid = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (!lengthValid || score <= 1) {
      return { level: "weak", text: "Weak password" };
    }

    if (score === 2 || score === 3) {
      return { level: "medium", text: "Medium strength password" };
    }

    if (lengthValid && score === 4) {
      return { level: "strong", text: "Strong password ✓" };
    }
  }

  form.newPassword.addEventListener("input", () => {
    const value = form.newPassword.value.trim();

    removeStrengthMessage(form.newPassword);

    if (!value) return;

    const result = evaluatePasswordStrength(value);

    if (result.level === "weak") {
      showStrengthMessage(form.newPassword, result.text, "password-weak");
    }

    if (result.level === "medium") {
      showStrengthMessage(form.newPassword, result.text, "password-medium");
    }

    if (result.level === "strong") {
      showStrengthMessage(form.newPassword, result.text, "password-strong");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    msg.textContent = "";

    const currentPassword = form.currentPassword.value.trim();
    const newPassword = form.newPassword.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showFormError("All fields are required");
      return;
    }

    if (newPassword === currentPassword) {
      showFieldError(form.newPassword, "New password cannot be same as current password");
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      showFieldError(
        form.newPassword,
        "Password must be 8+ chars with uppercase, lowercase, number & special character"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showFieldError(form.confirmPassword, "Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/user/profile/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (!data.success) {
        showToast(data.message, "error");
        return;
      }

      msg.style.color = "#16a34a";
      showToast("Password updated successfully", "success");
      form.reset();
    } catch {
      showFormError("Something went wrong. Please try again.");
    }
  });
});

function showFieldError(input, message) {
  input.classList.add("input-error");

  let error = input.parentElement.querySelector(".field-error");
  if (!error) {
    error = document.createElement("div");
    error.className = "field-error";
    input.parentElement.appendChild(error);
  }

  error.textContent = message;
}

function showFormError(message) {
  const msg = document.getElementById("changePasswordMsg");
  msg.style.color = "#dc2626";
  msg.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((el) => el.remove());
  document.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
}
