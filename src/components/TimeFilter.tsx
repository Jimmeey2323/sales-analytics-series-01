
import React from 'react';
import { TimePeriod } from '@/types/sales';

interface TimeFilterProps {
  periods: TimePeriod[];
  onSelect: (period: TimePeriod) => void;
}

const TimeFilter: React.FC<TimeFilterProps> = ({ periods, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map(period => (
        <button
          key={period.id}
          onClick={() => onSelect(period)}
          className={`filter-button ${period.active ? 'active-filter' : 'bg-white text-gray-600 border-gray-300'}`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default TimeFilter;
