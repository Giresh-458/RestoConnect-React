import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./OwnerNav.module.css";
import { logout } from "../util/auth";

const navItems = [
  { to: "/owner", icon: "🏠", label: "Home", end: true },
  { to: "/owner/floor", icon: "🪑", label: "Live Floor" },
  { to: "/owner/orders", icon: "📋", label: "Orders" },
  { to: "/owner/reservations", icon: "📅", label: "Reservations" },
  { to: "/owner/menumanagement", icon: "🍽️", label: "Menu" },
  { to: "/owner/inventory", icon: "📦", label: "Inventory" },
  { to: "/owner/staffmanagement", icon: "👥", label: "Staff" },
  { to: "/owner/feedback", icon: "⭐", label: "Feedback" },
  { to: "/owner/promotions", icon: "🏷️", label: "Promos" },
  { to: "/owner/support", icon: "💬", label: "Support" },
  { to: "/owner/settings", icon: "⚙️", label: "Settings" },
];

export function OwnerNav() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error(e); }
    navigate("/login");
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.sidebarHeader}>
          {!collapsed && <span className={styles.brand}>RestoConnect</span>}
          <button className={styles.toggleBtn} onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? "»" : "«"}
          </button>
        </div>
        <nav className={styles.navList}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
              title={item.label}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
            <span className={styles.navIcon}>🚪</span>
            {!collapsed && <span className={styles.navLabel}>Logout</span>}
          </button>
        </div>
      </aside>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
