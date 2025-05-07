
import React from 'react';
import CounterAnimation from './CounterAnimation';

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: React.ReactNode;
  colorClass?: string;
  trend?: number;
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon,
  colorClass = 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
  trend,
  delay = 0
}) => {
  return (
    <div 
      className={`metric-card ${colorClass} overflow-hidden`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="flex items-baseline">
        <div className="metric-value">
          <CounterAnimation 
            value={value} 
            prefix={prefix} 
            suffix={suffix} 
            decimals={decimals}
          />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-2">
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-400 ml-1">vs prev. period</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
