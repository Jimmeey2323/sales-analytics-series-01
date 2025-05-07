import React, { useState, useCallback } from 'react';
import { ChartData } from '@/types/sales';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  ResponsiveContainer, 
  Tooltip, 
  Sector,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart, 
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  AreaChart as AreaChartIcon,
  BarChartHorizontal,
  CircleDashed
} from 'lucide-react';
import { formatCurrency } from '@/utils/salesUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SalesChartProps {
  data: ChartData[];
  title: string;
  colors?: string[];
  description?: string;
  showViewOptions?: boolean;
  height?: number | string;
}

type ChartType = 'pie' | 'bar' | 'line' | 'area' | 'horizontalBar' | 'radialBar';

const SalesChart: React.FC<SalesChartProps> = ({ 
  data, 
  title,
  colors = ['#2D3A8C', '#0BC5EA', '#805AD5', '#38A169', '#E53E3E', '#DD6B20', '#718096'],
  description,
  showViewOptions = true,
  height = 320
}) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [fullscreen, setFullscreen] = useState(false);

  // Ensure we have enough colors for all data points
  const extendedColors = [...colors];
  while (extendedColors.length < data.length) {
    extendedColors.push(...colors);
  }
  
  const formatValue = (value: number): string => {
    return formatCurrency(value);
  };

  // Custom active shape for better interactivity
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={fill}
          strokeWidth={2}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
          strokeOpacity={0.3}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12} fontWeight="500">
          {payload.name}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#666" fontSize={12}>
          {formatValue(value)}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={36} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                innerRadius="55%"
                outerRadius="75%"
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                paddingAngle={2}
                animationBegin={200}
                animationDuration={1200}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={extendedColors[index % extendedColors.length]} 
                    stroke={extendedColors[index % extendedColors.length]}
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  padding: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center" 
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "12px"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value;
                }}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  padding: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              />
              <Bar dataKey="value" animationDuration={1500}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={extendedColors[index % extendedColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value;
                }}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  padding: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#4361ee" 
                strokeWidth={3}
                dot={{ fill: '#4361ee', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4361ee" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4361ee" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value;
                }}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  padding: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#4361ee" 
                fillOpacity={1}
                fill="url(#colorValue)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'horizontalBar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 20, right: 30, left: 100, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis 
                type="number"
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value;
                }}
              />
              <YAxis 
                dataKey="name" 
                type="category"
                width={90} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  padding: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              />
              <Bar dataKey="value" animationDuration={1500}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={extendedColors[index % extendedColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radialBar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              innerRadius="20%" 
              outerRadius="90%" 
              data={data.sort((a, b) => b.value - a.value)} 
              startAngle={180} 
              endAngle={0}
              cx="50%" 
              cy="50%"
            >
              <RadialBar
                label={{ position: "insideEnd", fill: "#333", fontSize: 11 }}
                background
                clockWise
                dataKey="value"
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={extendedColors[index % extendedColors.length]}
                  />
                ))}
              </RadialBar>
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  padding: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center" 
                wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className="chart-container shadow-md hover:shadow-lg transition-all duration-300 border-gray-200 bg-white overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
              {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </div>
            {showViewOptions && (
              <div className="flex items-center space-x-2">
                <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
                  <SelectTrigger className="w-[130px] h-8 px-2 text-xs">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pie" className="flex items-center">
                      <div className="flex items-center">
                        <PieChartIcon className="mr-2 h-4 w-4" />
                        <span>Pie Chart</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bar">
                      <div className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Bar Chart</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="horizontalBar">
                      <div className="flex items-center">
                        <BarChartHorizontal className="mr-2 h-4 w-4" />
                        <span>Horizontal Bar</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="line">
                      <div className="flex items-center">
                        <LineChartIcon className="mr-2 h-4 w-4" />
                        <span>Line Chart</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="area">
                      <div className="flex items-center">
                        <AreaChartIcon className="mr-2 h-4 w-4" />
                        <span>Area Chart</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="radialBar">
                      <div className="flex items-center">
                        <CircleDashed className="mr-2 h-4 w-4" />
                        <span>Radial Chart</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFullscreen(true)}
                  className="p-1 h-8 w-8"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0 pt-4">
          <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh]">
            {renderChart()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalesChart;
