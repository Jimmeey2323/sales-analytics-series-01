
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
  calculateUPT,
  formatNumber
} from '@/utils/salesUtils';
import { 
  LayoutDashboard, 
  Table, 
  ChartPieIcon, 
  ChartBarIcon,
  Filter,
  Search,
  FileText,
  Trophy,
  ShoppingCart,
  Tags,
  Users,
  MapPin,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import CategoryAnalysis from './CategoryAnalysis';
import ExecutiveSummary from './ExecutiveSummary';
import TopPerformers from './TopPerformers';
import { Input } from '@/components/ui/input';

const Dashboard: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    let data = filterDataByDateRange(salesData, activePeriod.days);
    
    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      data = data.filter(item => 
        item["Customer Name"]?.toLowerCase().includes(query) || 
        item["Customer Email"]?.toLowerCase().includes(query) ||
        item["Payment Item"]?.toLowerCase().includes(query) ||
        item["Calculated Location"]?.toLowerCase().includes(query) ||
        item["Cleaned Product"]?.toLowerCase().includes(query) ||
        item["Payment Transaction ID"]?.toLowerCase().includes(query) ||
        item["Cleaned Category"]?.toLowerCase().includes(query) ||
        item["Sold By"]?.toLowerCase().includes(query)
      );
    }
    
    return data;
  }, [salesData, activePeriod, searchQuery]);
  
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
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">
          Sales Analytics Dashboard
        </h1>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sales data..."
              className="pl-10 pr-4 rounded-full border-gray-300 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <TimeFilter periods={timePeriods} onSelect={handlePeriodChange} />
          
          <Button 
            onClick={handleRefreshData} 
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg w-full md:w-auto"
          >
            Refresh Data
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border shadow-sm rounded-lg p-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <LayoutDashboard size={16} />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="executive" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <FileText size={16} />
            <span className="hidden md:inline">Executive Summary</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <ShoppingCart size={16} />
            <span className="hidden md:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <Tags size={16} />
            <span className="hidden md:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="associates" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <Users size={16} />
            <span className="hidden md:inline">Associates</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <MapPin size={16} />
            <span className="hidden md:inline">Locations</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <CreditCard size={16} />
            <span className="hidden md:inline">Payment Methods</span>
          </TabsTrigger>
          <TabsTrigger value="performace" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <Trophy size={16} />
            <span className="hidden md:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <Table size={16} />
            <span className="hidden md:inline">Transactions</span>
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
              formatter="currency"
              details={{
                'Pre-Tax': salesSummary.totalSales * 0.85, // Approximation
                'Tax': salesSummary.totalSales * 0.15,     // Approximation
              }}
            />
            <MetricCard 
              title="Transactions" 
              value={salesSummary.totalTransactions}
              colorClass="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
              icon={<Table size={20} />}
              delay={200}
              formatter="number"
            />
            <MetricCard 
              title="Average Order Value" 
              value={salesSummary.averageOrderValue}
              prefix="₹"
              colorClass="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
              icon={<ChartPieIcon size={20} />}
              decimals={0}
              delay={300}
              formatter="currency"
            />
            <MetricCard 
              title="Units Sold" 
              value={unitsSold}
              colorClass="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
              icon={<Filter size={20} />}
              delay={400}
              formatter="number"
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
              formatter="currency"
            />
            <MetricCard 
              title="Average User Value (AUV)" 
              value={auv}
              prefix="₹"
              colorClass="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200"
              decimals={0}
              formatter="currency"
            />
            <MetricCard 
              title="Units Per Transaction (UPT)" 
              value={upt}
              colorClass="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
              decimals={2}
              formatter="number"
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
        
        {/* Executive Summary Tab */}
        <TabsContent value="executive" className="m-0">
          <ExecutiveSummary salesSummary={salesSummary} />
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products" className="m-0">
          <CategoryAnalysis 
            salesSummary={salesSummary}
            salesData={filteredData}
            fieldKey="Cleaned Product"
            title="Product"
          />
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className="m-0">
          <CategoryAnalysis 
            salesSummary={salesSummary}
            salesData={filteredData}
            fieldKey="Cleaned Category"
            title="Category"
          />
        </TabsContent>
        
        {/* Associates Tab */}
        <TabsContent value="associates" className="m-0">
          <CategoryAnalysis 
            salesSummary={salesSummary}
            salesData={filteredData}
            fieldKey="Sold By"
            title="Sales Associate"
          />
        </TabsContent>
        
        {/* Locations Tab */}
        <TabsContent value="locations" className="m-0">
          <CategoryAnalysis 
            salesSummary={salesSummary}
            salesData={filteredData}
            fieldKey="Calculated Location"
            title="Location"
          />
        </TabsContent>
        
        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="m-0">
          <CategoryAnalysis 
            salesSummary={salesSummary}
            salesData={filteredData}
            fieldKey="Payment Method"
            title="Payment Method"
          />
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performace" className="m-0">
          <TopPerformers salesSummary={salesSummary} />
        </TabsContent>
        
        {/* Transactions Tab */}
        <TabsContent value="transactions" className="m-0">
          <Card>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">All Transactions</h2>
              <p className="text-sm text-gray-500">
                {filteredData.length} transactions {activePeriod.id !== 'all-time' ? `in ${activePeriod.label.toLowerCase()}` : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
            <SalesTable 
              data={filteredData} 
              isLoading={isLoading}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
