import { Outlet, NavLink, useNavigate } from "react-router-dom";
import styles from "./CustomerNav.module.css";
import { logout } from "../util/auth";

export function CustomerNav() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
    navigate('/login');
  };

  return (
    <>
      <nav className={styles.customerNav}>
        <div className={styles.navBrand}>
          <span className={styles.brandIcon}>🍽️</span>
          <span className={styles.brandName}>RestoConnect</span>
        </div>
        <div className={styles.navLinks}>
          <NavLink to={"/customer/"} className={({ isActive }) => (isActive ? styles.active : "")} end>
            <span className={styles.navIcon}>🏠</span>
            <span>Home</span>
          </NavLink>
          <NavLink to={"/customer/dashboard"} className={({ isActive }) => (isActive ? styles.active : "")}>
            <span className={styles.navIcon}>📊</span>
            <span>Dashboard</span>
          </NavLink>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <span className={styles.logoutIcon}>🚪</span>
          <span>Logout</span>
        </button>
      </nav>
      <Outlet />
    </>
  );
}
