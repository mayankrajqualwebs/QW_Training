// Select HTML elements
const hero = document.querySelector(".hero");
const glow = document.querySelector(".hero-glow");
const themeToggle = document.querySelector("#themeToggle");
const surpriseBtn = document.querySelector("#surpriseBtn");
const toast = document.querySelector("#toast");

// Make the ambient glow follow the mouse
hero.addEventListener("pointermove", (event) => {
    // Find mouse position relative to the hero
    const rect = hero.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Update CSS custom properties
    glow.style.left = `${x}%`;
    glow.style.top = `${y}%`;
    glow.style.right = "auto";
});

// Switch themes
themeToggle.addEventListener("click", () => {
    const isAlternate = document.body.classList.toggle(
        "alternate-theme"
    );

    themeToggle.textContent = isAlternate
        ? "◐ Neon theme"
        : "◐ Theme";

    themeToggle.setAttribute(
        "aria-pressed",
        String(isAlternate)
    );
});

// Show an interactive notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    // Remove the message after 2.5 seconds
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Connect the button to our function
surpriseBtn.addEventListener("click", () => {
    showToast("⚡ NEON LAB SYSTEMS: ONLINE");
});

console.log("NEON LAB initialized successfully!");
