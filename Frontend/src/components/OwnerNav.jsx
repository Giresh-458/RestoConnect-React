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
        <NavLink to={"/owner/"} className={({ isActive }) => (isActive ? "active" : "")} end>
          Homepage
        </NavLink>
        <NavLink to={"/owner/dashboard"} className={({ isActive }) => (isActive ? "active" : "")}>
          Dashboard
        </NavLink>
        <NavLink to={"/owner/menumanagement"} className={({ isActive }) => (isActive ? "active" : "")}>
          Management
        </NavLink>
        <NavLink to="/owner/orders" className={({ isActive }) => (isActive ? "active" : "")}>
          Orders
        </NavLink>
        <NavLink to={"/owner/reservations"} className={({ isActive }) => (isActive ? "active" : "")}>
          Reservations
        </NavLink>
        <NavLink to={"/owner/feedback"} className={({ isActive }) => (isActive ? "active" : "")}>
          Feedback
        </NavLink>

        <button onClick={handleLogout} style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer" }}>
          Logout
        </button>
      </nav>
      <Outlet />
    </>
  );
}
