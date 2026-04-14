import { Outlet, NavLink, useNavigate } from "react-router-dom";
import styles from "./StaffNav.module.css";
import { logout } from "../util/auth";

export function StaffNav() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed', e);
    }
    navigate('/login');
  };
  return (
    <>
      <nav className={styles.staffNav}>
        <span className={styles.brand}>🍽️ RestoConnect</span>
        <div className={styles.links}>
          <NavLink 
            to={"/staff/"} 
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
            end>
            Home
          </NavLink>
          <NavLink 
            to={"/staff/dashboard"} 
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
          >
            Dashboard
          </NavLink>
          <NavLink 
            to={"/staff/leftovers"} 
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
          >
            Leftovers
          </NavLink>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
      </nav>
      <Outlet />
    </>
  );
}
