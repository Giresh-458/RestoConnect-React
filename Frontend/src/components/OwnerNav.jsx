import { Outlet, NavLink } from "react-router-dom";
import styles from "./OwnerNav.module.css";

export function OwnerNav() {
  return (
    <>
      <nav className={styles.ownerNav}>
        <NavLink 
          to={"/owner/"} 
          className={({ isActive }) => isActive ? styles.active : ""}
       end >
          Homepage
        </NavLink>
        <NavLink 
          to={"/owner/dashboard"} 
          className={({ isActive }) => isActive ? styles.active : ""}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to={"/owner/menumanagement"} 
          className={({ isActive }) => isActive ? styles.active : ""}
        >
          Management
        </NavLink>

        <NavLink 
          to="/owner/orders"
          className={({ isActive }) => (isActive ? styles.active : "")}
        >
          Orders
        </NavLink>

        <NavLink
          to={"/owner/reservations"}
          className={({ isActive }) => (isActive ? styles.active : "")}
        >
          Reservations
        </NavLink>


      </nav>
      <Outlet />
    </>
  );
}
