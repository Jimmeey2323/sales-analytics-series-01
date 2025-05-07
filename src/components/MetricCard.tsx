
import React, { useState } from 'react';
import CounterAnimation from './CounterAnimation';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/salesUtils';

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
  details?: Record<string, number>;
  formatter?: 'currency' | 'number' | 'percent';
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
  delay = 0,
  details,
  formatter = 'number'
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const formatValue = (val: number) => {
    if (formatter === 'currency') {
      return formatCurrency(val);
    } else if (formatter === 'number') {
      return formatNumber(val);
    } else if (formatter === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    return val.toFixed(decimals);
  };
  
  return (
    <Card 
      className={`metric-card transition-all duration-300 ${colorClass} ${expanded ? 'h-auto' : 'h-32'} overflow-hidden`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="flex items-center space-x-2">
          {icon && <div className="text-gray-500">{icon}</div>}
          {details && (
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="text-gray-500 hover:text-gray-700"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-baseline">
        <div className="metric-value text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
          <CounterAnimation 
            value={value} 
            prefix={prefix} 
            suffix={suffix} 
            decimals={decimals}
            formatter={formatter === 'currency' ? formatCurrency : formatter === 'number' ? formatNumber : undefined}
          />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-2">
          <span className={`flex items-center text-xs font-medium ${
            trend >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {trend >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="ml-0.5">{Math.abs(trend).toFixed(1)}%</span>
          </span>
          <span className="text-xs text-gray-400 ml-1">vs prev. period</span>
        </div>
      )}
      
      {expanded && details && (
        <div className="mt-4 pt-2 border-t border-gray-200">
          {Object.entries(details).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center py-1 text-sm">
              <span className="text-gray-600">{key}</span>
              <span className="font-medium">{formatValue(val)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MetricCard;
