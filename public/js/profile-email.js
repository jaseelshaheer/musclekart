document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const emailModal = document.getElementById("emailModal");
  const otpModal = document.getElementById("otpModal");

  const openBtn = document.getElementById("openEmailBtn");
  const newEmailInput = document.getElementById("newEmail");
  const emailError = document.getElementById("emailError");

  const otpInput = document.getElementById("emailOtp");
  const otpError = document.getElementById("emailOtpError");

  const currentEmail = document.getElementById("currentEmail");

  const resendBtn = document.getElementById("resendEmailOtpBtn");
  const verifyBtn = document.getElementById("verifyEmailBtn");
  const timerEl = document.getElementById("emailOtpTimer");

  let emailOtpTimeLeft = 30;
  let emailOtpInterval = null;

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      emailModal.classList.remove("hidden");
    });
  }

  window.closeEmailModal = function () {
    emailModal.classList.add("hidden");
    emailError.textContent = "";
    newEmailInput.value = "";
  };

  function closeOtpModal() {
    otpModal.classList.add("hidden");
    stopTimer();
    otpInput.value = "";
    otpError.textContent = "";
  }

  window.closeOtpModal = closeOtpModal;

  function openOtpModal() {
    otpModal.classList.remove("hidden");
    startTimer();
  }

  function startTimer() {
    clearInterval(emailOtpInterval);

    emailOtpTimeLeft = 30;
    timerEl.textContent = emailOtpTimeLeft;
    resendBtn.disabled = true;

    emailOtpInterval = setInterval(() => {
      emailOtpTimeLeft--;
      timerEl.textContent = emailOtpTimeLeft;

      if (emailOtpTimeLeft <= 0) {
        clearInterval(emailOtpInterval);
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  function stopTimer() {
    if (emailOtpInterval) {
      clearInterval(emailOtpInterval);
    }
  }

  window.requestEmailChange = async function () {
    emailError.textContent = "";

    const email = newEmailInput.value.trim();

    if (!email) {
      emailError.textContent = "Email is required";
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      emailError.textContent = "Enter valid email address";
      return;
    }

    if (email === currentEmail.textContent.trim()) {
      emailError.textContent = "New email must be different";
      return;
    }

    try {
      const res = await fetch("/user/profile/email", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail: email })
      });

      const data = await res.json();

      if (!data.success) {
        emailError.textContent = data.message;
        return;
      }

      emailModal.classList.add("hidden");
      openOtpModal();
    } catch {
      emailError.textContent = "Something went wrong. Try again.";
    }
  };

  verifyBtn.addEventListener("click", async () => {
    otpError.textContent = "";

    const otp = otpInput.value.trim();

    if (!/^\d{6}$/.test(otp)) {
      otpError.textContent = "Enter valid 6-digit OTP";
      return;
    }

    try {
      const res = await fetch("/user/profile/email/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      });

      const data = await res.json();

      if (!data.success) {
        otpError.textContent = data.message;
        return;
      }

      const editEmailInput = document.getElementById("currentEmail");
      const editEmailMessage = document.getElementById("editEmailMessage");

      const updatedEmail = newEmailInput.value.trim();

      if (currentEmail) {
        currentEmail.textContent = updatedEmail;
      }

      if (editEmailInput) {
        editEmailInput.value = updatedEmail;
      }

      if (editEmailMessage) {
        editEmailMessage.textContent = "Email updated successfully";
        editEmailMessage.style.color = "#16a34a";
      }

      closeOtpModal();
      newEmailInput.value = "";
    } catch {
      otpError.textContent = "Verification failed. Try again.";
    }
  });

  resendBtn.addEventListener("click", async () => {
    otpError.textContent = "";

    const newEmail = newEmailInput.value.trim();

    try {
      const res = await fetch("/user/profile/email", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      startTimer();
      otpInput.value = "";
    } catch (err) {
      otpError.textContent = err.message;
    }
  });
});
