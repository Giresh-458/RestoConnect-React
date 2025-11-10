import { isLogin } from "../util/auth";
 import { redirect } from "react-router-dom";


export async function loader({request}){

 let role =await isLogin();
if(role!='customer'){
   return redirect('/login');
}




}

import { useState, useEffect } from 'react';

export const DashBoardPage = () => {
  const [userData, setUserData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [weeklySpending, setWeeklySpending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Replace with your API endpoint
      const response = await fetch('http://localhost:3000/customer/customerDashboard');
      const data = await response.json();
      
      setUserData(data.user);
      setRecentOrders(data.recentOrders);
      setFavoriteRestaurants(data.favoriteRestaurants);
      setUpcomingReservations(data.upcomingReservations);
      setPastReservations(data.pastReservations);
      setWeeklySpending(data.weeklySpending);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getOrderStatusColor = (status) => {
    switch(status) {
      case 'delivered': return '#4ade80';
      case 'pending': return '#fbbf24';
      default: return '#94a3b8';
    }
  };

  const getDayName = (index) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[index];
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={userData?.img_url || '/default-avatar.png'} alt="User" style={styles.avatar} />
          <div>
            <h1 style={styles.welcomeText}>Welcome back, {userData?.name} 👋</h1>
            <p style={styles.subtitle}>Your meal moments await!</p>
            <p style={styles.orderCount}>{userData?.totalOrders || 0} Total Orders</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.editButton}>Edit Profile</button>
          <button style={styles.logoutButton}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left Section */}
        <div style={styles.leftSection}>
          {/* Dine-In Insights */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Dine-In Insights</h2>
            
            <div style={styles.insightsRow}>
              {/* Weekly Spending */}
              <div style={styles.spendingSection}>
                <h3 style={styles.sectionTitle}>Weekly Spending</h3>
                <div style={styles.chartContainer}>
                  {weeklySpending.map((amount, index) => (
                    <div key={index} style={styles.barContainer}>
                      <div 
                        style={{
                          ...styles.bar,
                          height: `${(amount / Math.max(...weeklySpending)) * 100}%`,
                          backgroundColor: index === 2 ? '#ff6b35' : index % 2 === 0 ? '#fbbf24' : '#fcd34d'
                        }}
                      ></div>
                      <span style={styles.barLabel}>{getDayName(index)}</span>
                    </div>
                  ))}
                </div>
                <div style={styles.statsRow}>
                  <div>
                    <p style={styles.statLabel}>Total Visits</p>
                    <p style={styles.statValue}>{userData?.totalVisits || 8}</p>
                  </div>
                  <div>
                    <p style={styles.statLabel}>Avg Spend</p>
                    <p style={styles.statValue}>${userData?.avgSpend || '78.50'}</p>
                  </div>
                  <div>
                    <p style={styles.statLabel}>Top Restaurant</p>
                    <p style={styles.statValue}>{userData?.topRestaurant || 'The Grand Bistro'}</p>
                  </div>
                </div>
              </div>

              {/* Visit Frequency */}
              <div style={styles.frequencySection}>
                <h3 style={styles.sectionTitle}>Visit Frequency</h3>
                <div style={styles.donutContainer}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="50" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="20"
                      strokeDasharray="314"
                      strokeDashoffset="78.5"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="65" textAnchor="middle" style={styles.donutText}>8</text>
                    <text x="60" y="80" textAnchor="middle" style={styles.donutSubtext}>Visits/Mo</text>
                  </svg>
                </div>
                <div style={styles.legend}>
                  {['Week 1-2', 'Week 2-3', 'Week 3-1', 'Week 4-2'].map((week, idx) => (
                    <div key={idx} style={styles.legendItem}>
                      <div style={{...styles.legendDot, backgroundColor: ['#10b981', '#fbbf24', '#f59e0b', '#e5e7eb'][idx]}}></div>
                      <span style={styles.legendText}>{week}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order Overview */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Order Overview</h2>
              <div style={styles.tabs}>
                <button style={styles.tabActive}>Recent Orders</button>
                <button style={styles.tab}>Past Orders</button>
              </div>
            </div>
            
            <div style={styles.ordersList}>
              {recentOrders.map((order, index) => (
                <div key={index} style={styles.orderItem}>
                  <img src={order.image || '/dish-placeholder.png'} alt={order.dishName} style={styles.orderImage} />
                  <div style={styles.orderInfo}>
                    <h4 style={styles.orderName}>{order.dishName}</h4>
                    <p style={styles.orderPrice}>${order.price}</p>
                    <p style={{...styles.orderStatus, color: getOrderStatusColor(order.status)}}>
                      Order #{order.orderId} · {order.status}
                    </p>
                  </div>
                  <div style={styles.orderActions}>
                    {order.status === 'pending' ? (
                      <>
                        <button style={styles.rateButton}>Track</button>
                        <button style={styles.reorderButton}>Reorder</button>
                      </>
                    ) : (
                      <>
                        <button style={styles.rateButton}>Rate</button>
                        <button style={styles.reorderButton}>Reorder</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Dishes */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Favorite Dishes</h2>
            <div style={styles.dishesGrid}>
              {favoriteRestaurants.slice(0, 2).map((dish, index) => (
                <div key={index} style={styles.dishCard}>
                  <img src={dish.image || '/dish-placeholder.png'} alt={dish.name} style={styles.dishImage} />
                  <div style={styles.dishInfo}>
                    <h4 style={styles.dishName}>{dish.name}</h4>
                    <p style={styles.dishRestaurant}>From {dish.restaurant}</p>
                    <div style={styles.dishActions}>
                      <button style={styles.viewMenuButton}>View Menu</button>
                      <button style={styles.reorderButtonOrange}>Reorder</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Reservations */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Table Reservations</h2>
              <button style={styles.bookTableButton}>Book New Table</button>
            </div>
            
            <div style={styles.reservationsContainer}>
              <div style={styles.reservationColumn}>
                <h3 style={styles.reservationTitle}>Upcoming</h3>
                {upcomingReservations.map((res, index) => (
                  <div key={index} style={styles.reservationItem}>
                    <span style={styles.restaurantIcon}>🍽️</span>
                    <div>
                      <p style={styles.reservationName}>{res.restaurant}</p>
                      <p style={styles.reservationDetails}>{res.date} at {res.time} · {res.guests} guests</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={styles.reservationColumn}>
                <h3 style={styles.reservationTitle}>Past</h3>
                {pastReservations.map((res, index) => (
                  <div key={index} style={styles.reservationItem}>
                    <span style={styles.restaurantIcon}>🍽️</span>
                    <div>
                      <p style={styles.reservationName}>{res.restaurant}</p>
                      <p style={styles.reservationDetails}>{res.date} at {res.time} · {res.guests} guests</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div style={styles.rightSection}>
          {/* Feedback & Reviews */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Feedback & Reviews</h2>
            <div style={styles.satisfactionContainer}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke="#ff6b35" 
                  strokeWidth="8"
                  strokeDasharray="251"
                  strokeDashoffset="25"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="55" textAnchor="middle" style={styles.satisfactionText}>92%</text>
              </svg>
              <p style={styles.satisfactionLabel}>Based on your 14 reviews</p>
            </div>
            
            <div style={styles.reviewsSection}>
              <h3 style={styles.sectionTitle}>Your Past Reviews</h3>
              <div style={styles.reviewItem}>
                <p style={styles.reviewRestaurant}>The Grand Bistro</p>
                <div style={styles.stars}>★★★★★</div>
                <p style={styles.reviewText}>"Lovely ambiance and the steak was perfect!"</p>
              </div>
              <div style={styles.reviewItem}>
                <p style={styles.reviewRestaurant}>Sakura Sushi House</p>
                <div style={styles.stars}>★★★★★</div>
                <p style={styles.reviewText}>"The sushi was incredibly fresh and delicious"</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Notifications</h2>
            
            <div style={styles.notificationItem}>
              <div style={styles.notificationIcon}>✓</div>
              <div>
                <p style={styles.notificationText}>Order #5677 delivered successfully!</p>
                <p style={styles.notificationTime}>2 hours ago</p>
              </div>
            </div>
            
            <div style={styles.notificationItem}>
              <div style={styles.notificationIconBlue}>📅</div>
              <div>
                <p style={styles.notificationText}>Your table booking is confirmed at 8:00 PM</p>
                <p style={styles.notificationTime}>1 day ago</p>
              </div>
            </div>
            
            <div style={styles.notificationToggle}>
              <span>Email Notifications</span>
              <label style={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span style={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    padding: '20px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '20px 30px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  headerLeft: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  avatar: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  welcomeText: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 5px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 5px 0'
  },
  orderCount: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    gap: '10px'
  },
  editButton: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#ff6b35',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px'
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 20px 0'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  tabs: {
    display: 'flex',
    gap: '10px'
  },
  tabActive: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#ff6b35',
    border: 'none',
    borderBottom: '2px solid #ff6b35',
    cursor: 'pointer',
    fontSize: '14px'
  },
  tab: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#6b7280',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px'
  },
  insightsRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '30px'
  },
  spendingSection: {
    flex: 1
  },
  frequencySection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#374151'
  },
  chartContainer: {
    display: 'flex',
    gap: '15px',
    height: '150px',
    alignItems: 'flex-end',
    marginBottom: '20px'
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end'
  },
  bar: {
    width: '100%',
    borderRadius: '6px 6px 0 0',
    transition: 'height 0.3s'
  },
  barLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '8px'
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 5px 0'
  },
  statValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0
  },
  donutContainer: {
    marginBottom: '20px'
  },
  donutText: {
    fontSize: '28px',
    fontWeight: 'bold',
    fill: '#111827'
  },
  donutSubtext: {
    fontSize: '11px',
    fill: '#6b7280'
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  legendText: {
    fontSize: '12px',
    color: '#6b7280'
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  orderItem: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  orderImage: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover'
  },
  orderInfo: {
    flex: 1
  },
  orderName: {
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 5px 0'
  },
  orderPrice: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 5px 0'
  },
  orderStatus: {
    fontSize: '12px',
    margin: 0
  },
  orderActions: {
    display: 'flex',
    gap: '10px'
  },
  rateButton: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  reorderButton: {
    padding: '8px 16px',
    backgroundColor: '#ff6b35',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  dishesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  dishCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  dishImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover'
  },
  dishInfo: {
    padding: '15px'
  },
  dishName: {
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 5px 0'
  },
  dishRestaurant: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 15px 0'
  },
  dishActions: {
    display: 'flex',
    gap: '10px'
  },
  viewMenuButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  reorderButtonOrange: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#ff6b35',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  bookTableButton: {
    padding: '8px 16px',
    backgroundColor: '#ff6b35',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  reservationsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  reservationColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  reservationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '5px'
  },
  reservationItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  restaurantIcon: {
    fontSize: '20px'
  },
  reservationName: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 5px 0'
  },
  reservationDetails: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0
  },
  satisfactionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px'
  },
  satisfactionText: {
    fontSize: '24px',
    fontWeight: 'bold',
    fill: '#111827'
  },
  satisfactionLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '10px'
  },
  reviewsSection: {
    marginTop: '20px'
  },
  reviewItem: {
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb'
  },
  reviewRestaurant: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 5px 0'
  },
  stars: {
    color: '#fbbf24',
    fontSize: '14px',
    margin: '5px 0'
  },
  reviewText: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
    fontStyle: 'italic'
  },
  notificationItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  notificationIcon: {
    width: '24px',
    height: '24px',
    backgroundColor: '#10b981',
    color: '#fff',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0
  },
  notificationIconBlue: {
    width: '24px',
    height: '24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0
  },
  notificationText: {
    fontSize: '13px',
    margin: '0 0 5px 0'
  },
  notificationTime: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0
  },
  notificationToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e5e7eb'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '48px',
    height: '24px'
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ff6b35',
    borderRadius: '24px',
    transition: '0.4s'
  }
};

 