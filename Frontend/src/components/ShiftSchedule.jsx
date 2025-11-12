const ShiftSchedule = ({ shifts = [] }) => {
  return (
    <div className="shift-schedule-card">
      <h2>Today's Shifts</h2>
      <div className="shifts-list">
        {shifts.length > 0 ? (
          shifts.map((shift) => (
            <div key={shift.id} className="shift-item">
              <div className="shift-details">
                <span className="shift-name">
                  {shift.name}: {shift.time}
                </span>
                <span className="shift-staff">({shift.staff.join(", ")})</span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No shifts scheduled for today</p>
        )}
      </div>
    </div>
  );
};

export default ShiftSchedule;
