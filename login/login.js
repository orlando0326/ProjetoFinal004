document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#loginForm");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        window.location.href = "painel.html";
    });
});
