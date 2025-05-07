
import React, { useState, useEffect } from 'react';

interface CounterAnimationProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const CounterAnimation = ({ 
  value, 
  duration = 1000, 
  prefix = '', 
  suffix = '', 
  decimals = 0 
}: CounterAnimationProps) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Setup visibility observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`counter-${prefix}-${suffix}`);
    if (element) observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [prefix, suffix]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;
    
    const startAnimation = (timestamp: number) => {
      startTime = timestamp;
      updateCount(timestamp);
    };

    const updateCount = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentValue = progress * value;
      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(startAnimation);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [value, duration, isVisible]);

  // Format the number (add commas, decimal places)
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <div 
      id={`counter-${prefix}-${suffix}`} 
      className="counter-animation overflow-hidden"
    >
      <span>{prefix}</span>
      <span>{formatNumber(count)}</span>
      <span>{suffix}</span>
    </div>
  );
};

export default CounterAnimation;
