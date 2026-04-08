const otpInputs = document.querySelectorAll(".otp-box");
const otpForm = document.getElementById("otpForm");
const otpTimer = document.getElementById("otpTimer");
const resendBtn = document.getElementById("resendBtn");
const otpError = document.getElementById("otpError");

let timeLeft = 30;

otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    if (input.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});


const timerInterval = setInterval(() => {
  timeLeft--;
  otpTimer.textContent = timeLeft;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    resendBtn.disabled = false;
    otpTimer.textContent = "0";
  }
}, 1000);

otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  otpError.textContent = "";

  const otp = Array.from(otpInputs)
    .map((input) => input.value)
    .join("");

  if (otp.length !== 6) {
    otpError.textContent = "Please enter complete OTP";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  let email =
    type === "reset"
      ? sessionStorage.getItem("resetEmail")
      : sessionStorage.getItem("signupEmail");

  if (!email) {
    email = document.getElementById("otpEmail").value || null;
  }

  if (!email) {
    otpError.textContent = "Session expired. Please signup again.";
    otpForm.querySelector("button[type='submit']").disabled = true;
  }

  if (!email) {
    email = params.get("email");
  }


  try {
    const res = await fetch("/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, type }),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    if (type === "reset") {
      sessionStorage.setItem("resetVerified", "true");
      window.location.href = "/reset-password";
    }else {
      if (type === "signup") {
        const referralUsed = sessionStorage.getItem("signupReferralUsed") === "true";

        sessionStorage.setItem(
          "toast",
          JSON.stringify({
            message: referralUsed
              ? "Account created. Referral applied successfully. Welcome coupon unlocked."
              : "Account created successfully. Please login.",
            type: "success",
          })
        );

        sessionStorage.removeItem("signupReferralUsed");

        window.location.href = "/login";
      }

      if (type === "reset") {
        sessionStorage.setItem(
          "toast",
          JSON.stringify({
            message: "OTP verified. Please set your new password.",
            type: "success",
          })
        );

        window.location.href = "/reset-password";
      }
    }
  } catch (err) {
    otpError.style.color = "#dc2626";
    otpError.textContent = err.message;
  }
});

resendBtn.addEventListener("click", async () => {
  resendBtn.disabled = true;

  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  const email =
    type === "reset"
      ? sessionStorage.getItem("resetEmail")
      : sessionStorage.getItem("signupEmail");

  if (!email) {
    otpError.style.color = "#dc2626";
    otpError.textContent = "Session expired. Please try again.";
    return;
  }

  try {
    const res = await fetch("/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    otpInputs.forEach(input => (input.value = ""));

    otpInputs[0].focus();

    timeLeft = 30;
    otpTimer.textContent = "30";

    const newTimer = setInterval(() => {
      timeLeft--;
      otpTimer.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(newTimer);
        resendBtn.disabled = false;
        otpTimer.textContent = "0";
      }
    }, 1000);

    otpError.style.color = "#16a34a";
    otpError.textContent = "OTP resent successfully";

  } catch (err) {
    otpError.style.color = "#dc2626";
    otpError.textContent = err.message;
    resendBtn.disabled = false;
  }
});


