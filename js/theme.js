
document.addEventListener("DOMContentLoaded", function () {
    const themeButton = document.getElementById("theme-toggle");
    const savedTheme = localStorage.getItem("movieverse-theme");

    function applyTheme(theme) {
        const isLight = theme === "light";

        document.body.classList.toggle("light-theme", isLight);
        localStorage.setItem("movieverse-theme", theme);

        if (themeButton) {
            themeButton.textContent = isLight
                ? "Dark mode"
                : "Light mode";

            themeButton.setAttribute(
                "aria-label",
                isLight ? "Switch to dark theme" : "Switch to light theme"
            );
        }

        document.dispatchEvent(
            new CustomEvent("movieverse-theme-change", {
                detail: { theme: theme }
            })
        );
    }

    applyTheme(savedTheme === "light" ? "light" : "dark");

    if (themeButton) {
        themeButton.addEventListener("click", function () {
            const isLight = document.body.classList.contains("light-theme");
            applyTheme(isLight ? "dark" : "light");
        });
    }
});
