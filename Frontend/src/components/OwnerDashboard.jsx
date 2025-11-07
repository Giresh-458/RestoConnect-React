import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const OwnerDashboard = () => {
const [dashboardData, setDashboardData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
fetchDashboardData();
}, []);

const fetchDashboardData = async () => {
try {
setLoading(true);
const response = await fetch('http://localhost:3000/owner/dashboard/ownerdashboard', {
credentials: 'include'
});

if (!response.ok) {
throw new Error('Failed to fetch dashboard data');
}

const result = await response.json();

if (result.success) {
setDashboardData(result.data);
} else {
throw new Error(result.error || 'Unknown error');
}
} catch (err) {
setError(err.message);
console.error('Dashboard fetch error:', err);
} finally {
setLoading(false);
}
};

// Inline styles
const styles = {
loadingContainer: {
minHeight: '100vh',
backgroundColor: '#f9fafb',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
},
loadingContent: {
textAlign: 'center',
},
spinner: {
animation: 'spin 1s linear infinite',
borderRadius: '9999px',
height: '3rem',
width: '3rem',
borderBottom: '2px solid #2563eb',
marginLeft: 'auto',
marginRight: 'auto',
},
loadingText: {
marginTop: '1rem',
color: '#4b5563',
},
errorContainer: {
minHeight: '100vh',
backgroundColor: '#f9fafb',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
},
errorBox: {
backgroundColor: '#fef2f2',
border: '1px solid #fecaca',
borderRadius: '0.5rem',
padding: '1.5rem',
maxWidth: '28rem',
},
errorTitle: {
color: '#991b1b',
fontWeight: 600,
marginBottom: '0.5rem',
},
errorMessage: {
color: '#dc2626',
},
retryButton: {
marginTop: '1rem',
backgroundColor: '#dc2626',
color: 'white',
padding: '0.5rem 1rem',
borderRadius: '0.25rem',
border: 'none',
cursor: 'pointer',
},
retryButtonHover: {
backgroundColor: '#b91c1c',
},
dashboardWrapper: {
minHeight: '100vh',
backgroundColor: '#f9fafb',
},
header: {
backgroundColor: 'white',
boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
},
headerContainer: {
maxWidth: '80rem',
marginLeft: 'auto',
marginRight: 'auto',
padding: '1rem',
},
headerContent: {
display: 'flex',
alignItems: 'center',
justifyContent: 'space-between',
},
headerTitle: {
fontSize: '1.5rem',
fontWeight: 700,
color: '#111827',
},
nav: {
display: 'flex',
alignItems: 'center',
gap: '1.5rem',
},
navLink: {
color: '#4b5563',
textDecoration: 'none',
cursor: 'pointer',
},
navLinkActive: {
color: '#2563eb',
textDecoration: 'none',
cursor: 'pointer',
},
mainContainer: {
maxWidth: '80rem',
marginLeft: 'auto',
marginRight: 'auto',
padding: '2rem 1rem',
},
statsGrid: {
display: 'grid',
gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
gap: '1.5rem',
marginBottom: '2rem',
},
statCard: {
backgroundColor: 'white',
borderRadius: '0.5rem',
boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
padding: '1.5rem',
},
statLabel: {
color: '#4b5563',
fontSize: '0.875rem',
marginBottom: '0.5rem',
},
statValue: {
fontSize: '1.875rem',
fontWeight: 700,
color: '#111827',
},
chartsGrid: {
display: 'grid',
gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
gap: '1.5rem',
marginBottom: '2rem',
},
chartCard: {
backgroundColor: 'white',
borderRadius: '0.5rem',
boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
padding: '1.5rem',
},
chartTitle: {
fontSize: '1.125rem',
fontWeight: 600,
color: '#111827',
marginBottom: '1rem',
},
inventoryCard: {
backgroundColor: 'white',
borderRadius: '0.5rem',
boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
padding: '1.5rem',
},
overviewCard: {
backgroundColor: 'white',
borderRadius: '0.5rem',
boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
padding: '1.5rem',
marginTop: '1.5rem',
},
overviewText: {
color: '#4b5563',
},
footer: {
backgroundColor: 'white',
borderTop: '1px solid #e5e7eb',
marginTop: '3rem',
},
footerContainer: {
maxWidth: '80rem',
marginLeft: 'auto',
marginRight: 'auto',
padding: '1.5rem 1rem',
},
footerText: {
textAlign: 'center',
color: '#4b5563',
fontSize: '0.875rem',
},
};

if (loading) {
return (
<div style={styles.loadingContainer}>
<div style={styles.loadingContent}>
<div style={styles.spinner}></div>
<p style={styles.loadingText}>Loading dashboard...</p>
</div>
<style>
{`
@keyframes spin {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}
`}
</style>
</div>
);
}

if (error) {
return (
<div style={styles.errorContainer}>
<div style={styles.errorBox}>
<h3 style={styles.errorTitle}>Error Loading Dashboard</h3>
<p style={styles.errorMessage}>{error}</p>
<button
onClick={fetchDashboardData}
style={styles.retryButton}
onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
>
Retry
</button>
</div>
</div>
);
}

// Prepare chart data
const revenueChartData = dashboardData.revenueChart.labels.map((label, index) => ({
day: label,
revenue: dashboardData.revenueChart.values[index]
}));

const popularDishesData = dashboardData.popularDishes.map(dish => ({
name: dish.name.length > 15 ? dish.name.substring(0, 15) + '...' : dish.name,
orders: dish.orders
}));

return (
<div style={styles.dashboardWrapper}>
<style>
{`
@keyframes spin {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}
`}
</style>

{/* Header */}
<header style={styles.header}>
<div style={styles.headerContainer}>
<div style={styles.headerContent}>
<h1 style={styles.headerTitle}>RestoConnect</h1>
<nav style={styles.nav}>
<a  style={styles.navLink}>Dashboard</a>
<a  style={styles.navLinkActive}>Notifications</a>
<span style={styles.navLink}>GV</span>
<a href="/logout" style={styles.navLink}>Logout</a>
</nav>
</div>
</div>
</header>

{/* Main Content */}
<main style={styles.mainContainer}>
{/* Stats Grid */}
<div style={styles.statsGrid}>
{/* Total Revenue */}
<div style={styles.statCard}>
<p style={styles.statLabel}>Total Revenue (This Month)</p>
<p style={styles.statValue}>
₹{dashboardData.totalRevenue.toLocaleString('en-IN')}
</p>
</div>

{/* Total Orders Today */}
<div style={styles.statCard}>
<p style={styles.statLabel}>Total Orders Today</p>
<p style={styles.statValue}>
{dashboardData.totalOrdersToday}
</p>
</div>

{/* Staff On Duty */}
<div style={styles.statCard}>
<p style={styles.statLabel}>Staff On Duty</p>
<p style={styles.statValue}>
{dashboardData.staffCount}
</p>
</div>

{/* Low Stock Items */}
<div style={styles.statCard}>
<p style={styles.statLabel}>Low Stock Items</p>
<p style={styles.statValue}>
{dashboardData.lowStockItems}
</p>
</div>
</div>

{/* Charts Section */}
<div style={styles.chartsGrid}>
{/* Revenue Chart */}
<div style={styles.chartCard}>
<h2 style={styles.chartTitle}>
Revenue Overview (Last 7 Days)
</h2>
<ResponsiveContainer width="100%" height={300}>
<LineChart data={revenueChartData}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="day" />
<YAxis />
<Tooltip
formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
/>
<Legend />
<Line
type="monotone"
dataKey="revenue"
stroke="#3b82f6"
strokeWidth={2}
name="Revenue"
/>
</LineChart>
</ResponsiveContainer>
</div>

{/* Popular Dishes */}
<div style={styles.chartCard}>
<h2 style={styles.chartTitle}>
Popular Dishes (Top 5)
</h2>
<ResponsiveContainer width="100%" height={300}>
<BarChart data={popularDishesData}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="name" />
<YAxis />
<Tooltip />
<Legend />
<Bar
dataKey="orders"
fill="#10b981"
name="Orders"
/>
</BarChart>
</ResponsiveContainer>
</div>
</div>

{/* Inventory Status */}
{dashboardData.inventoryData.labels.length > 0 && (
<div style={styles.inventoryCard}>
<h2 style={styles.chartTitle}>
Inventory Status
</h2>
<ResponsiveContainer width="100%" height={300}>
<BarChart data={dashboardData.inventoryData.labels.map((label, idx) => ({
item: label,
quantity: dashboardData.inventoryData.values[idx]
}))}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="item" />
<YAxis />
<Tooltip />
<Legend />
<Bar
dataKey="quantity"
fill="#f59e0b"
name="Quantity"
/>
</BarChart>
</ResponsiveContainer>
</div>
)}

{/* Overview Text */}
<div style={styles.overviewCard}>
<p style={styles.overviewText}>
Overview of your restaurant performance.
</p>
</div>
</main>

{/* Footer */}
<footer style={styles.footer}>
<div style={styles.footerContainer}>
<p style={styles.footerText}>
© RestoConnect · Developed by Team
</p>
</div>
</footer>
</div>
);
};

export default OwnerDashboard;
