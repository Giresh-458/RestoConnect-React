import { useEffect, useState } from "react";
import { logout } from "../../util/auth";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import "./AdminDashboard.css"; // ✅ Styling

export function AdminDashBoard(props) {
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('monthly'); // daily, monthly, yearly
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

  // Process data based on period
  const processChartData = (rawData, periodType) => {
    if (periodType === 'daily') {
      // Process daily data - last 30 days
      const daysData = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const dayData = rawData.find(d => 
          d.year === year && d.month === month && d.day === day
        );
        
        daysData.push({
          label: `${month}/${day}`,
          totalPayments: dayData ? dayData.totalPayments : 0,
          countPayments: dayData ? dayData.countPayments : 0,
          restaurantFee: dayData ? dayData.restaurantFee : 0
        });
      }
      return daysData;
    } else if (periodType === 'yearly') {
      // Process yearly data - last 5 years
      const yearsData = [];
      const currentYear = new Date().getFullYear();
      
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const yearData = rawData.find(d => d.year === year);
        
        yearsData.push({
          label: year.toString(),
          totalPayments: yearData ? yearData.totalPayments : 0,
          countPayments: yearData ? yearData.countPayments : 0,
          restaurantFee: yearData ? yearData.restaurantFee : 0
        });
      }
      return yearsData;
    } else {
      // Process monthly data - current year
      const currentMonth = new Date().getMonth(); // 0-based
      let monthsData = [];

      for(let i = 0; i <= currentMonth; i++){
        const monthNumber = i + 1; // backend month is 1-based
        const monthData = rawData.find(d => d.month === monthNumber);
        monthsData.push({
          label: monthNames[i],
          totalPayments: monthData ? monthData.totalPayments : 0,
          countPayments: monthData ? monthData.countPayments : 0,
          restaurantFee: monthData ? monthData.restaurantFee : 0
        });
      }
      return monthsData;
    }
  };

  useEffect(() => {
    // Fetch chart data based on selected period
    fetch(`http://localhost:3000/api/admin/chartstats?period=${period}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setChartData(processChartData(data, period)))
      .catch((err) => console.error(err));
  }, [period]);

  useEffect(() => {
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={async () => {
            try {
              await logout();
              window.location.href = '/login';
            } catch (e) {
              console.error('Logout failed', e);
              window.location.href = '/login';
            }
          }}
          style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Performance Overview</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPeriod('daily')}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: period === 'daily' ? '#007bff' : '#fff',
                color: period === 'daily' ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: period === 'daily' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              Daily
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: period === 'monthly' ? '#007bff' : '#fff',
                color: period === 'monthly' ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: period === 'monthly' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: period === 'yearly' ? '#007bff' : '#fff',
                color: period === 'yearly' ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: period === 'yearly' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="charts-row">
          <div className="chart-container">
            <p className="chart-title">
              {period === 'daily' ? 'Daily Order Volume (Last 30 Days)' : 
               period === 'yearly' ? 'Yearly Order Volume' : 
               'Monthly Order Volume'}
            </p>
            <BarChart width={400} height={250} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="countPayments" fill="#007bff" name="Order Volume" />
            </BarChart>
          </div>

          <div className="chart-container">
            <p className="chart-title">
              {period === 'daily' ? 'Daily Revenue Trends (Last 30 Days)' : 
               period === 'yearly' ? 'Yearly Revenue Trends' : 
               'Monthly Revenue Trends'}
            </p>
            <LineChart width={400} height={250} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
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
