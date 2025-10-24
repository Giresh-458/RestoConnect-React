import { redirect, useLoaderData } from "react-router-dom";
import { isLogin } from "../util/auth";
import User from '../components/admin_components/User';
import { AdminDashBoard } from "../components/admin_components/AdminDashBoard";
import { Settings } from "../components/admin_components/Settings";
import { RestaurantSubPage } from "../components/admin_components/RestaurentSubPage";
import { useState } from "react";
import "../styles/admin_page_styles.css"; // ✅ main CSS for dashboard + layout

// Sample Sidebar component
export default function Sidebar({ setSubPage, subPage }) {
  return (
<div className="sidebar">
  <h3 className="sidebar-title">
    <span className="resto-text">RESTO</span>
    <span className="connect-text">CONNECT</span>
  </h3>
  <ul>
    <li className={subPage === "dashboard" ? "active" : ""} onClick={() => setSubPage("dashboard")}>Dashboard</li>
    <li className={subPage === "user" ? "active" : ""} onClick={() => setSubPage("user")}>User Management</li>
    <li className={subPage === "restaurant" ? "active" : ""} onClick={() => setSubPage("restaurant")}>Restaurant Management</li>
    <li className={subPage === "settings" ? "active" : ""} onClick={() => setSubPage("settings")}>Settings</li>
  </ul>
</div>

  );
}

export function AdminPage() {
  let data = useLoaderData();
  const [subPage, setSubPage] = useState("dashboard");

  return (
    <div className="admin-layout">
      <Sidebar setSubPage={setSubPage} subPage={subPage} />
      <div className="dashboard-content">
        {subPage === "dashboard" && <AdminDashBoard totalusers={data.total_user_count} totalrestaurants={data.restaurants_list.length} />}
        {subPage === "user" && <User />}
        {subPage === "restaurant" && <RestaurantSubPage />}
        {subPage === "settings" && <Settings data={data.current_admin} />}
      </div>
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  if (role !== 'admin') return redirect('/login');

  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/admin/dashboard", true);
    xhr.withCredentials = true;
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      }
    };
    xhr.send();
  });
}
