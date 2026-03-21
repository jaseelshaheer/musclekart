document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

  // password visibility
  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
      const input = icon.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  const fields = {
    firstName: signupForm.querySelector('input[name="firstName"]'),
    lastName: signupForm.querySelector('input[name="lastName"]'),
    email: signupForm.querySelector('input[name="email"]'),
    phone: signupForm.querySelector('input[name="phone"]'),
    password: signupForm.querySelector('input[name="password"]'),
    confirmPassword: signupForm.querySelector('input[name="confirmPassword"]'),
  };
  
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
    console.log(score);

    if (!lengthValid || score <= 1) {
      return { level: "weak", text: "Weak password - Must contain 8+ characters, uppercase, lowercase, number & special character" };
    }

    if (score === 2 || score === 3) {
      return { level: "medium", text: "Medium strength password" };
    }

    if (lengthValid && score === 4) {
      return { level: "strong", text: "Strong password ✓" };
    }
  }


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
    Object.values(fields).forEach(input => removeFieldError(input));
  }

  fields.password.addEventListener("input", () => {
    const value = fields.password.value.trim();

    removeStrengthMessage(fields.password);

    if (!value) return;

    const result = evaluatePasswordStrength(value);

    if (result.level === "weak") {
      showStrengthMessage(fields.password, result.text, "password-weak");
    }

    if (result.level === "medium") {
      showStrengthMessage(fields.password, result.text, "password-medium");
    }

    if (result.level === "strong") {
      showStrengthMessage(fields.password, result.text, "password-strong");
    }
  });


  function validate(payload) {
    clearErrors();
    let valid = true;

    if (!payload.firstName.trim()) {
      showFieldError(fields.firstName, "First name is required");
      valid = false;
    }

    if (!payload.email.trim()) {
      showFieldError(fields.email, "Email is required");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      showFieldError(fields.email, "Invalid email format Ex: user@email.com");
      valid = false;
    }

    if (!/^[0-9]{10}$/.test(payload.phone)) {
      showFieldError(fields.phone, "Enter valid 10-digit mobile number");
      valid = false;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPasswordRegex.test(payload.password)) {
      showFieldError(
        fields.password,
        "Password must be 8+ chars with uppercase, lowercase, number & special character"
      );
      valid = false;
    }

    if (payload.password !== payload.confirmPassword) {
      showFieldError(fields.confirmPassword, "Passwords do not match");
      valid = false;
    }

    return valid;
  }
  
  

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      firstName: fields.firstName.value.trim(),
      lastName: fields.lastName.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim(),
      password: fields.password.value,
      confirmPassword: fields.confirmPassword.value,
    };

    if (!validate(payload)) return;

    try {
      const res = await fetch("/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.field === "phone") {
          showFieldError(fields.phone, data.message);
          return;
        }

        if (data.field === "email") {
          showFieldError(fields.email, data.message);
          return;
        }

        showFieldError(fields.firstName, data.message);
        return;
      }

      sessionStorage.setItem("signupEmail", payload.email);

      window.location.href = "/verify-otp?type=signup";

    } catch (err) {
      showFieldError(fields.firstName, "Something went wrong. Please try again.");
    }
  });
});
