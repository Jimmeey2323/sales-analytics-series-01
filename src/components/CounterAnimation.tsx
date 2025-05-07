
import React, { useState, useEffect } from 'react';
import { formatCurrency, formatNumber } from '@/utils/salesUtils';

interface CounterAnimationProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  formatter?: (value: number) => string;
}

const CounterAnimation: React.FC<CounterAnimationProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1000,
  formatter
}) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrameId: number;
    const startValue = 0;
    const endValue = value;
    
    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentCount = startValue + progress * (endValue - startValue);
      
      setCount(currentCount);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      }
    };
    
    animationFrameId = requestAnimationFrame(updateCount);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);
  
  // Format the displayed value
  const displayValue = formatter 
    ? formatter(count) 
    : `${prefix}${count.toFixed(decimals)}${suffix}`;
  
  return (
    <div className="counter-animation">
      {displayValue}
    </div>
  );
};

export default CounterAnimation;
