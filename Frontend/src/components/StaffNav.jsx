import { Outlet, NavLink } from "react-router-dom";
import styles from "./StaffNav.module.css";

export function StaffNav() {
  return (
    <>
      <nav className={styles.staffNav}>
        <NavLink 
          to={"/staff/"} 
          className={({ isActive }) => isActive ? styles.active : ""}
       
       end>
          Homepage
        </NavLink>
        <NavLink 
          to={"/staff/dashboard"} 
          className={({ isActive }) => isActive ? styles.active : ""}
        >
          Dashboard
        </NavLink>
      </nav>
      <Outlet />
    </>
  );
}
