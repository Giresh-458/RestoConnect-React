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
      </nav>
      <Outlet />
    </>
  );
}
