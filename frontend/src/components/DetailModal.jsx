import React from 'react';
import { X, Calculator, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DetailModal({ item, onClose }) {
  if (!item) return null;

  const isOverride = item.last_90_day_sales <= 3 && item.current_stock >= 8;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>Calculation Formula Inspector</div>
            <h2 className="modal-title">{item.style_number} ({item.metal} {item.stone_type} {item.category})</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {isOverride && (
          <div style={{
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            color: '#6d28d9',
            fontSize: '0.85rem'
          }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <ShieldAlert size={16} /> Override Rule Triggered (Do Not Reorder)
            </strong>
            Triggered because 90-day sales ({item.last_90_day_sales}) &le; 3 AND current stock ({item.current_stock}) &ge; 8. This rule overrides normal priority calculation.
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calculator size={16} /> Step-by-Step Deterministic Formula Evaluation
          </h3>

          <div className="formula-step">
            <span className="formula-label">1. Available Inventory = current_stock + on_order</span>
            <span className="formula-val">{item.current_stock} + {item.on_order} = {item.available_inventory} units</span>
          </div>

          <div className="formula-step">
            <span className="formula-label">2. Monthly Sales Rate = last_90_day_sales / 3</span>
            <span className="formula-val">{item.last_90_day_sales} / 3 = {item.monthly_sales_rate} /mo</span>
          </div>

          <div className="formula-step">
            <span className="formula-label">3. Projected Demand = monthly_sales_rate * (days_until_event / 30)</span>
            <span className="formula-val">{item.monthly_sales_rate} * ({item.days_until_event} / 30) = {item.projected_demand_until_event} units</span>
          </div>

          <div className="formula-step">
            <span className="formula-label">4. Recommended Stock Needed = projected_demand * event_multiplier</span>
            <span className="formula-val">{item.projected_demand_until_event} * {item.event_multiplier}x ({item.event}) = {item.recommended_stock_needed} units</span>
          </div>

          <div className="formula-step" style={{ background: '#fff7ed', border: '1px solid #d97706' }}>
            <span className="formula-label" style={{ color: '#0f172a', fontWeight: 600 }}>
              5. Suggested Order Qty = max(0, round(recommended_stock - available_inventory))
            </span>
            <span className="formula-val" style={{ fontSize: '1.1rem', color: '#b45309' }}>
              {item.suggested_order_qty} units
            </span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Sparkles size={15} /> AI Business Rationale Generation
          </div>
          <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.4 }}>
            "{item.reason}"
          </p>
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close Inspector</button>
        </div>
      </div>
    </div>
  );
}
