function confirmAction(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const messageEl = document.getElementById("confirmMessage");
    const okBtn = document.getElementById("confirmOk");
    const cancelBtn = document.getElementById("confirmCancel");

    if (!modal || !messageEl || !okBtn || !cancelBtn) return;

    messageEl.textContent = message;
    modal.classList.remove("hidden");

    function cleanup(result) {
      modal.classList.add("hidden");
      okBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    }

    function onConfirm() {
      cleanup(true);
    }

    function onCancel() {
      cleanup(false);
    }

    okBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  });
}

function showConfirm(message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  const messageBox = document.getElementById("confirmMessage");

  const okBtn = document.getElementById("confirmOk");
  const cancelBtn = document.getElementById("confirmCancel");

  messageBox.textContent = message;

  modal.classList.remove("hidden");

  okBtn.onclick = () => {
    modal.classList.add("hidden");
    onConfirm();
  };

  cancelBtn.onclick = () => {
    modal.classList.add("hidden");
  };
}

function showAlertModal(message, title = "Notice") {
  const modal = document.getElementById("globalAlertModal");
  const titleEl = document.getElementById("alertTitle");
  const messageEl = document.getElementById("alertMessage");
  const okBtn = document.getElementById("alertOkBtn");

  if (!modal || !messageEl || !okBtn) {
    alert(message);
    return;
  }

  if (titleEl) {
    titleEl.textContent = title;
  }

  messageEl.textContent = message;
  modal.classList.remove("hidden");

  okBtn.onclick = () => {
    modal.classList.add("hidden");
  };
}

// -------------------------------
// GLOBAL FIELD ERROR RESET HANDLER
// -------------------------------
function attachFieldAutoReset() {
  document.addEventListener("input", function (e) {
    const input = e.target;

    if (input.tagName === "INPUT" || input.tagName === "TEXTAREA" || input.tagName === "SELECT") {
      // Remove red border
      input.classList.remove("input-error");

      // Remove inline style if you used it
      input.style.borderColor = "";

      // Clear sibling error message
      const errorEl = input.closest(".form-group")?.querySelector(".field-error");

      if (errorEl) {
        errorEl.textContent = "";
      }
    }
  });
}

attachFieldAutoReset();
