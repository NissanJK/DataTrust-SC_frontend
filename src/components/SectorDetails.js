import React, { useEffect, useState, useCallback } from "react";
import API from "../api/api";
import "./SectorDetails.css";

export default function SectorDetails({ sector }) {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSectorData = useCallback(async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        API.get("/disaster/sectors/stats"),
        API.get(`/disaster/alerts/${sector}`)
      ]);

      setStats(statsRes.data.sectors[sector]);
      setAlerts(alertsRes.data.alerts || []);
    } catch (err) {
      console.error("Failed to fetch sector data:", err);
    } finally {
      setLoading(false);
    }
  }, [sector]);

  useEffect(() => {
    if (sector && sector !== "ALL") {
      fetchSectorData();
      const interval = setInterval(fetchSectorData, 5000);
      return () => clearInterval(interval);
    }
  }, [sector, fetchSectorData]);

  if (!sector || sector === "ALL") {
    return null;
  }

  if (loading) {
    return <div className="sector-loading">Loading sector details...</div>;
  }

  if (!stats) {
    return <div className="sector-error">No data available for {sector}</div>;
  }

  return (
    <div className="sector-details">
      <div className="sector-header">
        <h3>{sector.toUpperCase()} - Detailed Monitoring</h3>
        <div className={`overall-status ${stats.status.toLowerCase()}`}>
          {stats.status}
        </div>
      </div>

      {/* Current Readings */}
      <div className="metrics-grid">
        {/* Temperature */}
        <div className="metric-card">
          <div className="metric-icon">🌡️</div>
          <div className="metric-info">
            <div className="metric-label">Temperature</div>
            <div className="metric-value">
              {stats.latest.temperature !== null 
                ? `${stats.latest.temperature}°C` 
                : "No data"}
            </div>
            <div className="metric-average">
              Avg: {stats.averages.temperature !== null 
                ? `${stats.averages.temperature}°C` 
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Air Quality */}
        <div className="metric-card">
          <div className="metric-icon">💨</div>
          <div className="metric-info">
            <div className="metric-label">Air Quality Index</div>
            <div className="metric-value">
              {stats.latest.aqi !== null 
                ? stats.latest.aqi 
                : "No data"}
            </div>
            <div className="metric-average">
              Avg: {stats.averages.aqi !== null 
                ? stats.averages.aqi 
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Traffic */}
        <div className="metric-card">
          <div className="metric-icon">🚗</div>
          <div className="metric-info">
            <div className="metric-label">Traffic Density</div>
            <div className="metric-value">
              {stats.latest.traffic !== null 
                ? stats.latest.traffic 
                : "No data"}
            </div>
            <div className="metric-average">
              Avg: {stats.averages.traffic !== null 
                ? stats.averages.traffic 
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Energy */}
        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-info">
            <div className="metric-label">Energy (kWh)</div>
            <div className="metric-value">
              {stats.latest.energy !== null 
                ? `${stats.latest.energy} kWh` 
                : "No data"}
            </div>
            <div className="metric-average">
              Avg: {stats.averages.energy !== null 
                ? `${stats.averages.energy} kWh` 
                : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Sector Alerts */}
      <div className="sector-alerts">
        <h4>Active Alerts for {sector.toUpperCase()} ({alerts.length})</h4>
        {alerts.length === 0 ? (
          <div className="no-sector-alerts">
            ✅ No active alerts for this sector
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div key={index} className="sector-alert-item">
              <div className="alert-severity" style={{
                color: alert.severity === "CRITICAL" ? "#dc3545" : 
                       alert.severity === "WARNING" ? "#fd7e14" : "#ffc107"
              }}>
                {alert.severity}
              </div>
              <div className="alert-message">{alert.message}</div>
            </div>
          ))
        )}
      </div>

      <div className="last-update">
        Last updated: {new Date(stats.latest.timestamp).toLocaleString()}
      </div>
    </div>
  );
}