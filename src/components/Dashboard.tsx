
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
  CreditCard,
  RefreshCw,
  Loader
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import CategoryAnalysis from './CategoryAnalysis';
import ExecutiveSummary from './ExecutiveSummary';
import TopPerformers from './TopPerformers';
import CustomTableBuilder from './CustomTableBuilder';

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
        (item["Customer Name"]?.toLowerCase().includes(query) || false) || 
        (item["Customer Email"]?.toLowerCase().includes(query) || false) ||
        (item["Payment Item"]?.toLowerCase().includes(query) || false) ||
        (item["Calculated Location"]?.toLowerCase().includes(query) || false) ||
        (item["Cleaned Product"]?.toLowerCase().includes(query) || false) ||
        (item["Payment Transaction ID"]?.toLowerCase().includes(query) || false) ||
        (item["Cleaned Category"]?.toLowerCase().includes(query) || false) ||
        (item["Sold By"]?.toLowerCase().includes(query) || false)
      );
    }
    
    // Apply price range filter
    data = data.filter(item => {
      const price = parseFloat(item["Payment Value"] || '0');
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
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await sheetService.fetchSalesData();
      setSalesData(data);
      
      // Set max price for range filter based on actual data
      const maxSalePrice = Math.max(...data.map(item => parseFloat(item["Payment Value"] || '0')));
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
    await fetchSalesData();
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
        
        <Button 
          variant="outline"
          onClick={handleRefreshData}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Refresh Data</span>
        </Button>
      </div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="spinner-overlay">
          <div className="spinner" />
          <div className="mt-4 text-white font-medium">Loading data...</div>
        </div>
      )}
      
      {/* Filter Panel */}
      <FilterPanel 
        periods={timePeriods}
        onPeriodSelect={handlePeriodChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefreshData}
        minPrice={0}
        maxPrice={Math.max(...salesData.map(item => parseFloat(item["Payment Value"] || '0')))}
        onPriceRangeChange={handlePriceRangeChange}
        isLoading={isLoading}
        salesData={salesData}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="tabs-list">
          <TabsTrigger value="dashboard" className="tab-trigger">
            <div className="flex items-center gap-2">
              <LayoutDashboard size={16} />
              <span className="hidden md:inline">Dashboard</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="executive" className="tab-trigger">
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span className="hidden md:inline">Executive Summary</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="products" className="tab-trigger">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} />
              <span className="hidden md:inline">Products</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="categories" className="tab-trigger">
            <div className="flex items-center gap-2">
              <Tags size={16} />
              <span className="hidden md:inline">Categories</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="associates" className="tab-trigger">
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span className="hidden md:inline">Associates</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="locations" className="tab-trigger">
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span className="hidden md:inline">Locations</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="payment" className="tab-trigger">
            <div className="flex items-center gap-2">
              <CreditCard size={16} />
              <span className="hidden md:inline">Payment Methods</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="performace" className="tab-trigger">
            <div className="flex items-center gap-2">
              <Trophy size={16} />
              <span className="hidden md:inline">Performance</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="tab-trigger">
            <div className="flex items-center gap-2">
              <Table size={16} />
              <span className="hidden md:inline">Transactions</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="custom-tables" className="tab-trigger">
            <div className="flex items-center gap-2">
              <ChartBarIcon size={16} />
              <span className="hidden md:inline">Custom Tables</span>
            </div>
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
              value={Math.round(atv)}
              prefix="₹"
              colorClass="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200"
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
              value={Math.round(auv)}
              prefix="₹"
              colorClass="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200"
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
              value={Math.round(upt * 100) / 100}
              colorClass="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
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
          
          {/* Transactions Table */}
          <div className="dashboard-section animate-fade-in" style={{ "--delay": 5 } as React.CSSProperties}>
            <SalesTable 
              data={filteredData} 
              isLoading={isLoading}
              refreshData={handleRefreshData}
            />
          </div>
        </TabsContent>
        
        {/* Executive Summary Tab */}
        <TabsContent value="executive" className="m-0">
          <ExecutiveSummary salesSummary={salesSummary} />
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products" className="m-0">
          <CategoryAnalysis 
            salesData={filteredData}
            salesSummary={salesSummary}
            fieldKey="Cleaned Product"
            title="Product"
          />
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className="m-0">
          <CategoryAnalysis 
            salesData={filteredData}
            salesSummary={salesSummary}
            fieldKey="Cleaned Category"
            title="Category"
          />
        </TabsContent>
        
        {/* Associates Tab */}
        <TabsContent value="associates" className="m-0">
          <CategoryAnalysis 
            salesData={filteredData}
            salesSummary={salesSummary}
            fieldKey="Sold By"
            title="Sales Associate"
          />
        </TabsContent>
        
        {/* Locations Tab */}
        <TabsContent value="locations" className="m-0">
          <CategoryAnalysis 
            salesData={filteredData}
            salesSummary={salesSummary}
            fieldKey="Calculated Location"
            title="Location"
          />
        </TabsContent>
        
        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="m-0">
          <CategoryAnalysis 
            salesData={filteredData}
            salesSummary={salesSummary}
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
          <SalesTable 
            data={filteredData} 
            isLoading={isLoading}
            refreshData={handleRefreshData}
          />
        </TabsContent>
        
        {/* Custom Tables Tab */}
        <TabsContent value="custom-tables" className="m-0">
          <CustomTableBuilder salesData={filteredData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
