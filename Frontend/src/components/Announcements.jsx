import React from "react";

const Announcements = ({ announcements = [] }) => {
  return (
    <div className="announcements-card">
      <h2>Announcements</h2>
      <div className="announcements-list">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-item">
              <span className="announcement-text">
                {announcement.text}
                {announcement.priority === "high" && (
                  <span className="priority-badge">!</span>
                )}
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
