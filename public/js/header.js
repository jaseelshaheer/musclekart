document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".profile-dropdown");
  const menu = document.querySelector(".dropdown-menu");

  if (!dropdown || !menu) return;

  let timeout;

  dropdown.addEventListener("mouseenter", () => {
    clearTimeout(timeout);
    menu.classList.add("show");
  });

  dropdown.addEventListener("mouseleave", () => {
    timeout = setTimeout(() => {
      menu.classList.remove("show");
    }, 150);
  });
});
