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

      const response = await fetch("http://localhost:3000/api/staff/homepage", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch staff data: ${response.status}`);
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
