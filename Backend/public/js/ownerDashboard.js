// Use variables passed from EJS directly without redeclaring
console.log("yearlyRevenueLabels:", yearlyRevenueLabels);
console.log("yearlyRevenueValues:", yearlyRevenueValues);
console.log("monthlyRevenueLabels:", monthlyRevenueLabels);
console.log("monthlyRevenueValues:", monthlyRevenueValues);
console.log("totalOrders:", totalOrders);
console.log("totalCustomers:", totalCustomers);
console.log("totalRevenue:", totalRevenue);

document.getElementById("totalOrders").innerText = totalOrders;
document.getElementById("totalCustomers").innerText = totalCustomers;
document.getElementById("totalRevenue").innerText = "₹" + totalRevenue.toFixed(2);

const overallRevenueCtx = document.getElementById('overallRevenueChart').getContext('2d');
const monthlyRevenueCtx = document.getElementById('monthlyRevenueChart').getContext('2d');

const overallRevenueChart = new Chart(overallRevenueCtx, {
    type: 'line',
    data: {
        labels: yearlyRevenueLabels,
        datasets: [{
            label: 'Yearly Revenue (₹)',
            data: yearlyRevenueValues,
            borderColor: 'orange',
            backgroundColor: 'rgba(255,165,0,0.3)',
            fill: true,
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

const monthlyRevenueChart = new Chart(monthlyRevenueCtx, {
    type: 'bar',
    data: {
        labels: monthlyRevenueLabels,
        datasets: [{
            label: 'Monthly Revenue (₹)',
            data: monthlyRevenueValues,
            backgroundColor: 'rgba(72, 209, 204, 0.7)',
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
