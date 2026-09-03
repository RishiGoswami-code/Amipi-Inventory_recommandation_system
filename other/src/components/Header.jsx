import React from 'react';
import { Gem, Upload } from 'lucide-react';

export default function Header({ onOpenUpload }) {
  return (
    <header className="header">
      <div className="logo-group">
        <div className="logo-icon">
          <Gem size={18} />
        </div>
        <div>
          <h1 className="logo-title">AMIPI Restock IQ</h1>
          <p className="logo-subtitle">Event-Aware Jewelry Restocking Recommendation System</p>
        </div>
      </div>

      <div className="header-actions">
        <button className="btn btn-primary" onClick={onOpenUpload} title="Upload CSV Dataset">
          <Upload size={15} />
          Upload CSV
        </button>
      </div>
    </header>
  );
}
