document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll(".otp-box");
  const timerEl = document.getElementById("otpTimer");
  const resendBtn = document.getElementById("resendBtn");
  // const errorEl = document.getElementById("otpError");

  if (!inputs.length || !timerEl || !resendBtn) {
    return;
  }

  // Auto focus next input
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value && inputs[index + 1]) {
        // z;
        inputs[index + 1].focus();
      }
    });
  });

  //timer
  let timeLeft = 30;
  timerEl.textContent = `00:${timeLeft}`;

  const interval = setInterval(() => {
    timeLeft--;

    timerEl.textContent = `00:${timeLeft < 10 ? "0" : ""}${timeLeft}`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      resendBtn.disabled = false;
    }
  }, 1000);
});
