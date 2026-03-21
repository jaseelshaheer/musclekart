document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  if (!form) return;

  const emailInput = form.querySelector("input[name='email']");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearErrors();

    const email = emailInput.value.trim();

    if (!email) {
      showFieldError(emailInput, "Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showFieldError(emailInput, "Enter a valid email address");
      return;
    }


    try {
      const res = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (!result.success) {
        showFieldError(emailInput, result.message);
        return;
      }

      sessionStorage.setItem("resetEmail", email);

      window.location.href = "/verify-otp?type=reset";

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
  let box = document.getElementById("formError");

  if (!box) {
    box = document.createElement("div");
    box.id = "formError";
    box.className = "field-error";
    document.getElementById("forgotPasswordForm").appendChild(box);
  }

  box.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(el => el.remove());
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
}
