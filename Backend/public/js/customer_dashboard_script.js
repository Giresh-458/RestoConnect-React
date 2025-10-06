function createPieChart(canvasId, data, colors, labels) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  new Chart(ctx, {
      type: "pie",
      data: {
          labels: labels,
          datasets: [{
              data: data,
              backgroundColor: colors
          }]
      }
  });
}

// Generate colors dynamically for the charts
function generateColors(count) {
  const baseColors = ["blue", "green", "red", "orange", "purple", "yellow", "pink", "brown", "cyan", "magenta"];
  let colors = [];
  for(let i=0; i<count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

// Use dynamic data passed from server
const data1 = item_counts || [];
const labels1 = item_list || [];
const colors1 = generateColors(data1.length);

const data2 = restaurent_counts || [];
const labels2 = restaurent_list || [];
const colors2 = generateColors(data2.length);

createPieChart("pichart1", data1, colors1, labels1);
createPieChart("pichart2", data2, colors2, labels2);

window.addEventListener('DOMContentLoaded', () => {
  let chg_pass = document.querySelector("#chg_pass");
  if(chg_pass) {
    chg_pass.addEventListener("click", function () {
      document.querySelector("#editProfileForm").classList.remove("none");
    });
  }

  let close_btn = document.querySelector(".close-btn");
  if(close_btn) {
    close_btn.addEventListener("click", function () {
      document.querySelector(".ncusdasheditform").classList.add("none");
    });
  }

  // Automatically show change password form if there is an error or success message
  const changePasswordError = document.querySelector('.error-message');
  const changePasswordSuccess = document.querySelector('.success-message');
  if (changePasswordError || changePasswordSuccess) {
    document.querySelector("#editProfileForm").classList.remove("none");
  }

  // Add event listener to show edit profile form
  let editProfileBtn = document.querySelector("#editProfileBtn");
  let editProfileForm = document.querySelector("#editProfileForm");
  let closeBtnEdit = document.querySelector(".close-btn-edit");

  if(editProfileBtn && editProfileForm && closeBtnEdit) {
    editProfileBtn.addEventListener("click", function() {
      editProfileForm.classList.remove("none");
    });

    closeBtnEdit.addEventListener("click", function(event) {
      event.preventDefault();
      editProfileForm.classList.add("none");
    });
  }
});
