const PerformanceSummary = ({ performance = {} }) => {
  const performanceData = {
    ordersServed: performance.ordersServed || 0,
    avgRating: performance.avgRating || 0,
    avgServeTime: performance.avgServeTime || 0,
    efficiencyScore: performance.efficiencyScore || 0,
  };

  return (
    <div className="performance-summary-card">
      <h2>Performance Summary</h2>

      <div className="performance-stats">
        <div className="stat-item">
          <span className="stat-label">Orders Served Today:</span>
          <span className="stat-value">{performanceData.ordersServed}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Avg Feedback Rating:</span>
          <span className="stat-value">{performanceData.avgRating} / 5</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Avg Serve Time:</span>
          <span className="stat-value">
            {performanceData.avgServeTime} mins
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Efficiency Score:</span>
          <span className="stat-value">{performanceData.efficiencyScore}%</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceSummary;
