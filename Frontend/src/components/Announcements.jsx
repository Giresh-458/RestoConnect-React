import React from "react";

const Announcements = ({ announcements = [] }) => {
  return (
    <div className="announcements-card">
      <h2>Announcements</h2>
      <div className="announcements-list">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-item">
              <div className="announcement-icon">
                {announcement.priority === "high" ? "⚠️" : "📢"}
              </div>
              <span className="announcement-text">
                {announcement.text}
              </span>
            </div>
          ))
        ) : (
          <p className="no-data">No announcements for today</p>
        )}
      </div>
    </div>
  );
};

export default Announcements;
