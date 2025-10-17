document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("backButton").addEventListener("click", function () {
    window.history.back();
  });
});


function showForm() {
  document.getElementById("formContainer").style.display = "flex";
}
