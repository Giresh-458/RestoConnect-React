import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import React, { useState, useEffect } from "react";
import WelcomeHeader from "../components/WelcomeHeader";
import Announcements from "../components/Announcements";
import QuickSupport from "../components/QuickSupport";
import ShiftSchedule from "../components/ShiftSchedule";
import TaskTracker from "../components/TaskTracker";
import PerformanceSummary from "../components/PerformanceSummary";
import "../components/StaffHomePage.css";

// Try API route first, then fallback to legacy route if 404
async function fetchWithFallback(primaryUrl, fallbackUrl, options = {}) {
  let res = await fetch(primaryUrl, options);
  if (res && res.status === 404 && fallbackUrl) {
    try {
      res = await fetch(fallbackUrl, options);
    } catch (e) {
     
    }
  }
  return res;
}

export function StaffHomePage() {
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithFallback(
        "http://localhost:3000/api/staff/homepage",
        "http://localhost:3000/staff/homepage",
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        // Try to read error body as text so we don't crash on non‑JSON (e.g. HTML)
        const text = await response.text().catch(() => "");
        throw new Error(
          text && text.startsWith("<")
            ? `Failed to fetch staff data (server returned HTML, status ${response.status}). 
Make sure the backend is running on port 3000 and you are logged in as a staff user.`
            : `Failed to fetch staff data: ${response.status}`
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text().catch(() => "");
        throw new Error(
          text && text.startsWith("<")
            ? "Server returned HTML instead of JSON. Check that the backend /api/staff/homepage route is configured to send JSON and that you are authenticated as staff."
            : "Server response was not JSON. Please check the backend."
        );
      }

      const data = await response.json();
      setStaffData(data);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading your dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">Error: {error}</div>
        <button onClick={fetchStaffData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="staff-homepage">
      <WelcomeHeader staff={staffData?.staff} />

      <div className="main-content">
        <div className="left-column">
          <Announcements announcements={staffData?.announcements || []} />
          <QuickSupport />
        </div>

        <div className="right-column">
          <ShiftSchedule shifts={staffData?.shifts || []} />
          <TaskTracker tasks={staffData?.tasks || []} />
          <PerformanceSummary performance={staffData?.performance || {}} />
        </div>
      </div>
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  if (role !== "staff") {
    return redirect("/login");
  }
  return null;
}
