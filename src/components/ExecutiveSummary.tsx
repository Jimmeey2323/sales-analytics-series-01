
import React from 'react';
import { Card } from '@/components/ui/card';
import { SalesSummary } from '@/types/sales';
import MetricCard from './MetricCard';
import MonthlyPerformanceTable from './MonthlyPerformanceTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/salesUtils';
import { ChartPie, ChartBarIcon, Users, CreditCard, Calendar } from 'lucide-react';

interface ExecutiveSummaryProps {
  salesSummary: SalesSummary;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ salesSummary }) => {
  // Prepare chart data
  const revenueChartData = salesSummary.monthlyData.map(month => ({
    name: month.monthYear,
    revenue: month.postTaxRevenue,
    preTax: month.preTaxRevenue,
    tax: month.totalTax
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={salesSummary.totalSales}
          colorClass="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
          icon={<ChartBarIcon size={20} />}
          formatter="currency"
          delay={100}
          details={{
            'Pre-Tax': salesSummary.totalSales * 0.85, // Simplified calculation
            'Tax': salesSummary.totalSales * 0.15,     // Simplified calculation
            'Avg Per Month': salesSummary.totalSales / (salesSummary.monthlyData.length || 1)
          }}
        />
        <MetricCard
          title="Total Transactions"
          value={salesSummary.totalTransactions}
          colorClass="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
          icon={<CreditCard size={20} />}
          formatter="number"
          delay={200}
          details={{
            'Avg Per Month': salesSummary.totalTransactions / (salesSummary.monthlyData.length || 1),
            'Avg Value': salesSummary.averageOrderValue
          }}
        />
        <MetricCard
          title="Unique Clients"
          value={salesSummary.totalUniqueClients}
          colorClass="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
          icon={<Users size={20} />}
          formatter="number"
          delay={300}
          details={{
            'Avg Spend': salesSummary.totalSales / salesSummary.totalUniqueClients,
            'Revenue Per Client': salesSummary.totalSales / salesSummary.totalUniqueClients
          }}
        />
        <MetricCard
          title="Time Period"
          value={salesSummary.monthlyData.length}
          suffix=" Months"
          colorClass="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
          icon={<Calendar size={20} />}
          delay={400}
          details={{
            'Start Date': salesSummary.dateRange.start.getTime(),
            'End Date': salesSummary.dateRange.end.getTime(),
            'Avg Monthly Rev': salesSummary.totalSales / (salesSummary.monthlyData.length || 1)
          }}
          formatter="number"
        />
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenueChartData}
              margin={{ top: 20, right: 30, left: 30, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: any) => formatCurrency(value as number)}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Bar name="Post-Tax Revenue" dataKey="revenue" fill="#8884d8" />
              <Bar name="Pre-Tax Revenue" dataKey="preTax" fill="#82ca9d" />
              <Bar name="Tax Amount" dataKey="tax" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <MonthlyPerformanceTable 
        data={salesSummary.monthlyData} 
        title="Monthly Performance" 
      />
    </div>
  );
};

export default ExecutiveSummary;
