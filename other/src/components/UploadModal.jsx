import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [invFile, setInvFile] = useState(null);
  const [multFile, setMultFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [errorDetails, setErrorDetails] = useState([]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invFile) {
      setErrorMsg("Please select an Inventory Sales CSV file.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setErrorDetails([]);

    const formData = new FormData();
    formData.append("inventory_file", invFile);
    if (multFile) {
      formData.append("multiplier_file", multFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/upload`, {
        method: "POST",
        body: formData
      });

      const resData = await response.json();
      if (!response.ok) {
        if (typeof resData.detail === 'object') {
          setErrorMsg(resData.detail.message || "CSV validation error");
          setErrorDetails(resData.detail.details || []);
        } else {
          setErrorMsg(resData.detail || "Upload failed");
        }
      } else {
        onUploadSuccess(resData);
        onClose();
      }
    } catch (err) {
      setErrorMsg("Failed to connect to backend server. Make sure FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Upload Custom CSV Datasets</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload new inventory sales data to run calculations in real time</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '0.9rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.8rem',
          color: '#334155',
          lineHeight: 1.55
        }}>
          <div style={{ fontWeight: 600, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Info size={15} /> What file should I upload?
          </div>
          <p>
            A CSV of your inventory, one row per jewelry style. It must include these columns:
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#1d4ed8', margin: '0.35rem 0', wordBreak: 'break-word' }}>
            style_number, last_90_day_sales, current_stock, on_order, event, days_until_event
          </p>
          <p>
            Optional columns like <code>category</code>, <code>metal</code>, <code>stone_type</code>, and <code>last_30_day_sales</code> are welcome too — just leave them out if you don't have them.
            You can also attach a separate multipliers file so we know how much extra demand each event brings.
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1rem', color: '#be123c', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
            {errorDetails.length > 0 && (
              <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem', fontSize: '0.8rem' }}>
                {errorDetails.map((det, i) => <li key={i}>{det}</li>)}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#334155' }}>
              1. Inventory Sales CSV <span style={{ color: '#e11d48' }}>*</span>
            </label>
            <div style={{ border: '2px dashed #e2e8f0', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', background: '#f8fafc', cursor: 'pointer' }}>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setInvFile(e.target.files[0])} 
                id="inv-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="inv-input" style={{ cursor: 'pointer' }}>
                <FileText size={32} color="#d97706" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {invFile ? invFile.name : "Click or drag inventory_sales.csv here"}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Required columns: style_number, last_90_day_sales, current_stock, on_order, event, days_until_event
                </div>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#334155' }}>
              2. Event Multipliers CSV (Optional)
            </label>
            <div style={{ border: '2px dashed #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center', background: '#f8fafc', cursor: 'pointer' }}>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setMultFile(e.target.files[0])} 
                id="mult-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="mult-input" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: multFile ? '#b45309' : '#64748b' }}>
                  {multFile ? multFile.name : "Click or drag event_multipliers.csv here"}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Needs just two columns: event, event_multiplier. Skip this and we'll use sensible defaults.
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Processing..." : "Process Recommendations"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
