
import React, { useState, useEffect } from 'react';
import { TimePeriod, SalesItem } from '@/types/sales';
import ExecutiveSummary from './ExecutiveSummary';
import SalesChart from './SalesChart';
import SalesTable from './SalesTable';
import TopPerformers from './TopPerformers';
import CategoryAnalysis from './CategoryAnalysis';
import FilterPanel from './FilterPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import sheetService from '@/services/sheetService';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const applyFilters = (data: SalesItem[], filters: Record<string, any>) => {
  let filteredData = [...data];

  // Apply location filter - fix the truthy expression
  if (filters.locations && filters.locations.length > 0) {
    filteredData = filteredData.filter(item => filters.locations.includes(item["Calculated Location"]));
  }

  // Apply product filter
  if (filters.products && filters.products.length > 0) {
    filteredData = filteredData.filter(item => filters.products.includes(item["Cleaned Product"]));
  }

  // Apply category filter
  if (filters.categories && filters.categories.length > 0) {
    filteredData = filteredData.filter(item => filters.categories.includes(item["Cleaned Category"]));
  }

  // Apply seller filter
  if (filters.sellers && filters.sellers.length > 0) {
    filteredData = filteredData.filter(item => filters.sellers.includes(item["Sold By"]));
  }

  // Apply payment method filter
  if (filters.paymentMethods && filters.paymentMethods.length > 0) {
    filteredData = filteredData.filter(item => filters.paymentMethods.includes(item["Payment Method"]));
  }

  return filteredData;
};

const Dashboard = () => {
  const [salesData, setSalesData] = useState<SalesItem[]>([]);
  const [filteredData, setFilteredData] = useState<SalesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [periods, setPeriods] = useState<TimePeriod[]>([
    { id: 'today', label: 'Today', days: 1, active: false },
    { id: 'yesterday', label: 'Yesterday', days: 1, active: false },
    { id: 'last7days', label: 'Last 7 Days', days: 7, active: false },
    { id: 'last30days', label: 'Last 30 Days', days: 30, active: true },
    { id: 'thisMonth', label: 'This Month', days: 30, active: false },
    { id: 'lastMonth', label: 'Last Month', days: 30, active: false },
    { id: 'thisYear', label: 'This Year', days: 365, active: false },
    { id: 'custom', label: 'Custom', days: 0, active: false }
  ]);

  // Fetch sales data
  useEffect(() => {
    loadSalesData();
  }, []);

  // Filter data when filters change
  useEffect(() => {
    if (salesData.length > 0) {
      let filtered = applyFilters(salesData, filters);
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => {
          return Object.values(item).some(value => 
            typeof value === 'string' && value.toLowerCase().includes(query)
          );
        });
      }
      
      setFilteredData(filtered);
    }
  }, [salesData, filters, searchQuery]);

  const loadSalesData = async () => {
    if (!isInitialLoad) setIsLoading(true);
    
    try {
      const data = await sheetService.fetchSalesData();
      setSalesData(data);
      setFilteredData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load sales data. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const handlePeriodSelect = (period: TimePeriod) => {
    const updatedPeriods = periods.map(p => ({
      ...p,
      active: p.id === period.id
    }));
    setPeriods(updatedPeriods);
    
    // Logic for filtering by period would go here
    // For now, just simulate a data refresh
    loadSalesData();
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const searchData = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor and analyze your sales data</p>
        </div>
        <Button 
          onClick={loadSalesData} 
          variant="outline" 
          className="mt-4 md:mt-0"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <FilterPanel 
        periods={periods}
        onPeriodSelect={handlePeriodSelect}
        searchQuery={searchQuery}
        onSearchChange={searchData}
        onRefresh={loadSalesData}
        minPrice={0}
        maxPrice={10000}
        onPriceRangeChange={(min, max) => console.log("Price range:", min, max)}
        isLoading={isLoading}
        salesData={salesData}
        onFilterChange={handleFilterChange}
        filters={filters}
      />
      
      <ExecutiveSummary salesSummary={{
        totalSales: filteredData.reduce((sum, item) => sum + parseFloat(item["Payment Value"] || "0"), 0),
        totalTransactions: filteredData.length,
        averageOrderValue: filteredData.length > 0 ? 
          filteredData.reduce((sum, item) => sum + parseFloat(item["Payment Value"] || "0"), 0) / filteredData.length : 0,
        totalProducts: [...new Set(filteredData.map(item => item["Cleaned Product"]))].length,
        totalUniqueClients: [...new Set(filteredData.map(item => item["Member ID"]))].length,
        revenueByCategory: {},
        revenueByProduct: {},
        salesByMethod: {},
        salesByLocation: {},
        salesByAssociate: {},
        monthlyData: [],
        dateRange: {
          start: new Date(),
          end: new Date()
        }
      }} />
      
      <SalesChart data={filteredData} isLoading={isLoading} />

      <Tabs defaultValue="sales" className="mt-8">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="sales">Sales Table</TabsTrigger>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <SalesTable data={filteredData} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="top-performers">
          <TopPerformers salesData={filteredData} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoryAnalysis 
            salesSummary={{
              totalSales: filteredData.reduce((sum, item) => sum + parseFloat(item["Payment Value"] || "0"), 0),
              totalTransactions: filteredData.length,
              averageOrderValue: filteredData.length > 0 ? 
                filteredData.reduce((sum, item) => sum + parseFloat(item["Payment Value"] || "0"), 0) / filteredData.length : 0,
              totalProducts: [...new Set(filteredData.map(item => item["Cleaned Product"]))].length,
              totalUniqueClients: [...new Set(filteredData.map(item => item["Member ID"]))].length,
              revenueByCategory: {},
              revenueByProduct: {},
              salesByMethod: {},
              salesByLocation: {},
              salesByAssociate: {},
              monthlyData: [],
              dateRange: {
                start: new Date(),
                end: new Date()
              }
            }} 
            salesData={filteredData}
            fieldKey="Cleaned Category"
            title="Category"
          />
        </TabsContent>
        
        <TabsContent value="monthly">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Monthly Performance</h2>
            <p className="text-gray-500">Monthly sales analysis will be displayed here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
