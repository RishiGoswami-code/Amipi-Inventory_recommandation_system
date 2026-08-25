import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import InventoryTable from './components/InventoryTable';
import DetailModal from './components/DetailModal';
import UploadModal from './components/UploadModal';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from './config';

export default function App() {
  const [data, setData] = useState({
    items: [],
    total_items: 0,
    high_priority_count: 0,
    medium_priority_count: 0,
    low_priority_count: 0,
    do_not_reorder_count: 0,
    total_suggested_reorder_units: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [eventFilter, setEventFilter] = useState('All');

  // Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/default?use_ai=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(`Unable to connect to backend API (${API_BASE_URL}). Ensure the FastAPI server is running.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter items
  const filteredItems = (data.items || []).filter(item => {
    // Priority filter
    if (priorityFilter !== 'All' && item.priority !== priorityFilter) {
      return false;
    }
    // Event filter
    if (eventFilter !== 'All' && item.event !== eventFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchStyle = item.style_number.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchMetal = (item.metal || '').toLowerCase().includes(q);
      const matchStone = (item.stone_type || '').toLowerCase().includes(q);
      const matchEvent = item.event.toLowerCase().includes(q);
      return matchStyle || matchCat || matchMetal || matchStone || matchEvent;
    }
    return true;
  });

  // Extract unique events for dropdown
  const uniqueEvents = Array.from(new Set((data.items || []).map(i => i.event)));

  return (
    <div className="app-container">
      <Header onOpenUpload={() => setIsUploadOpen(true)} />

      {error && (
        <div style={{
          background: 'rgba(225, 29, 72, 0.08)',
          border: '1px solid rgba(225, 29, 72, 0.3)',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          color: '#be123c',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={20} />
          <div>
            <strong>Backend API Error:</strong> {error}
          </div>
        </div>
      )}

      <SummaryCards metrics={data} />

      <div className="control-bar">
        <div className="search-box">
          <Search className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by Style #, Category, Metal, Stone, or Event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="tabs-group">
          {['All', 'High', 'Medium', 'Low', 'Do Not Reorder'].map(tab => (
            <button 
              key={tab}
              className={`tab-btn ${priorityFilter === tab ? 'active' : ''}`}
              onClick={() => setPriorityFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#64748b" />
          <select 
            className="filter-select"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="All">All Events</option>
            {uniqueEvents.map(evt => (
              <option key={evt} value={evt}>{evt}</option>
            ))}
          </select>
        </div>
      </div>

      <InventoryTable 
        items={filteredItems}
        onSelectItem={(item) => setSelectedItem(item)}
      />

      {/* Modals */}
      <DetailModal 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(newData) => setData(newData)}
      />
    </div>
  );
}
