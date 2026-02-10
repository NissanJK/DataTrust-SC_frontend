import React, { useEffect, useState, useCallback } from "react";
import API from "../api/api";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from "recharts";
import "./Analytics.css";

export default function Analytics() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all"); // all, hour, day

  const fetchData = useCallback(async () => {
    try {
      const res = await API.get("/dataset");
      const datasets = res.data;

      // Filter by time range
      let filteredData = datasets;
      if (timeRange === "hour") {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        filteredData = datasets.filter(d => new Date(d.createdAt) >= oneHourAgo);
      } else if (timeRange === "day") {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        filteredData = datasets.filter(d => new Date(d.createdAt) >= oneDayAgo);
      }

      setData(filteredData);
      calculateStats(filteredData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const calculateStats = (datasets) => {
    if (datasets.length === 0) {
      setStats(null);
      return;
    }

    // Gas cost statistics
    const gasCosts = datasets
      .map(d => d.metadata.Blockchain_Tx_Cost_Gas)
      .filter(g => g !== null && g !== undefined);

    const avgGas = gasCosts.reduce((a, b) => a + b, 0) / gasCosts.length;
    const minGas = Math.min(...gasCosts);
    const maxGas = Math.max(...gasCosts);

    // Latency statistics
    const latencies = datasets
      .map(d => d.metadata.Authorization_Latency_sec)
      .filter(l => l !== null && l !== undefined);

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    // Sector distribution
    const sectorCounts = {};
    datasets.forEach(d => {
      const sector = d.metadata.Sector || 'unknown';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    // Provider distribution
    const providerCounts = {};
    datasets.forEach(d => {
      const provider = d.metadata.Data_Provider_Type || 'unknown';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });

    setStats({
      gas: {
        avg: avgGas.toFixed(0),
        min: minGas,
        max: maxGas,
        total: gasCosts.reduce((a, b) => a + b, 0)
      },
      latency: {
        avg: avgLatency.toFixed(2),
        min: minLatency.toFixed(2),
        max: maxLatency.toFixed(2)
      },
      sectors: sectorCounts,
      providers: providerCounts,
      totalRecords: datasets.length
    });
  };

  // Prepare data for Gas Cost vs Latency (Scatter Plot)
  const getGasVsLatency = () => {
    return data
      .slice(-50)
      .map(d => ({
        gas: d.metadata.Blockchain_Tx_Cost_Gas,
        latency: d.metadata.Authorization_Latency_sec
      }));
  };

  // Prepare data for Gas Cost Over Time (Line Chart)
  const getGasCostOverTime = () => {
    return data
      .filter(d => d.metadata.Blockchain_Tx_Cost_Gas)
      .slice(-50) // Last 50 records
      .map((d, idx) => ({
        index: idx + 1,
        gas: d.metadata.Blockchain_Tx_Cost_Gas,
        time: new Date(d.createdAt).toLocaleTimeString()
      }));
  };

  // Prepare data for Latency Over Time (Area Chart)
  const getLatencyOverTime = () => {
    return data
      .filter(d => d.metadata.Authorization_Latency_sec)
      .slice(-50) // Last 50 records
      .map((d, idx) => ({
        index: idx + 1,
        latency: d.metadata.Authorization_Latency_sec,
        time: new Date(d.createdAt).toLocaleTimeString()
      }));
  };

  // Prepare data for Gas Cost by Sector (Bar Chart)
  const getGasBySector = () => {
    const sectorGas = {};
    const sectorCounts = {};

    data.forEach(d => {
      const sector = d.metadata.Sector || 'unknown';
      const gas = d.metadata.Blockchain_Tx_Cost_Gas;

      if (gas) {
        sectorGas[sector] = (sectorGas[sector] || 0) + gas;
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      }
    });

    return Object.keys(sectorGas).map(sector => ({
      sector,
      avgGas: Math.round(sectorGas[sector] / sectorCounts[sector]),
      totalGas: sectorGas[sector],
      count: sectorCounts[sector]
    }));
  };

  // Prepare data for Latency by Provider (Bar Chart)
  const getLatencyByProvider = () => {
    const providerLatency = {};
    const providerCounts = {};

    data.forEach(d => {
      const provider = d.metadata.Data_Provider_Type || 'unknown';
      const latency = d.metadata.Authorization_Latency_sec;

      if (latency) {
        providerLatency[provider] = (providerLatency[provider] || 0) + latency;
        providerCounts[provider] = (providerCounts[provider] || 0) + 1;
      }
    });

    return Object.keys(providerLatency).map(provider => ({
      provider: provider.replace(' ', '\n'), // Line break for readability
      avgLatency: parseFloat((providerLatency[provider] / providerCounts[provider]).toFixed(2)),
      count: providerCounts[provider]
    }));
  };

  // Prepare data for Sector Distribution (Pie Chart)
  const getSectorDistribution = () => {
    if (!stats) return [];
    return Object.keys(stats.sectors).map(sector => ({
      name: sector,
      value: stats.sectors[sector]
    }));
  };

  // Prepare data for Gas Cost Distribution (Histogram)
  const getGasCostDistribution = () => {
    const bins = [
      { range: '40-45k', min: 40000, max: 45000, count: 0 },
      { range: '45-50k', min: 45000, max: 50000, count: 0 },
      { range: '50-55k', min: 50000, max: 55000, count: 0 },
      { range: '55-60k', min: 55000, max: 60000, count: 0 },
      { range: '60-65k', min: 60000, max: 65000, count: 0 },
      { range: '65-70k', min: 65000, max: 70000, count: 0 }
    ];

    data.forEach(d => {
      const gas = d.metadata.Blockchain_Tx_Cost_Gas;
      if (gas) {
        bins.forEach(bin => {
          if (gas >= bin.min && gas < bin.max) {
            bin.count++;
          }
        });
      }
    });

    return bins;
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h2>📊 Blockchain Analytics Dashboard</h2>
          <p className="subtitle">Real-time Gas Costs & Latency Monitoring</p>
        </div>

        <div className="time-range-selector">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="all">All Data</option>
            <option value="day">Last 24 Hours</option>
            <option value="hour">Last Hour</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">⛽</div>
            <div className="stat-info">
              <div className="stat-label">Avg Gas Cost</div>
              <div className="stat-value">{stats.gas.avg}</div>
              <div className="stat-range">Range: {stats.gas.min} - {stats.gas.max}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <div className="stat-label">Avg Latency</div>
              <div className="stat-value">{stats.latency.avg}s</div>
              <div className="stat-range">Range: {stats.latency.min}s - {stats.latency.max}s</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <div className="stat-label">Total Gas Used</div>
              <div className="stat-value">{(stats.gas.total / 1000).toFixed(1)}k</div>
              <div className="stat-range">{stats.totalRecords} transactions</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <div className="stat-label">Total Records</div>
              <div className="stat-value">{stats.totalRecords}</div>
              <div className="stat-range">Across {Object.keys(stats.sectors).length} sectors</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">

        {/* Gas Cost Over Time - Line Chart */}
        <div className="chart-card full-width">
          <h3>⛽ Gas Cost Over Time (Last 50 Transactions)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getGasCostOverTime()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" label={{ value: 'Transaction #', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Gas Cost', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="gas" stroke="#667eea" strokeWidth={2} dot={{ r: 3 }} name="Gas Cost" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Latency Over Time - Area Chart */}
        <div className="chart-card full-width">
          <h3>⏱️ Authorization Latency Over Time (Last 50 Transactions)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getLatencyOverTime()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" label={{ value: 'Transaction #', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Latency (seconds)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="latency" stroke="#764ba2" fill="#764ba2" fillOpacity={0.6} name="Latency (s)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gas Cost by Sector - Bar Chart */}
        <div className="chart-card">
          <h3>⛽ Average Gas Cost by Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getGasBySector()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sector" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgGas" fill="#667eea" name="Avg Gas Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latency by Provider - Bar Chart */}
        <div className="chart-card">
          <h3>⏱️ Average Latency by Provider</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getLatencyByProvider()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgLatency" fill="#764ba2" name="Avg Latency (s)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sector Distribution - Pie Chart */}
        <div className="chart-card">
          <h3>📊 Data Distribution by Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getSectorDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getSectorDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gas Cost Distribution - Histogram */}
        <div className="chart-card">
          <h3>📊 Gas Cost Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getGasCostDistribution()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" label={{ value: 'Gas Cost Range', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#43e97b" name="Transaction Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gas Cost vs Latency */}
      <div className="chart-card">
        <h3>⛽ Gas Cost vs Latency</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid />
            <XAxis dataKey="gas" name="Gas Cost" />
            <YAxis dataKey="latency" name="Latency" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={getGasVsLatency()} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table Summary */}
      <div className="summary-table">
        <h3>📋 Detailed Statistics</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Average</th>
              <th>Minimum</th>
              <th>Maximum</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>⛽ Gas Cost</td>
              <td>{stats?.gas.avg}</td>
              <td>{stats?.gas.min}</td>
              <td>{stats?.gas.max}</td>
              <td>{stats?.gas.total.toLocaleString()}</td>
            </tr>
            <tr>
              <td>⏱️ Latency (seconds)</td>
              <td>{stats?.latency.avg}</td>
              <td>{stats?.latency.min}</td>
              <td>{stats?.latency.max}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
