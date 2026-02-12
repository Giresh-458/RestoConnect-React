import { redirect, useLoaderData } from "react-router-dom";
import { isLogin, logout } from "../util/auth";
import { useState } from "react";
import "../styles/admin.css";

// Sub-page components
import { AdminDashBoard } from "../components/admin_components/AdminDashBoard";
import User from "../components/admin_components/User";
import { RestaurantSubPage } from "../components/admin_components/RestaurentSubPage";
import { AdminOrders } from "../components/admin_components/AdminOrders";
import { AdminReservations } from "../components/admin_components/AdminReservations";
import { AdminAnalytics } from "../components/admin_components/AdminAnalytics";
import { AdminFeedback } from "../components/admin_components/AdminFeedback";
import { SupportChatPage } from "./SupportChatPage";
import { Settings } from "../components/admin_components/Settings";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "📊", section: "main" },
  { key: "restaurant", label: "Restaurants", icon: "🍽️", section: "main" },
  { key: "orders", label: "Orders", icon: "🧾", section: "operations" },
  { key: "reservations", label: "Reservations", icon: "📅", section: "operations" },
  { key: "user", label: "Users", icon: "👥", section: "management" },
  { key: "analytics", label: "Analytics", icon: "📈", section: "management" },
  { key: "feedback", label: "Reviews", icon: "⭐", section: "management" },
  { key: "support", label: "Support", icon: "💬", section: "management" },
  { key: "settings", label: "Settings", icon: "⚙️", section: "system" },
];

const SECTION_LABELS = {
  main: "Overview",
  operations: "Operations",
  management: "Management",
  system: "System",
};

const PAGE_META = {
  dashboard: { title: "Dashboard", subtitle: "Platform overview and key metrics" },
  restaurant: { title: "Restaurant Management", subtitle: "Manage all restaurant listings" },
  orders: { title: "Orders", subtitle: "Track orders across all restaurants" },
  reservations: { title: "Reservations", subtitle: "Manage dining reservations" },
  user: { title: "User Management", subtitle: "Manage platform users" },
  analytics: { title: "Analytics & Reports", subtitle: "Revenue, performance & insights" },
  feedback: { title: "Reviews & Feedback", subtitle: "Customer reviews and ratings" },
  support: { title: "Support Tickets", subtitle: "Handle customer & owner issues" },
  settings: { title: "Settings", subtitle: "Account and platform settings" },
};

function AdminSidebar({ subPage, setSubPage, adminName }) {
  const sections = [...new Set(NAV_ITEMS.map((n) => n.section))];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <h2>
          <span className="brand-resto">RESTO</span>
          <span className="brand-connect">CONNECT</span>
        </h2>
        <div className="brand-tag">Admin Panel</div>
      </div>

      <nav className="admin-sidebar-nav">
        {sections.map((section) => (
          <div key={section} className="admin-nav-section">
            <div className="admin-nav-section-title">{SECTION_LABELS[section]}</div>
            {NAV_ITEMS.filter((n) => n.section === section).map((item) => (
              <div
                key={item.key}
                className={`admin-nav-item${subPage === item.key ? " active" : ""}`}
                onClick={() => setSubPage(item.key)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-info">
          <div className="admin-avatar">
            {(adminName || "A").charAt(0).toUpperCase()}
          </div>
          <div className="admin-user-details">
            <div className="name">{adminName || "Admin"}</div>
            <div className="role">Administrator</div>
          </div>
        </div>
        <button
          className="admin-logout-btn"
          onClick={async () => {
            try { await logout(); } catch (e) { console.error(e); }
            window.location.href = "/login";
          }}
        >
          <span>🚪</span> <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function AdminTopbar({ subPage }) {
  const meta = PAGE_META[subPage] || { title: "", subtitle: "" };
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="admin-topbar">
      <div className="admin-topbar-title">
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>
      <div className="admin-topbar-actions">
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{dateStr}</span>
      </div>
    </div>
  );
}

export function AdminPage() {
  const data = useLoaderData();
  const [subPage, setSubPage] = useState("dashboard");

  const adminName = data.current_admin?.username || data.current_admin?.fullname || "Admin";

  return (
    <div className="admin-layout">
      <AdminSidebar subPage={subPage} setSubPage={setSubPage} adminName={adminName} />
      <div className="admin-main">
        <AdminTopbar subPage={subPage} />
        <div className="admin-content">
          {subPage === "dashboard" && (
            <AdminDashBoard
              totalusers={data.total_user_count}
              totalrestaurants={data.restaurants_list.length}
              restaurants={data.restaurants_list}
            />
          )}
          {subPage === "user" && <User />}
          {subPage === "restaurant" && <RestaurantSubPage />}
          {subPage === "orders" && <AdminOrders />}
          {subPage === "reservations" && <AdminReservations />}
          {subPage === "analytics" && <AdminAnalytics />}
          {subPage === "feedback" && <AdminFeedback />}
          {subPage === "support" && <SupportChatPage mode="admin" />}
          {subPage === "settings" && <Settings data={data.current_admin} />}
        </div>
      </div>
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  if (role !== "admin") return redirect("/login");

  const res = await fetch("http://localhost:3000/api/admin/dashboard", {
    credentials: "include",
  });
  if (!res.ok) return redirect("/login");
  return res.json();
}
