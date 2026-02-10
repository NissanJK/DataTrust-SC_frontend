import React, { useEffect, useState } from "react";
import API from "../api/api";

export default function BlockchainLog() {
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("ALL"); // ALL, DATA_REGISTER, ACCESS_REQUEST

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // FIXED: Get all logs without limit
                const res = await API.get("/access/logs");
                setLogs(res.data);
                setError("");
            } catch (err) {
                console.error("Failed to fetch logs:", err);
                setError("Failed to load logs");
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 3000);
        return () => clearInterval(interval);
    }, []);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const formatLog = (log) => {
        const parts = [];
        
        parts.push(`[${formatDate(log.timestamp)}]`);
        
        // Type with icon
        if (log.type === "DATA_REGISTER") {
            parts.push("📝 DATA_REGISTER");
        } else {
            parts.push("🔐 ACCESS_REQUEST");
        }
        
        parts.push(`Hash: ${log.hash?.substring(0, 16)}...`);
        
        if (log.owner) {
            parts.push(`Owner: ${log.owner}`);
        }
        
        if (log.role) {
            parts.push(`Role: ${log.role}`);
        }
        
        if (log.attribute) {
            parts.push(`Attribute: ${log.attribute}`);
        }
        
        if (log.policy && log.type === "DATA_REGISTER") {
            parts.push(`Policy: ${log.policy}`);
        }
        
        if (log.granted !== undefined) {
            parts.push(`Granted: ${log.granted ? '✅ YES' : '❌ NO'}`);
        }
        
        return parts.join(" | ");
    };

    const filteredLogs = logs.filter(log => {
        if (filter === "ALL") return true;
        return log.type === filter;
    });

    return (
        <div className="card blockchain-card">
            <div className="blockchain-header">
                <h3>⛓️ Blockchain Audit Log</h3>
                <div className="log-stats">
                    <span className="stat-badge">{logs.length} Total Logs</span>
                </div>
            </div>

            {/* Filter */}
            <div className="log-filter">
                <label>Filter by Type:</label>
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="ALL">All Logs</option>
                    <option value="DATA_REGISTER">📝 Data Registrations</option>
                    <option value="ACCESS_REQUEST">🔐 Access Requests</option>
                </select>
            </div>
            
            {error && <div className="error">{error}</div>}
            
            {/* FIXED: Scrollable log container with unlimited data */}
            <div className="log-container">
                {filteredLogs.length === 0 ? (
                    <div className="no-logs">
                        No logs available yet
                    </div>
                ) : (
                    filteredLogs.map((l, i) => (
                        <div 
                            key={i} 
                            className={`log-entry ${l.type.toLowerCase()}`}
                        >
                            <div className="log-content">
                                {formatLog(l)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
