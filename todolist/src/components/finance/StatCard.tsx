import React from 'react';

interface StatCardProps {
  label: string;
  amount: number;
  sub: string;
  bgColor: string;
  borderColor: string;
  labelColor: string;
  amountColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label, amount, sub, bgColor, borderColor, labelColor, amountColor,
}) => (
  <div style={{
    padding: 14, borderRadius: 14, background: bgColor,
    border: `1px solid ${borderColor}`,
  }}>
    <div style={{ fontSize: 11, color: labelColor, fontWeight: 600, marginBottom: 4 }}>
      {label}
    </div>
    <div style={{
      fontSize: 20, fontWeight: 700, color: amountColor,
      fontVariantNumeric: 'tabular-nums' as const,
    }}>
      ¥{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
    </div>
    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{sub}</div>
  </div>
);

export default StatCard;
