import { Outlet, NavLink, useNavigate } from "react-router-dom";
import styles from "./OwnerNav.module.css";
import { logout } from "../util/auth";

export function OwnerNav() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
    navigate("/login");
  };

  return (
    <>
      <nav className={styles.ownerNav}>
        <div className={styles.navBrand}>
          <span className={styles.brandText}>Owner Portal</span>
        </div>

        <div className={styles.navLinks}>
          <NavLink to={"/owner/"} className={({ isActive }) => (isActive ? styles.active : "")} end>
            Home
          </NavLink>
          <NavLink to={"/owner/dashboard"} className={({ isActive }) => (isActive ? styles.active : "")}>
            Dashboard
          </NavLink>
          <NavLink to={"/owner/staffmanagement"} className={({ isActive }) => (isActive ? styles.active : "")}>
            Staff
          </NavLink>
        </div>

        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </nav>
      <Outlet />
    </>
  );
}
