
import React from 'react';
import { ChartData } from '@/types/sales';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';

interface SalesChartProps {
  data: ChartData[];
  title: string;
  colors?: string[];
}

const SalesChart: React.FC<SalesChartProps> = ({ 
  data, 
  title,
  colors = ['#2D3A8C', '#0BC5EA', '#805AD5', '#38A169', '#E53E3E', '#DD6B20', '#718096']
}) => {
  // Ensure we have enough colors for all data points
  const extendedColors = [...colors];
  while (extendedColors.length < data.length) {
    extendedColors.push(...colors);
  }
  
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent >= 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="chart-container h-96">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>
      
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={extendedColors[index % extendedColors.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [formatValue(value), 'Revenue']}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center" 
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default SalesChart;
