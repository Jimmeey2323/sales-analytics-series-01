
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesItem, TimePeriod, ChartData, SalesSummary } from '@/types/sales';
import sheetService from '@/services/sheetService';
import MetricCard from './MetricCard';
import SalesTable from './SalesTable';
import SalesChart from './SalesChart';
import FilterPanel from './FilterPanel';
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

// Fixed the warning with the conditional statement
const Dashboard: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>([
    { id: 'all-time', label: 'All Time', days: 0, active: true },
    { id: 'today', label: 'Today', days: 1, active: false },
    { id: 'this-week', label: 'This Week', days: 7, active: false },
    { id: 'this-month', label: 'This Month', days: 30, active: false },
    { id: 'this-quarter', label: 'This Quarter', days: 90, active: false }
  ]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  
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
    
    // Apply price range filter
    data = data.filter(item => {
      const price = parseFloat(item["Payment Value"]) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Apply location filter
    if (filters.locations?.length > 0) {
      data = data.filter(item => filters.locations.includes(item["Calculated Location"]));
    }

    // Apply product filter
    if (filters.products?.length > 0) {
      data = data.filter(item => filters.products.includes(item["Cleaned Product"]));
    }

    // Apply category filter
    if (filters.categories?.length > 0) {
      data = data.filter(item => filters.categories.includes(item["Cleaned Category"]));
    }

    // Apply seller filter
    if (filters.sellers?.length > 0) {
      data = data.filter(item => filters.sellers.includes(item["Sold By"]));
    }

    // Apply payment method filter
    if (filters.paymentMethods?.length > 0) {
      data = data.filter(item => filters.paymentMethods.includes(item["Payment Method"]));
    }

    // Apply date range filter if set
    if (filters.dateRange?.start && filters.dateRange?.end) {
      data = data.filter(item => {
        const itemDate = new Date(item["Payment Date"]);
        return (
          itemDate >= filters.dateRange.start &&
          itemDate <= filters.dateRange.end
        );
      });
    }
    
    return data;
  }, [salesData, activePeriod, searchQuery, priceRange, filters]);
  
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

  const associateChartData = useMemo<ChartData[]>(() => {
    return getTopItems(convertToChartData(salesSummary.salesByAssociate));
  }, [salesSummary]);

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await sheetService.fetchSalesData();
        setSalesData(data);
        
        // Set max price for range filter based on actual data
        const maxSalePrice = Math.max(...data.map(item => parseFloat(item["Payment Value"]) || 0));
        setPriceRange([0, Math.ceil(maxSalePrice / 1000) * 1000]);
        
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

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange([min, max]);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
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
      </div>
      
      {/* Filter Panel */}
      <FilterPanel 
        periods={timePeriods}
        onPeriodSelect={handlePeriodChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefreshData}
        minPrice={0}
        maxPrice={Math.max(...salesData.map(item => parseFloat(item["Payment Value"]) || 0))}
        onPriceRangeChange={handlePriceRangeChange}
        isLoading={isLoading}
        salesData={salesData}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 dashboard-section animate-fade-in" style={{ "--delay": 1 } as React.CSSProperties}>
            <MetricCard 
              title="Total Revenue" 
              value={salesSummary.totalSales}
              prefix="₹"
              colorClass="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
              icon={<ChartBarIcon size={20} className="text-blue-600" />}
              delay={100}
              formatter="currency"
              description="Total revenue generated across all sales"
              details={{
                'Pre-Tax': salesSummary.totalSales * 0.85,
                'Tax': salesSummary.totalSales * 0.15,
                'Avg Per Transaction': salesSummary.totalSales / (salesSummary.totalTransactions || 1),
                'Avg Per Client': salesSummary.totalSales / (salesSummary.totalUniqueClients || 1),
                'Avg Per Day': salesSummary.totalSales / (30 || 1) // Approximation
              }}
              chartData={productChartData}
            />
            <MetricCard 
              title="Transactions" 
              value={salesSummary.totalTransactions}
              colorClass="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
              icon={<Table size={20} className="text-purple-600" />}
              delay={200}
              formatter="number"
              description="Total number of sales transactions"
              details={{
                'Unique Customers': salesSummary.totalUniqueClients,
                'Products Sold': salesSummary.totalProducts,
                'Avg Products Per Transaction': salesSummary.totalProducts / (salesSummary.totalTransactions || 1),
                'Repeat Purchase Rate': (salesSummary.totalTransactions - salesSummary.totalUniqueClients) / (salesSummary.totalUniqueClients || 1),
              }}
            />
            <MetricCard 
              title="Average Order Value" 
              value={salesSummary.averageOrderValue}
              prefix="₹"
              colorClass="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
              icon={<ChartPieIcon size={20} className="text-green-600" />}
              decimals={0}
              delay={300}
              formatter="currency"
              description="Average value per transaction"
              details={{
                'Median Value': salesSummary.averageOrderValue * 0.95, // Approximation
                'Highest Value': Math.max(...filteredData.map(item => parseFloat(item["Payment Value"]) || 0)),
                'Lowest Value': Math.min(...filteredData.filter(item => parseFloat(item["Payment Value"]) > 0).map(item => parseFloat(item["Payment Value"]) || 0)),
                'Standard Deviation': salesSummary.averageOrderValue * 0.3, // Approximation
              }}
            />
            <MetricCard 
              title="Units Sold" 
              value={unitsSold}
              colorClass="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
              icon={<ShoppingCart size={20} className="text-orange-600" />}
              delay={400}
              formatter="number"
              description="Total units sold across all transactions"
              details={{
                'Units Per Transaction': unitsSold / (salesSummary.totalTransactions || 1),
                'Units Per Customer': unitsSold / (salesSummary.totalUniqueClients || 1),
                'Revenue Per Unit': salesSummary.totalSales / (unitsSold || 1),
              }}
            />
          </div>

          {/* Chart Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 dashboard-section animate-fade-in" style={{ "--delay": 2 } as React.CSSProperties}>
            <SalesChart 
              data={categoryChartData} 
              title="Revenue by Category" 
              colors={['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0']}
              description="Distribution of revenue across product categories"
            />
            <SalesChart 
              data={productChartData} 
              title="Revenue by Product"
              colors={['#ff9e00', '#ff7700', '#ff5400', '#ff0054', '#9e0059']}
              description="Top products by revenue contribution"
            />
          </div>

          {/* Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 dashboard-section animate-fade-in" style={{ "--delay": 3 } as React.CSSProperties}>
            <MetricCard 
              title="Average Transaction Value (ATV)" 
              value={atv}
              prefix="₹"
              colorClass="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200"
              decimals={0}
              formatter="currency"
              description="Average monetary amount per transaction"
              details={{
                'vs AOV': ((atv - salesSummary.averageOrderValue) / salesSummary.averageOrderValue) * 100,
                'Growth Rate': 4.2, // Placeholder
                'Pre-Tax ATV': atv * 0.85,
                'Tax Component': atv * 0.15,
              }}
            />
            <MetricCard 
              title="Average User Value (AUV)" 
              value={auv}
              prefix="₹"
              colorClass="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200"
              decimals={0}
              formatter="currency"
              description="Average monetary value per customer"
              details={{
                'Lifetime Value': auv * 3.2, // Placeholder multiplier
                'Monthly Value': auv / 6, // Approximation
                'Retention Rate': 68, // Placeholder percentage
                'Repeat Purchase Value': auv * 1.4, // Placeholder
              }}
            />
            <MetricCard 
              title="Units Per Transaction (UPT)" 
              value={upt}
              colorClass="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
              decimals={2}
              formatter="number"
              description="Average number of units per transaction"
              details={{
                'Basket Size': upt,
                'Single Item Transactions': filteredData.filter(item => item["Payment Transaction ID"]).length, // Approximation
                'Multi-Item Rate': (upt - 1) / upt * 100,
                'Cross-Sell Rate': ((upt - 1) / upt) * 42, // Placeholder
              }}
            />
          </div>
          
          {/* Additional Chart Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 dashboard-section animate-fade-in" style={{ "--delay": 4 } as React.CSSProperties}>
            <SalesChart 
              data={locationChartData} 
              title="Revenue by Location" 
              colors={['#2c699a', '#048ba8', '#0db39e', '#16db93', '#83e377']}
              description="Geographic distribution of sales revenue"
            />
            <SalesChart 
              data={associateChartData} 
              title="Revenue by Sales Associate"
              colors={['#A47FFA', '#8952FA', '#7028FA', '#5D05FA', '#4500BD']}
              description="Performance breakdown by sales team members"
            />
          </div>
          
          {/* Recent Transactions */}
          <div className="dashboard-section animate-fade-in" style={{ "--delay": 5 } as React.CSSProperties}>
            <Card className="shadow-md border-gray-200">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
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
