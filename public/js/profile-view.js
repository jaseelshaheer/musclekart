document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  try {
    const res = await fetch("/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    const user = data.data;

    if (user.authProvider === "google") {
      const changeBtn = document.getElementById("openEmailBtn");
      if (changeBtn) changeBtn.style.display = "none";
    }

    document.getElementById("profileHeaderName").textContent =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";


    // Update fields
    document.getElementById("profileFirstName").textContent =
      user.firstName || "-";

    document.getElementById("profileLastName").textContent =
      user.lastName || "-";

    document.getElementById("profilePhone").textContent =
      user.phone || "-";

    document.getElementById("currentEmail").textContent =
      user.email || "-";

    document.getElementById("profileReferralCode").textContent =
    user.referral_code || "-";

    const copyReferralCodeBtn = document.getElementById("copyReferralCodeBtn");
    const referralCodeText = user.referral_code || "";

    if (copyReferralCodeBtn) {
      copyReferralCodeBtn.style.display = referralCodeText
        ? "inline-block"
        : "none";

      copyReferralCodeBtn.addEventListener("click", async () => {
        if (!referralCodeText) return;

        try {
          await navigator.clipboard.writeText(referralCodeText);
          showToast("Referral code copied", "success");
        } catch {
          showAlertModal("Failed to copy referral code");
        }
      });
    }

    const copyReferralLinkBtn = document.getElementById("copyReferralLinkBtn");

    if (copyReferralLinkBtn) {
      copyReferralLinkBtn.style.display = referralCodeText ? "inline-block" : "none";

      copyReferralLinkBtn.addEventListener("click", async () => {
        try {
          const linkRes = await fetch("/user/profile/referral-link", {
            headers: { Authorization: `Bearer ${token}` }
          });

          const linkData = await linkRes.json();

          if (!linkRes.ok || !linkData.success) {
            throw new Error(linkData.message || "Failed to generate referral link");
          }

          const inviteLink = `${window.location.origin}/signup?ref=${encodeURIComponent(linkData.data.token)}`;
          await navigator.clipboard.writeText(inviteLink);
          showToast("Referral invite link copied", "success");
        } catch (err) {
          showAlertModal(err.message || "Failed to copy invite link");
        }
      });
    }

    const profileImg = document.querySelector(".profile-header img");

    if (profileImg && user.profileImage) {
      profileImg.src = user.profileImage;
    }

  } catch (err) {
    console.error(err);
  }
});

