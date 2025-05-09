
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { SalesSummary } from '@/types/sales';
import { formatCurrency, formatNumber } from '@/utils/salesUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExecutiveSummaryProps {
  salesSummary: SalesSummary;
}

const ExecutiveMetricCard = ({ 
  title, 
  value, 
  prevValue, 
  formatter, 
  prefix,
  suffix,
  details,
  children
}: { 
  title: string;
  value: number;
  prevValue?: number;
  formatter?: 'currency' | 'number' | 'percent';
  prefix?: string;
  suffix?: string;
  details?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formattedValue = formatter === 'currency' 
    ? formatCurrency(value) 
    : formatter === 'percent'
    ? `${value.toFixed(1)}%`
    : formatNumber(value);
  
  const change = prevValue ? ((value - prevValue) / prevValue) * 100 : 0;
  const isPositive = change >= 0;
  
  return (
    <Card className="executive-card overflow-hidden">
      <div className="executive-card-header">
        <h3 className="font-medium text-gray-500">{title}</h3>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
      <div className="executive-card-body">
        <div className="flex justify-between items-baseline">
          <div className="text-2xl font-bold">
            {prefix}{formattedValue}{suffix}
          </div>
          
          {prevValue !== undefined && (
            <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="ml-1">{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        {isExpanded && (
          <>
            <div className="mt-4 border-t pt-4">
              {details}
            </div>
            {children && (
              <div className="mt-4">
                {children}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ salesSummary }) => {
  // Prepare monthly chart data
  const monthlyChartData = salesSummary.monthlyData.map(month => ({
    name: month.monthYear,
    revenue: Math.round(month.postTaxRevenue),
    transactions: month.transactions,
    clients: month.uniqueClients
  }));

  // Calculate year-over-year growth (just an estimation for demo)
  const prevYearRevenue = salesSummary.totalSales * 0.85; // Simulated previous year data
  const prevYearTransactions = salesSummary.totalTransactions * 0.9;
  const prevYearClients = salesSummary.totalUniqueClients * 0.8;
  
  // Calculate additional metrics for drill-down
  const avgRevenuePerMonth = salesSummary.totalSales / (salesSummary.monthlyData.length || 1);
  const avgTransactionsPerMonth = salesSummary.totalTransactions / (salesSummary.monthlyData.length || 1);
  const avgOrderValue = Math.round(salesSummary.totalSales / salesSummary.totalTransactions);
  const revenueTrend = salesSummary.monthlyData.length >= 2 
    ? ((salesSummary.monthlyData[salesSummary.monthlyData.length - 1].postTaxRevenue - 
        salesSummary.monthlyData[salesSummary.monthlyData.length - 2].postTaxRevenue) / 
        salesSummary.monthlyData[salesSummary.monthlyData.length - 2].postTaxRevenue) * 100
    : 0;

  // Customer metrics
  const repeatRate = Math.round((salesSummary.totalTransactions - salesSummary.totalUniqueClients) * 100 / salesSummary.totalUniqueClients);
  const avgSpendPerCustomer = Math.round(salesSummary.totalSales / salesSummary.totalUniqueClients);
  
  // Product metrics
  const categoriesCount = Object.keys(salesSummary.revenueByCategory).length;
  const productsCount = Object.keys(salesSummary.revenueByProduct).length;
  
  // Find top product and category
  let topCategory = '';
  let topCategoryValue = 0;
  Object.entries(salesSummary.revenueByCategory).forEach(([category, value]) => {
    if (value > topCategoryValue) {
      topCategory = category;
      topCategoryValue = value;
    }
  });
  
  let topProduct = '';
  let topProductValue = 0;
  Object.entries(salesSummary.revenueByProduct).forEach(([product, value]) => {
    if (value > topProductValue) {
      topProduct = product;
      topProductValue = value;
    }
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveMetricCard
          title="Revenue"
          value={Math.round(salesSummary.totalSales)}
          prevValue={Math.round(prevYearRevenue)}
          formatter="currency"
          details={
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. Revenue Per Month</span>
                <span className="font-medium">{formatCurrency(Math.round(avgRevenuePerMonth))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Revenue Growth</span>
                <span className={`font-medium ${revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pre-tax Revenue</span>
                <span className="font-medium">{formatCurrency(Math.round(salesSummary.totalSales * 0.85))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax Amount</span>
                <span className="font-medium">{formatCurrency(Math.round(salesSummary.totalSales * 0.15))}</span>
              </div>
            </div>
          }
          children={
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          }
        />
        
        <ExecutiveMetricCard
          title="Transactions"
          value={salesSummary.totalTransactions}
          prevValue={prevYearTransactions}
          formatter="number"
          details={
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. Transactions Per Month</span>
                <span className="font-medium">{Math.round(avgTransactionsPerMonth)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. Order Value</span>
                <span className="font-medium">{formatCurrency(avgOrderValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Conversion Rate (est.)</span>
                <span className="font-medium">23.4%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cart Abandonment (est.)</span>
                <span className="font-medium">32.1%</span>
              </div>
            </div>
          }
          children={
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Bar dataKey="transactions" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
        
        <ExecutiveMetricCard
          title="Customers"
          value={salesSummary.totalUniqueClients}
          prevValue={prevYearClients}
          formatter="number"
          details={
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Repeat Purchase Rate</span>
                <span className="font-medium">{repeatRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. Spend Per Customer</span>
                <span className="font-medium">{formatCurrency(avgSpendPerCustomer)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer Acquisition Cost (est.)</span>
                <span className="font-medium">{formatCurrency(Math.round(salesSummary.totalSales * 0.08 / salesSummary.totalUniqueClients))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer Lifetime Value (est.)</span>
                <span className="font-medium">{formatCurrency(avgSpendPerCustomer * 3.5)}</span>
              </div>
            </div>
          }
          children={
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Line type="monotone" dataKey="clients" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          }
        />
        
        <ExecutiveMetricCard
          title="Products & Categories"
          value={productsCount}
          suffix=" Products"
          formatter="number"
          details={
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Categories</span>
                <span className="font-medium">{categoriesCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Top Category</span>
                <span className="font-medium">{topCategory}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Top Category Revenue</span>
                <span className="font-medium">{formatCurrency(Math.round(topCategoryValue))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Top Product</span>
                <span className="font-medium">{topProduct.length > 20 ? topProduct.substring(0, 20) + '...' : topProduct}</span>
              </div>
            </div>
          }
        />
      </div>
      
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium">Revenue Analysis</h3>
        </div>
        <div className="p-4">
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="w-full justify-start mb-4 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="monthly" className="data-[state=active]:bg-white data-[state=active]:text-primary">Monthly</TabsTrigger>
              <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:text-primary">By Category</TabsTrigger>
              <TabsTrigger value="locations" className="data-[state=active]:bg-white data-[state=active]:text-primary">By Location</TabsTrigger>
              <TabsTrigger value="associates" className="data-[state=active]:bg-white data-[state=active]:text-primary">By Sales Associate</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="mt-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={50} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} labelFormatter={(label) => `Month: ${label}`} />
                    <Bar name="Revenue" dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-purple-50 rounded-xl">
                  <h4 className="text-sm text-purple-800 mb-1">Highest Revenue Month</h4>
                  <p className="text-xl font-bold text-purple-900">{
                    salesSummary.monthlyData
                      .sort((a, b) => b.postTaxRevenue - a.postTaxRevenue)[0]?.monthYear || '-'
                  }</p>
                  <p className="text-sm text-purple-700 mt-1">{
                    formatCurrency(
                      Math.round(salesSummary.monthlyData
                        .sort((a, b) => b.postTaxRevenue - a.postTaxRevenue)[0]?.postTaxRevenue || 0)
                    )
                  }</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="text-sm text-blue-800 mb-1">Most Transactions Month</h4>
                  <p className="text-xl font-bold text-blue-900">{
                    salesSummary.monthlyData
                      .sort((a, b) => b.transactions - a.transactions)[0]?.monthYear || '-'
                  }</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {salesSummary.monthlyData
                      .sort((a, b) => b.transactions - a.transactions)[0]?.transactions || 0} transactions
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl">
                  <h4 className="text-sm text-green-800 mb-1">Highest AOV Month</h4>
                  <p className="text-xl font-bold text-green-900">{
                    salesSummary.monthlyData
                      .sort((a, b) => b.atv - a.atv)[0]?.monthYear || '-'
                  }</p>
                  <p className="text-sm text-green-700 mt-1">
                    {formatCurrency(
                      Math.round(salesSummary.monthlyData
                        .sort((a, b) => b.atv - a.atv)[0]?.atv || 0)
                    )}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="mt-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={Object.entries(salesSummary.revenueByCategory)
                      .map(([name, value]) => ({ name, value }))
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 10)} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar name="Revenue" dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="locations" className="mt-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={Object.entries(salesSummary.salesByLocation)
                      .map(([name, value]) => ({ name, value }))
                      .sort((a, b) => b.value - a.value)} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar name="Revenue" dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="associates" className="mt-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={Object.entries(salesSummary.salesByAssociate)
                      .map(([name, value]) => ({ name, value }))
                      .sort((a, b) => b.value - a.value)} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar name="Revenue" dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default ExecutiveSummary;
