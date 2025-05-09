import React, { useState, useCallback } from 'react';
import { ChartData } from '@/types/sales';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/salesUtils';

interface SalesChartProps {
  data: ChartData[];
  title: string;
  colors: string[];
  description: string;
}

const SalesChart: React.FC<SalesChartProps> = ({ data, title, colors, description }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback(
    (entry: any, index: number) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded-md shadow-md border border-gray-200">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          <p className="text-gray-600">{`${description} for this segment`}</p>
          <p className="text-gray-700">{`Revenue: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }

    return null;
  };

  const chartData = data.length > 0 ? data : [{ name: 'No Data', value: 100 }];

  return (
    <Card className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="10%"
              outerRadius="80%"
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                label={{ position: "insideEnd", fill: "#333", fontSize: 11 }}
                background
                dataKey="value"
                animationDuration={1500}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                  />
                ))}
              </RadialBar>
            </RadialBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-400">No data available</div>
        )}
      </div>
    </Card>
  );
};

export default SalesChart;
