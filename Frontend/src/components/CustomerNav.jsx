import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import styles from "./CustomerNav.module.css";
import { logout } from "../util/auth";

export function CustomerNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
    navigate('/login');
  };

  const isDashboard = location.pathname.includes('/customer/dashboard');
  const isHome = location.pathname === '/customer/' || location.pathname === '/customer';

  const handleBrandClick = () => {
    navigate('/customer/');
  };

  const handleDashboardHome = () => {
    if (isDashboard) {
      navigate('/customer/');
    } else {
      navigate('/customer/dashboard');
    }
  };

  return (
    <>
      <nav className={styles.customerNav}>
        <div className={styles.navBrand} onClick={handleBrandClick} style={{ cursor: 'pointer' }}>
          <span className={styles.brandIcon}>🍽️</span>
          <span className={styles.brandName}>RestoConnect</span>
        </div>
        <div className={styles.navLinks}>
          <NavLink to="/customer/support">
            <span className={styles.navIcon}>💬</span>
            <span>Support</span>
          </NavLink>
        </div>
        <div className={styles.rightActions}>
          <button 
            onClick={handleDashboardHome} 
            className={styles.dashboardBtn}
            title={isDashboard ? "Go to Home" : "Go to Dashboard"}
          >
            <span>{isDashboard ? 'Home' : 'Dashboard'}</span>
          </button>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span>Logout</span>
          </button>
        </div>
      </nav>
      <Outlet />
    </>
  );
}
