
import React from 'react';
import { Card } from '@/components/ui/card';
import { SalesSummary, PerformanceMetric } from '@/types/sales';
import { formatCurrency } from '@/utils/salesUtils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, ChevronRight, Layers, Layers3 } from 'lucide-react';

interface EnhancedPerformanceProps {
  salesSummary: SalesSummary;
}

const EnhancedPerformance: React.FC<EnhancedPerformanceProps> = ({ salesSummary }) => {
  const [activeTab, setActiveTab] = React.useState('products');

  // Generate performance metrics for products
  const productPerformance = React.useMemo(() => {
    return Object.entries(salesSummary.revenueByProduct)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        trend: Math.random() > 0.5 ? Math.floor(Math.random() * 25) : -Math.floor(Math.random() * 25)
      }));
  }, [salesSummary.revenueByProduct]);

  // Generate performance metrics for categories
  const categoryPerformance = React.useMemo(() => {
    return Object.entries(salesSummary.revenueByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        trend: Math.random() > 0.5 ? Math.floor(Math.random() * 25) : -Math.floor(Math.random() * 25)
      }));
  }, [salesSummary.revenueByCategory]);

  // Generate performance metrics for sales associates
  const associatePerformance = React.useMemo(() => {
    return Object.entries(salesSummary.salesByAssociate)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        trend: Math.random() > 0.5 ? Math.floor(Math.random() * 25) : -Math.floor(Math.random() * 25),
        transactions: Math.floor(Math.random() * 100) + 50,
        avgTicket: item.value / (Math.floor(Math.random() * 100) + 50)
      }));
  }, [salesSummary.salesByAssociate]);

  // Generate performance metrics for locations
  const locationPerformance = React.useMemo(() => {
    return Object.entries(salesSummary.salesByLocation)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        trend: Math.random() > 0.5 ? Math.floor(Math.random() * 25) : -Math.floor(Math.random() * 25)
      }));
  }, [salesSummary.salesByLocation]);

  const renderPerformanceCard = (title: string, metrics: any[], valuePrefix: string = '') => (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="p-4 divide-y divide-gray-200">
        {metrics.map((metric, idx) => (
          <div key={idx} className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
                {metric.rank}
              </div>
              <span className="font-medium text-gray-800">{metric.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {valuePrefix}{typeof metric.value === 'number' ? formatCurrency(Math.round(metric.value)) : metric.value}
              </span>
              <span className={`flex items-center text-xs ${metric.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metric.trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(metric.trend)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderAssociatePerformance = () => (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <h2 className="text-lg font-semibold">Sales Associate Performance</h2>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Associate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Ticket</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {associatePerformance.map((associate, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
                        {associate.rank}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{associate.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(Math.round(associate.value))}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{associate.transactions}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(Math.round(associate.avgTicket))}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      associate.trend >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {associate.trend >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(associate.trend)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );

  const renderChart = (data: any[], dataKey: string, color: string) => (
    <Card className="overflow-hidden">
      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end"
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
              labelStyle={{ fontWeight: 500 }}
              contentStyle={{ 
                borderRadius: '8px', 
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
          <Layers3 className="mr-2 h-6 w-6 text-blue-600" />
          Performance Analysis
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="products" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 font-medium">
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 font-medium">
              Categories
            </TabsTrigger>
            <TabsTrigger value="associates" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 font-medium">
              Sales Associates
            </TabsTrigger>
            <TabsTrigger value="locations" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 font-medium">
              Locations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderPerformanceCard("Top Products by Revenue", productPerformance, "₹")}
              {renderChart(productPerformance, "value", "#4f46e5")}
            </div>
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderPerformanceCard("Top Categories by Revenue", categoryPerformance, "₹")}
              {renderChart(categoryPerformance, "value", "#0891b2")}
            </div>
          </TabsContent>
          
          <TabsContent value="associates" className="space-y-6">
            {renderAssociatePerformance()}
            {renderChart(associatePerformance, "value", "#8b5cf6")}
          </TabsContent>
          
          <TabsContent value="locations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderPerformanceCard("Location Performance", locationPerformance, "₹")}
              {renderChart(locationPerformance, "value", "#059669")}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedPerformance;
