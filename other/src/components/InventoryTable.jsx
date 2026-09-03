import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Info, AlertTriangle, CheckCircle, Ban, Clock } from 'lucide-react';

export default function InventoryTable({ items, onSelectItem }) {
  const [sortField, setSortField] = useState('priority');
  const [sortAsc, setSortAsc] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const showReasonTooltip = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const showAbove = rect.top > 140;
    setTooltip({
      text,
      left: rect.left + rect.width / 2,
      top: showAbove ? rect.top - 10 : rect.bottom + 10,
      placement: showAbove ? 'above' : 'below'
    });
  };

  const hideReasonTooltip = () => setTooltip(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getPriorityWeight = (priority) => {
    switch (priority) {
      case 'High': return 4;
      case 'Medium': return 3;
      case 'Low': return 2;
      case 'Do Not Reorder': return 1;
      default: return 0;
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'priority') {
      valA = getPriorityWeight(a.priority);
      valB = getPriorityWeight(b.priority);
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;

    // Tie-break: suggested_order_qty is the gap between what's needed and what's
    // available (recommended_stock_needed - available_inventory). Within the same
    // priority (or any other tied sort key), the item with the bigger gap is more
    // urgent, so it goes first.
    return b.suggested_order_qty - a.suggested_order_qty;
  });

  const renderBadge = (priority) => {
    switch (priority) {
      case 'High':
        return <span className="badge badge-high"><AlertTriangle size={12} /> High</span>;
      case 'Medium':
        return <span className="badge badge-medium"><Clock size={12} /> Medium</span>;
      case 'Low':
        return <span className="badge badge-low"><CheckCircle size={12} /> Low</span>;
      case 'Do Not Reorder':
        return <span className="badge badge-dnr"><Ban size={12} /> Do Not Reorder</span>;
      default:
        return <span className="badge">{priority}</span>;
    }
  };

  return (
    <div className="table-container">
      <table className="inventory-table">
        <colgroup>
          <col className="col-style" />
          <col className="col-priority" />
          <col className="col-qty" />
          <col className="col-stock" />
          <col className="col-event" />
          <col className="col-reason" />
          <col className="col-details" />
        </colgroup>
        <thead>
          <tr>
            <th onClick={() => handleSort('style_number')} style={{ cursor: 'pointer' }}>
              Style {sortField === 'style_number' && (sortAsc ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>
              Priority {sortField === 'priority' && (sortAsc ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('suggested_order_qty')} style={{ cursor: 'pointer' }}>
              Order Qty {sortField === 'suggested_order_qty' && (sortAsc ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('available_inventory')} style={{ cursor: 'pointer' }}>
              Stock &amp; Sales
            </th>
            <th>Event</th>
            <th>Business Rationale</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-state">
                No inventory records match your criteria.
              </td>
            </tr>
          ) : (
            sortedItems.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <div className="style-cell">
                    <span className="style-number">{item.style_number}</span>
                    <div className="style-tags">
                      <span className="mini-tag">{item.category}</span>
                      {item.metal && <span className="mini-tag">{item.metal}</span>}
                      {item.stone_type && <span className="mini-tag">{item.stone_type}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  {renderBadge(item.priority)}
                </td>
                <td>
                  <span className={`order-pill ${item.suggested_order_qty > 0 ? 'order-pill-reorder' : 'order-pill-zero'}`}>
                    {item.suggested_order_qty}
                  </span>
                </td>
                <td>
                  <div className="cell-main">{item.available_inventory} avail</div>
                  <div className="cell-sub">{item.current_stock} stock + {item.on_order} ordered</div>
                  <div className="cell-sub">{item.last_90_day_sales} sold / 90d</div>
                </td>
                <td>
                  <div className="cell-main">{item.event}</div>
                  <div className="cell-sub-accent">{item.days_until_event}d away · {item.event_multiplier}x</div>
                </td>
                <td>
                  <p
                    className="reason-text"
                    onMouseEnter={(e) => showReasonTooltip(e, item.reason)}
                    onMouseLeave={hideReasonTooltip}
                  >
                    {item.reason}
                  </p>
                </td>
                <td>
                  <button
                    className="btn btn-secondary icon-btn"
                    onClick={() => onSelectItem(item)}
                    title="View full calculation & reason"
                    aria-label="View calculation formula breakdown"
                  >
                    <Info size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {tooltip && (
        <div
          className="reason-tooltip"
          style={{
            top: tooltip.top,
            left: tooltip.left,
            transform: tooltip.placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
