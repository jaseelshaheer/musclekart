document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  if (!form) return;

  // password visibility
  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
      const input = icon.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
    });
  });
  

  const passwordInput = form.querySelector("input[name='password']");
  const confirmInput = form.querySelector("input[name='confirmPassword']");

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


  passwordInput.addEventListener("input", () => {
    const value = passwordInput.value.trim();

    removeStrengthMessage(passwordInput);

    if (!value) return;

    const result = evaluatePasswordStrength(value);

    if (result.level === "weak") {
      showStrengthMessage(passwordInput, result.text, "password-weak");
    }

    if (result.level === "medium") {
      showStrengthMessage(passwordInput, result.text, "password-medium");
    }

    if (result.level === "strong") {
      showStrengthMessage(passwordInput, result.text, "password-strong");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const password = passwordInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    const email = sessionStorage.getItem("resetEmail");
    const resetVerified = sessionStorage.getItem("resetVerified");

    if (!email || !resetVerified) {
      window.location.href = "/forgot-password";
      return;
    }
    
    if (!password || !confirmPassword) {
      showFieldError(confirmInput, "*Required");
      showFieldError(passwordInput, "*Required");
      return;
    }

    if (password !== confirmPassword) {
      showFieldError(confirmInput, "Passwords do not match");
      return;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPasswordRegex.test(password)) {
      showFieldError(
        passwordInput,
        "Password must be 8+ chars with uppercase, lowercase, number & special character"
      );
      return;
    }

    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        showFormError(data.message);
        return;
      }

      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("resetVerified");

      window.location.href = "/login";

    } catch {
      showFormError("Something went wrong. Please try again.");
    }
  });
});

/* ---------- HELPERS ---------- */

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
  let box = document.getElementById("formError");

  if (!box) {
    box = document.createElement("div");
    box.id = "formError";
    box.className = "field-error";
    document.getElementById("resetPasswordForm").appendChild(box);
  }

  box.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(el => el.remove());
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
}

