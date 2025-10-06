document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("backButton").addEventListener("click", function () {
    window.history.back();
  });
});

// Removed client-side DOM manipulation for add/edit/delete since handled by server

function showForm() {
  document.getElementById("formContainer").style.display = "flex";
}
