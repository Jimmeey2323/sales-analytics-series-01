
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesItem, TimePeriod, ChartData, SalesSummary } from '@/types/sales';
import sheetService from '@/services/sheetService';
import MetricCard from './MetricCard';
import SalesTable from './SalesTable';
import SalesChart from './SalesChart';
import TimeFilter from './TimeFilter';
import {
  calculateSummary,
  filterDataByDateRange,
  convertToChartData,
  getTopItems,
  formatCurrency,
  calculateUnitsSold,
  calculateATVAndAUV,
  calculateUPT
} from '@/utils/salesUtils';
import { 
  LayoutDashboard, 
  Table, 
  ChartPieIcon, 
  ChartBarIcon,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Dashboard: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>([
    { id: 'all-time', label: 'All Time', days: 0, active: true },
    { id: 'today', label: 'Today', days: 1, active: false },
    { id: 'this-week', label: 'This Week', days: 7, active: false },
    { id: 'this-month', label: 'This Month', days: 30, active: false },
    { id: 'this-quarter', label: 'This Quarter', days: 90, active: false }
  ]);
  
  const activePeriod = timePeriods.find(p => p.active) || timePeriods[0];
  
  // Filtered data based on active time period
  const filteredData = useMemo(() => {
    return filterDataByDateRange(salesData, activePeriod.days);
  }, [salesData, activePeriod]);
  
  // Calculate sales summary
  const salesSummary = useMemo<SalesSummary>(() => {
    return calculateSummary(filteredData);
  }, [filteredData]);
  
  // Calculate metrics
  const unitsSold = useMemo(() => calculateUnitsSold(filteredData), [filteredData]);
  const { atv, auv } = useMemo(() => calculateATVAndAUV(filteredData), [filteredData]);
  const upt = useMemo(() => calculateUPT(filteredData), [filteredData]);
  
  // Prepare chart data
  const categoryChartData = useMemo<ChartData[]>(() => {
    return getTopItems(convertToChartData(salesSummary.revenueByCategory));
  }, [salesSummary]);
  
  const productChartData = useMemo<ChartData[]>(() => {
    return getTopItems(convertToChartData(salesSummary.revenueByProduct));
  }, [salesSummary]);
  
  const methodChartData = useMemo<ChartData[]>(() => {
    return getTopItems(convertToChartData(salesSummary.salesByMethod));
  }, [salesSummary]);
  
  const locationChartData = useMemo<ChartData[]>(() => {
    return getTopItems(convertToChartData(salesSummary.salesByLocation));
  }, [salesSummary]);

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await sheetService.fetchSalesData();
        setSalesData(data);
        
        toast.success("Sales data loaded successfully!");
      } catch (err: any) {
        console.error("Error fetching sales data:", err);
        setError(err.message || "Failed to fetch sales data");
        toast.error("Failed to load sales data.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSalesData();
  }, []);

  const handlePeriodChange = (selectedPeriod: TimePeriod) => {
    setTimePeriods(periods => 
      periods.map(period => ({
        ...period,
        active: period.id === selectedPeriod.id
      }))
    );
  };

  // Function to refresh data
  const handleRefreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await sheetService.fetchSalesData();
      setSalesData(data);
      toast.success("Data refreshed successfully!");
    } catch (err: any) {
      console.error("Error refreshing data:", err);
      setError(err.message || "Failed to refresh data");
      toast.error("Failed to refresh data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Sales Analytics</h1>
        
        <div className="flex items-center gap-4">
          <TimeFilter periods={timePeriods} onSelect={handlePeriodChange} />
          
          <Button onClick={handleRefreshData} disabled={isLoading}>
            Refresh Data
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard size={16} />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Table size={16} />
            <span className="hidden md:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <ChartPieIcon size={16} />
            <span className="hidden md:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="m-0">
          {/* Key Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 dashboard-section" style={{ "--delay": 1 } as React.CSSProperties}>
            <MetricCard 
              title="Total Revenue" 
              value={salesSummary.totalSales}
              prefix="₹"
              colorClass="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
              icon={<ChartBarIcon size={20} />}
              delay={100}
            />
            <MetricCard 
              title="Transactions" 
              value={salesSummary.totalTransactions}
              colorClass="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
              icon={<Table size={20} />}
              delay={200}
            />
            <MetricCard 
              title="Average Order Value" 
              value={salesSummary.averageOrderValue}
              prefix="₹"
              colorClass="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
              icon={<ChartPieIcon size={20} />}
              decimals={0}
              delay={300}
            />
            <MetricCard 
              title="Units Sold" 
              value={unitsSold}
              colorClass="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
              icon={<Filter size={20} />}
              delay={400}
            />
          </div>

          {/* Chart Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 dashboard-section" style={{ "--delay": 2 } as React.CSSProperties}>
            <SalesChart 
              data={categoryChartData} 
              title="Revenue by Category" 
              colors={['#2D3A8C', '#0BC5EA', '#805AD5', '#38A169', '#E53E3E']}
            />
            <SalesChart 
              data={productChartData} 
              title="Revenue by Product"
              colors={['#805AD5', '#0BC5EA', '#38A169', '#E53E3E', '#DD6B20']}
            />
          </div>

          {/* Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 dashboard-section" style={{ "--delay": 3 } as React.CSSProperties}>
            <MetricCard 
              title="Average Transaction Value (ATV)" 
              value={atv}
              prefix="₹"
              colorClass="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200"
              decimals={0}
            />
            <MetricCard 
              title="Average User Value (AUV)" 
              value={auv}
              prefix="₹"
              colorClass="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200"
              decimals={0}
            />
            <MetricCard 
              title="Units Per Transaction (UPT)" 
              value={upt}
              colorClass="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
              decimals={2}
            />
          </div>
          
          {/* Recent Transactions */}
          <div className="dashboard-section" style={{ "--delay": 4 } as React.CSSProperties}>
            <Card>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
              </div>
              <SalesTable 
                data={filteredData.slice(0, 5)} 
                isLoading={isLoading}
              />
            </Card>
          </div>
        </TabsContent>
        
        {/* Transactions Tab */}
        <TabsContent value="transactions" className="m-0">
          <Card>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">All Transactions</h2>
              <p className="text-sm text-gray-500">
                {filteredData.length} transactions {activePeriod.id !== 'all-time' ? `in ${activePeriod.label.toLowerCase()}` : ''}
              </p>
            </div>
            <SalesTable 
              data={filteredData} 
              isLoading={isLoading}
            />
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SalesChart 
              data={locationChartData} 
              title="Revenue by Location" 
              colors={['#2D3A8C', '#0BC5EA', '#805AD5', '#38A169', '#E53E3E']}
            />
            <SalesChart 
              data={methodChartData} 
              title="Revenue by Payment Method"
              colors={['#805AD5', '#0BC5EA', '#38A169', '#E53E3E', '#DD6B20']}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Top Products</h2>
              </div>
              <div className="p-4">
                {productChartData.map((product, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                    <span className="font-medium">{product.name}</span>
                    <span className="font-semibold">{formatCurrency(product.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Top Categories</h2>
              </div>
              <div className="p-4">
                {categoryChartData.map((category, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                    <span className="font-medium">{category.name}</span>
                    <span className="font-semibold">{formatCurrency(category.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
