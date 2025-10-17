// Use variables passed from EJS directly without redeclaring
console.log("weeklyRevenueLabels:", weeklyRevenueLabels);
console.log("weeklyRevenueValues:", weeklyRevenueValues);
console.log("dailyRevenueLabels:", dailyRevenueLabels);
console.log("dailyRevenueValues:", dailyRevenueValues);
console.log("totalOrders:", totalOrders);
console.log("totalCustomers:", totalCustomers);
console.log("totalRevenue:", totalRevenue);

document.getElementById("totalOrders").innerText = totalOrders;
document.getElementById("totalCustomers").innerText = totalCustomers;
document.getElementById("totalRevenue").innerText =
  "₹" + totalRevenue.toFixed(2);

const weeklyRevenueCtx = document
  .getElementById("weeklyRevenueChart")
  .getContext("2d");
const dailyRevenueCtx = document
  .getElementById("dailyRevenueChart")
  .getContext("2d");

// Weekly Revenue Chart
const weeklyRevenueChart = new Chart(weeklyRevenueCtx, {
  type: "bar",
  data: {
    labels: weeklyRevenueLabels,
    datasets: [
      {
        label: "Weekly Revenue (₹)",
        data: weeklyRevenueValues,
        borderColor: "orange",
        backgroundColor: "rgba(255,165,0,0.3)",
        fill: true,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

// Daily Revenue Chart
const dailyRevenueChart = new Chart(dailyRevenueCtx, {
  type: "bar",
  data: {
    labels: dailyRevenueLabels,
    datasets: [
      {
        label: "Daily Revenue (₹)",
        data: dailyRevenueValues,
        backgroundColor: "rgba(72, 209, 204, 0.7)",
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});
