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
        <NavLink to={"/customer/dashboard"} className={({ isActive }) => (isActive ? "active" : "")}>
          Dashboard
        </NavLink>
        <NavLink to={"/customer/"} className={({ isActive }) => (isActive ? "active" : "")} end>
          Home
        </NavLink>
        <button onClick={handleLogout} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}>Logout</button>
      </nav>
      <Outlet />
    </>
  );
}
