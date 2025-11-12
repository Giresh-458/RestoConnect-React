import React from "react";

const WelcomeHeader = ({ staff }) => {
  return (
    <div className="welcome-header">
      <h1>RestoConnect – Staff Home Page</h1>
      <p className="tagline">
        Manage your shifts, updates, and performance — all in one place.
      </p>

      <div className="welcome-section">
        <h2>Welcome, {staff?.name || "Staff Member"}</h2>
        <div className="staff-info">
          <p>
            <strong>Role:</strong> {staff?.role || "Role"} |{" "}
            <strong>Branch:</strong> {staff?.branch || "Restaurant"}
          </p>
          <p className="quote">
            "Service with a smile makes all the difference."
          </p>
        </div>
      </div>

      <hr className="divider" />
    </div>
  );
};

export default WelcomeHeader;
