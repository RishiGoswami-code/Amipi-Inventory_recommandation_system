import React from 'react';
import { AlertTriangle, TrendingUp, PackageCheck, Ban, ShoppingBag } from 'lucide-react';

export default function SummaryCards({ metrics }) {
  const cards = [
    {
      title: "Total Styles Analyzed",
      value: metrics.total_items || 0,
      icon: <ShoppingBag size={22} color="#2563eb" />,
      bg: "rgba(37, 99, 235, 0.08)"
    },
    {
      title: "High Priority Reorders",
      value: metrics.high_priority_count || 0,
      icon: <AlertTriangle size={22} color="#be123c" />,
      bg: "rgba(225, 29, 72, 0.08)"
    },
    {
      title: "Medium Priority",
      value: metrics.medium_priority_count || 0,
      icon: <TrendingUp size={22} color="#b45309" />,
      bg: "rgba(217, 119, 6, 0.08)"
    },
    {
      title: "Sufficient / Low Priority",
      value: metrics.low_priority_count || 0,
      icon: <PackageCheck size={22} color="#047857" />,
      bg: "rgba(5, 150, 105, 0.08)"
    },
    {
      title: "Do Not Reorder (Overrides)",
      value: metrics.do_not_reorder_count || 0,
      icon: <Ban size={22} color="#6d28d9" />,
      bg: "rgba(124, 58, 237, 0.08)"
    },
    {
      title: "Total Units to Reorder",
      value: metrics.total_suggested_reorder_units || 0,
      icon: <ShoppingBag size={22} color="#c2410c" />,
      bg: "rgba(194, 65, 12, 0.08)"
    }
  ];

  return (
    <div className="summary-grid">
      {cards.map((card, idx) => (
        <div key={idx} className="summary-card">
          <div className="summary-icon" style={{ background: card.bg }}>
            {card.icon}
          </div>
          <div>
            <div className="summary-value">{card.value}</div>
            <div className="summary-label">{card.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
