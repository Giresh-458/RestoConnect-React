import { Outlet, NavLink } from "react-router-dom";
import styles from "./CustomerNav.module.css";

export function CustomerNav() {
  return (
    <>
      <nav className={styles.customerNav}>
        <NavLink 
          to={"/customer/dashboard"} 
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to={"/customer/"} 
          className={({ isActive }) => (isActive ? "active" : "")}
        end>
          Home
        </NavLink>
      </nav>
      <Outlet />
    </>
  );
}
