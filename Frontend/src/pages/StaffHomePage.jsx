import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Announcements from "../components/Announcements";
import QuickSupport from "../components/QuickSupport";
import ShiftSchedule from "../components/ShiftSchedule";
import TaskTracker from "../components/TaskTracker";
import PerformanceSummary from "../components/PerformanceSummary";
import "../components/StaffHomePage.css";

export function StaffHomePage() {
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStaffData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchStaffData(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStaffData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch("http://localhost:3000/staff/homepage", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
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
            ? "Server returned HTML instead of JSON. Check that the backend /staff/homepage route is configured to send JSON and that you are authenticated as staff."
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

  const handleRefresh = () => {
    fetchStaffData();
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <div className="error-message">{error}</div>
        <button onClick={handleRefresh} className="retry-button">
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="staff-homepage">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-card">
          <h2>Welcome, <span className="staff-name">{staffData?.staff?.name || "Staff Member"}</span></h2>
          <div className="staff-details">
            <div className="detail-item">
              <span className="label">Role:</span>
              <span className="value">{staffData?.staff?.role || "Not assigned"}</span>
            </div>
            <div className="detail-item">
              <span className="label">Branch:</span>
              <span className="value">{staffData?.staff?.branch || "Not assigned"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="main-content">
        <div className="section-title">Today’s Overview</div>
        <div className="content-grid">
          <Announcements announcements={staffData?.announcements || []} />
          <PerformanceSummary performance={staffData?.performance || {}} />
          <ShiftSchedule shifts={staffData?.shifts || []} />
          <TaskTracker tasks={staffData?.tasks || []} onUpdate={handleRefresh} />
        </div>

        <div className="support-full">
          <QuickSupport messages={staffData?.supportMessages || []} onUpdate={handleRefresh} />
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
