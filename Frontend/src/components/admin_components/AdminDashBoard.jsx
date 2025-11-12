import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import "./AdminDashboard.css"; // ✅ Styling

export function AdminDashBoard(props) {
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    newUsers: 0,
    activeRestaurants: 0,
    userGrowth: 0,
  });
  const [activities, setActivities] = useState([]);

  // Helper: generate months from Jan to current month
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const getMonthsData = (rawData) => {
  const currentMonth = new Date().getMonth(); // 0-based
  let monthsData = [];

  for(let i = 0; i <= currentMonth; i++){
    const monthNumber = i + 1; // backend month is 1-based
    const monthData = rawData.find(d => d.month === monthNumber);
    monthsData.push({
      month: monthNames[i], // <-- map number to name
      totalPayments: monthData ? monthData.totalPayments : 0,
      countPayments: monthData ? monthData.countPayments : 0,
      restaurantFee: monthData ? monthData.restaurantFee : 0
    });
  }
  return monthsData;
};

  useEffect(() => {
    // Fetch chart data
    fetch("http://localhost:3000/api/admin/chartstats", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setChartData(getMonthsData(data)))
      .catch((err) => console.error(err));

    // Fetch statistics
    fetch("http://localhost:3000/api/admin/statistics", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setStats((prev) => ({
          ...prev,
          totalUsers: data.totalUsers,
          totalRestaurants: data.totalRestaurants,
          newUsers: data.newUsers || 0,
          activeRestaurants: data.activeRestaurants || 0,
          userGrowth: data.userGrowth || 12,
        }));
      })
      .catch((err) => console.error(err));

    // Fetch recent activities
    fetch("http://localhost:3000/api/admin/activities", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setActivities(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="admin-dashboard">
      <h2 className="dashboard-heading">Admin Dashboard</h2>

      {/* Top Summary Blocks */}
      <div className="dashboard-cards">
        <div className="card">
          <p className="card-title">Total Users</p>
          <h1 className="card-value">{stats.totalUsers}</h1>
          <p className="card-sub">↑ {stats.userGrowth}% increase this month</p>
        </div>

        <div className="card">
          <p className="card-title">Total Restaurants</p>
          <h1 className="card-value">{stats.totalRestaurants}</h1>
          <p className="card-sub">{stats.activeRestaurants} currently online</p>
        </div>

        <div className="card">
          <p className="card-title">New Users</p>
          <h1 className="card-value">{stats.newUsers}</h1>
          <p className="card-sub">Joined last month</p>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="performance-block">
        <h3>Performance Overview</h3>
        <div className="charts-row">
          <div className="chart-container">
            <p className="chart-title">Monthly Order Volume</p>
            <BarChart width={400} height={250} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="countPayments" fill="#007bff" name="Order Volume" />
            </BarChart>
          </div>

          <div className="chart-container">
            <p className="chart-title">Monthly Revenue Trends</p>
            <LineChart width={400} height={250} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalPayments" stroke="#28a745" name="Total Revenue" />
            </LineChart>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="activities-block">
        <h3>Recent Activities</h3>
        <ul className="activities-list">
          {activities.length === 0 ? (
            <li>No recent activities</li>
          ) : (
            activities.map((act, i) => (
              <li key={i}>
                <span className="activity-time">{act.time}</span> — {act.description}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
