import React, { useState } from "react";
import API from "../api/api";

export default function ImportDataset() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // FIXED: File validation
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError("Please select a CSV file");
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError("File size must be less than 10MB");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError("");
      setStatus("");
    }
  };

  const importCSV = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setStatus("Importing dataset...");
    setError("");

    try {
      const res = await API.post("/dataset/import", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // FIXED: Show detailed import results
      const { imported, errors, total } = res.data;
      setStatus(`✅ Import complete!\nImported: ${imported}/${total} records${errors > 0 ? `\nErrors: ${errors}` : ''}`);
      setFile(null); // Clear file after successful import
      
      // FIXED: Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Import failed";
      setError(`❌ ${errorMsg}`);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Import Dataset</h3>
      
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange}
        disabled={loading}
      />
      
      {file && (
        <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}
      
      <button 
        onClick={importCSV} 
        disabled={!file || loading}
      >
        {loading ? "Importing..." : "Import Dataset"}
      </button>
      
      {error && <div className="error" style={{ whiteSpace: "pre-wrap" }}>{error}</div>}
      {status && <div className="status" style={{ whiteSpace: "pre-wrap" }}>{status}</div>}
    </div>
  );
}
