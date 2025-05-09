
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
  RadialBar,
  Sector
} from 'recharts';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/salesUtils';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { ChartPieIcon, BarChart3, Activity } from 'lucide-react';

interface SalesChartProps {
  data: ChartData[];
  title: string;
  colors: string[];
  description: string;
}

// Active shape for the pie chart when a segment is selected
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { 
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, 
    fill, payload, percent, value 
  } = props;
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
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-lg font-medium">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-sm">
        {`${formatCurrency(value)}`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const SalesChart: React.FC<SalesChartProps> = ({ data, title, colors, description }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'radial'>('pie');

  const onPieEnter = useCallback(
    (_, index: number) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800">{`${payload[0].name}`}</p>
          <p className="text-gray-600 text-sm">{`${description}`}</p>
          <p className="text-gray-800 font-medium mt-1">{`Revenue: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }

    return null;
  };

  const chartData = data.length > 0 ? data : [{ name: 'No Data', value: 100 }];

  return (
    <Card className="bg-white shadow-lg rounded-lg overflow-hidden border-0">
      <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      
      <div className="px-4 pt-4">
        <Tabs defaultValue="pie" value={chartType} onValueChange={(value) => setChartType(value as 'pie' | 'bar' | 'radial')}>
          <TabsList className="mb-3 bg-gray-100 p-1">
            <TabsTrigger value="pie" className="data-[state=active]:bg-white">
              <div className="flex items-center gap-1">
                <ChartPieIcon size={16} />
                <span>Pie</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="bar" className="data-[state=active]:bg-white">
              <div className="flex items-center gap-1">
                <BarChart3 size={16} />
                <span>Bar</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="radial" className="data-[state=active]:bg-white">
              <div className="flex items-center gap-1">
                <Activity size={16} />
                <span>Radial</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pie" className="m-0">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    animationDuration={1000}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[index % colors.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={renderCustomTooltip} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400">No data available</div>
            )}
          </TabsContent>
          
          <TabsContent value="bar" className="m-0">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={renderCustomTooltip} />
                  <Bar dataKey="value" animationDuration={1000}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400">No data available</div>
            )}
          </TabsContent>
          
          <TabsContent value="radial" className="m-0">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
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
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                  <Tooltip content={renderCustomTooltip} />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400">No data available</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default SalesChart;
