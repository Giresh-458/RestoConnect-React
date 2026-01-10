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
        <button onClick={handleLogout} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}>Logout</button>
      </nav>
      <Outlet />
    </>
  );
}
