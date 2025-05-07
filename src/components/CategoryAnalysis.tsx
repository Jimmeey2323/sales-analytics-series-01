
import React, { useState } from 'react';
import { SalesItem, SalesSummary } from '@/types/sales';
import { Card } from '@/components/ui/card';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  groupByField, calculateGroupTotals, 
  formatCurrency, formatNumber,
  getTopItems 
} from '@/utils/salesUtils';
import MonthlyPerformanceTable from './MonthlyPerformanceTable';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  ChartBarIcon, 
  ChartPieIcon, 
  TableIcon, 
  BarChart2, 
  LineChart as LineChartIcon
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface CategoryAnalysisProps {
  salesSummary: SalesSummary;
  salesData: SalesItem[];
  fieldKey: keyof SalesItem;
  title: string;
}

const CategoryAnalysis: React.FC<CategoryAnalysisProps> = ({ 
  salesSummary, salesData, fieldKey, title 
}) => {
  const [viewOption, setViewOption] = useState<string>('bar');
  
  // Group data by the specified field
  const groupedData = groupByField(salesData, fieldKey);
  const groupTotals = calculateGroupTotals(groupedData);
  
  // Convert group totals to array for charts
  const chartData = Object.entries(groupTotals)
    .map(([key, data]) => ({
      name: key,
      value: data.totalRevenue,
      preTaxRevenue: data.preTaxRevenue,
      taxAmount: data.taxAmount,
      unitsSold: data.unitsSold,
      transactions: data.transactions,
      atv: data.atv,
      auv: data.auv
    }))
    .sort((a, b) => b.value - a.value);
  
  // Prepare monthly data for each category
  const monthlyDataByCategory: Record<string, any[]> = {};
  Object.keys(groupedData).forEach(key => {
    const items = groupedData[key];
    // Group by month
    const monthlyMap = new Map();
    
    items.forEach(item => {
      if (item.MonthYear) {
        const monthKey = item.MonthYear;
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            monthYear: monthKey,
            sortKey: `${item.Year}-${String(item.Month).padStart(2, '0')}`,
            totalSales: 0,
            totalTax: 0,
            unitsSold: 0,
            transactions: 0,
            uniqueClients: new Set(),
            preTaxRevenue: 0,
            postTaxRevenue: 0,
          });
        }
        
        const monthData = monthlyMap.get(monthKey);
        const saleValue = parseFloat(item["Payment Value"]) || 0;
        const taxValue = parseFloat(item["Payment VAT"] || "0") || (saleValue * 0.15);
        
        monthData.totalSales += saleValue;
        monthData.totalTax += taxValue;
        monthData.unitsSold += 1;
        monthData.transactions += 1;
        monthData.preTaxRevenue += (saleValue - taxValue);
        monthData.postTaxRevenue += saleValue;
        
        if (item["Member ID"]) {
          monthData.uniqueClients.add(item["Member ID"]);
        }
      }
    });
    
    // Convert the Map to an array and calculate derived metrics
    monthlyDataByCategory[key] = Array.from(monthlyMap.values())
      .map(month => ({
        ...month,
        uniqueClients: month.uniqueClients.size,
        atv: month.totalSales / (month.transactions || 1),
        auv: month.totalSales / (month.uniqueClients.size || 1),
        averageSpend: month.totalSales / (month.uniqueClients.size || 1)
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  });
  
  // Limit chart data to top items for better visualization
  const limitedChartData = getTopItems(chartData.map(item => ({ 
    name: item.name, value: item.value 
  })), 10);
  
  // Colors for the charts
  const colors = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', 
                 '#d0ed57', '#ffc658', '#FF8042', '#ff7300', '#9916B3'];
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title} Analysis</h2>
          
          <div className="flex items-center space-x-2">
            <Tabs value={viewOption} onValueChange={setViewOption} className="w-auto">
              <TabsList>
                <TabsTrigger value="bar" className="flex items-center gap-1">
                  <BarChart2 size={16} />
                  <span className="hidden md:inline">Bar</span>
                </TabsTrigger>
                <TabsTrigger value="pie" className="flex items-center gap-1">
                  <ChartPieIcon size={16} />
                  <span className="hidden md:inline">Pie</span>
                </TabsTrigger>
                <TabsTrigger value="line" className="flex items-center gap-1">
                  <LineChartIcon size={16} />
                  <span className="hidden md:inline">Line</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-1">
                  <TableIcon size={16} />
                  <span className="hidden md:inline">Table</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="h-96 mt-6">
          {viewOption === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.slice(0, 10)}
                margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'Revenue') return formatCurrency(value as number);
                    if (name === 'Units Sold') return formatNumber(value as number);
                    if (name === 'Pre-Tax Revenue') return formatCurrency(value as number);
                    if (name === 'Tax Amount') return formatCurrency(value as number);
                    return value;
                  }}
                />
                <Legend />
                <Bar name="Revenue" dataKey="value" fill="#8884d8" />
                <Bar name="Pre-Tax Revenue" dataKey="preTaxRevenue" fill="#82ca9d" />
                <Bar name="Tax Amount" dataKey="taxAmount" fill="#ffc658" />
                <Bar name="Units Sold" dataKey="unitsSold" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          )}
          
          {viewOption === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 0 }}>
                <Pie
                  data={limitedChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={130}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {limitedChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          )}
          
          {viewOption === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.slice(0, 10)}
                margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'Revenue' || name === 'ATV' || name === 'AUV') 
                      return formatCurrency(value as number);
                    return formatNumber(value as number);
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  name="Revenue" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  name="Units Sold" 
                  dataKey="unitsSold" 
                  stroke="#82ca9d" 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  name="ATV" 
                  dataKey="atv" 
                  stroke="#ffc658" 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {viewOption === 'table' && (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Revenue</TableHead>
                    <TableHead className="text-center">Pre-Tax Rev.</TableHead>
                    <TableHead className="text-center">Tax Amount</TableHead>
                    <TableHead className="text-center">Units</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead className="text-center">ATV</TableHead>
                    <TableHead className="text-center">AUV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">{formatCurrency(item.value)}</TableCell>
                      <TableCell className="text-center">{formatCurrency(item.preTaxRevenue)}</TableCell>
                      <TableCell className="text-center">{formatCurrency(item.taxAmount)}</TableCell>
                      <TableCell className="text-center">{item.unitsSold}</TableCell>
                      <TableCell className="text-center">{item.transactions}</TableCell>
                      <TableCell className="text-center">{formatCurrency(item.atv)}</TableCell>
                      <TableCell className="text-center">{formatCurrency(item.auv)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
      
      {/* Month-on-Month Performance Tab */}
      <div className="mt-6">
        <Tabs defaultValue={chartData.length > 0 ? chartData[0].name : ""}>
          <TabsList className="bg-white border mb-4 overflow-x-auto flex-nowrap">
            {chartData.slice(0, 5).map((item) => (
              <TabsTrigger key={item.name} value={item.name}>
                {item.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {chartData.slice(0, 5).map((item) => (
            <TabsContent key={item.name} value={item.name} className="m-0">
              {monthlyDataByCategory[item.name]?.length > 0 ? (
                <MonthlyPerformanceTable 
                  data={monthlyDataByCategory[item.name]} 
                  title={`Monthly Performance: ${item.name}`}
                />
              ) : (
                <Card className="p-4">
                  <p className="text-center text-gray-500">
                    No monthly data available for {item.name}
                  </p>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default CategoryAnalysis;
