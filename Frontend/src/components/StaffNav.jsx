import { Outlet, NavLink } from "react-router-dom";
import styles from "./StaffNav.module.css";

export function StaffNav() {
  return (
    <>
      <nav className={styles.staffNav}>
        <NavLink 
          to={"/staff/"} 
          className={({ isActive }) => (isActive ? "active" : "")}
       
       end>
          Home
        </NavLink>
        <NavLink 
          to={"/staff/dashboard"} 
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Dashboard
        </NavLink>
      </nav>
      <Outlet />
    </>
  );
}
