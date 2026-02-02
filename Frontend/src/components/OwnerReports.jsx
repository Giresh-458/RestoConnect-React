import { useEffect, useState } from "react";
import styles from "./Reports.module.css";

export function Reports() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/owner/reports", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setReportsData(data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate pie chart segments
  const renderPieChart = (data, colors, isTimeOfDay = false) => {
    if (!data || data.values.length === 0) return null;

    const total = data.values.reduce((sum, value) => sum + value, 0);
    let accumulatedPercentage = 0;

    return (
      <div className={styles.pieChartContainer}>
        <div className={styles.pieChart}>
          {data.values.map((value, index) => {
            if (value === 0) return null;

            const percentage = (value / total) * 100;
            const segmentStyle = {
              "--percentage": percentage,
              "--accumulated": accumulatedPercentage,
              "--color": colors[index % colors.length],
            };

            accumulatedPercentage += percentage;

            return (
              <div
                key={index}
                className={styles.pieSegment}
                style={segmentStyle}
                title={`${
                  data.labels[index]
                }: ${value} orders (${percentage.toFixed(1)}%)`}
              ></div>
            );
          })}
        </div>
        <div className={styles.pieLegend}>
          {data.labels.map((label, index) => {
            if (data.values[index] === 0) return null;

            const percentage = (data.values[index] / total) * 100;
            return (
              <div key={index} className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <div className={styles.legendLabel}>
                  {isTimeOfDay ? label : label.slice(0, 3)}
                </div>
                <div className={styles.legendValue}>
                  {data.values[index]} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading reports...</div>;
  }

  if (!reportsData) {
    return <div className={styles.error}>Failed to load reports data</div>;
  }

  // Color palettes for pie charts
  const timeOfDayColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
    "#F9E79F",
    "#A9DFBF",
    "#F5B7B1",
    "#AED6F1",
    "#E8DAEF",
    "#FAD7A0",
    "#ABEBC6",
    "#F5B7B1",
    "#D6EAF8",
    "#EBDEF0",
  ];

  const dayOfWeekColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
  ];

  return (
    <div className={styles.reportsContainer}>
      <h1 className={styles.title}>Reports</h1>



      {/* Revenue Overview Cards */}
      <div className={styles.overviewCards}>
        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>💰</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Total Revenue</div>
            <div className={styles.cardValue}>
              ₹{reportsData.revenue.total.toLocaleString()}
            </div>
          </div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>📦</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Total Orders</div>
            <div className={styles.cardValue}>{reportsData.totalOrders}</div>
          </div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>📊</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Active Days</div>
            <div className={styles.cardValue}>
              {reportsData.revenue.daily.labels.length} days
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Charts (Bar Charts) */}
      <div className={styles.sectionTitle}>Revenue Analytics</div>
      <div className={styles.chartsGrid}>
        {/* Daily Revenue */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Daily Revenue</h3>
          <div className={styles.barChart}>
            {reportsData.revenue.daily.labels.map((label, index) => (
              <div key={label} className={styles.barItem}>
                <div className={styles.barWrapper}>
                  <div
                    className={styles.revenueBar}
                    style={{
                      height: `${Math.max(
                        (reportsData.revenue.daily.values[index] /
                          Math.max(
                            ...reportsData.revenue.daily.values.filter(
                              (val) => val > 0
                            )
                          )) *
                          180,
                        8
                      )}px`,
                    }}
                  ></div>
                </div>
                <div className={styles.barLabel}>
                  {new Date(label).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className={styles.barValue}>
                  ₹{reportsData.revenue.daily.values[index]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Weekly Revenue</h3>
          <div className={styles.barChart}>
            {reportsData.revenue.weekly.labels.map((label, index) => (
              <div key={label} className={styles.barItem}>
                <div className={styles.barWrapper}>
                  <div
                    className={styles.revenueBar}
                    style={{
                      height: `${Math.max(
                        (reportsData.revenue.weekly.values[index] /
                          Math.max(
                            ...reportsData.revenue.weekly.values.filter(
                              (val) => val > 0
                            )
                          )) *
                          180,
                        8
                      )}px`,
                    }}
                  ></div>
                </div>
                <div className={styles.barLabel}>{label.split("-W")[1]}</div>
                <div className={styles.barValue}>
                  ₹{reportsData.revenue.weekly.values[index]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Hours Charts (Pie Charts) */}
      <div className={styles.sectionTitle}>Peak Hours Analysis</div>
      <div className={styles.pieChartsGrid}>
        {/* Peak Hours by Time of Day */}
        <div className={styles.pieChartCard}>
          <h3 className={styles.chartTitle}>Orders by Time of Day</h3>
          {renderPieChart(reportsData.peakHours.byHour, timeOfDayColors, true)}
        </div>

        {/* Peak Hours by Day of Week */}
        <div className={styles.pieChartCard}>
          <h3 className={styles.chartTitle}>Orders by Day of Week</h3>
          {renderPieChart(reportsData.peakHours.byDay, dayOfWeekColors, false)}
        </div>
      </div>

      {/* Insights Section */}
      <div className={styles.insightsSection}>
        <h3 className={styles.insightsTitle}>Business Insights</h3>
        <div className={styles.insightsGrid}>
          <div className={styles.insightItem}>
            <span className={styles.insightLabel}>Best Performing Day:</span>
            <span className={styles.insightValue}>
              {
                reportsData.peakHours.byDay.labels[
                  reportsData.peakHours.byDay.values.indexOf(
                    Math.max(...reportsData.peakHours.byDay.values)
                  )
                ]
              }
            </span>
          </div>
          <div className={styles.insightItem}>
            <span className={styles.insightLabel}>Peak Hour:</span>
            <span className={styles.insightValue}>
              {
                reportsData.peakHours.byHour.labels[
                  reportsData.peakHours.byHour.values.indexOf(
                    Math.max(...reportsData.peakHours.byHour.values)
                  )
                ]
              }
            </span>
          </div>
          <div className={styles.insightItem}>
            <span className={styles.insightLabel}>Highest Revenue Day:</span>
            <span className={styles.insightValue}>
              ₹{Math.max(...reportsData.revenue.daily.values).toLocaleString()}
            </span>
          </div>
          <div className={styles.insightItem}>
            <span className={styles.insightLabel}>Average Daily Revenue:</span>
            <span className={styles.insightValue}>
              ₹
              {Math.round(
                reportsData.revenue.daily.values.reduce((a, b) => a + b, 0) /
                  reportsData.revenue.daily.values.filter((val) => val > 0)
                    .length || 0
              ).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
