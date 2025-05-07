
import { SalesItem, SalesSummary, ChartData } from '../types/sales';

export const calculateSummary = (data: SalesItem[]): SalesSummary => {
  // Initial calculations
  const totalSales = data.reduce((sum, item) => {
    const value = parseFloat(item["Payment Value"]) || 0;
    return sum + value;
  }, 0);

  const totalTransactions = data.length;
  
  const averageOrderValue = totalSales / (totalTransactions || 1);
  
  // Count unique products
  const uniqueProducts = new Set();
  data.forEach(item => {
    if (item["Cleaned Product"]) {
      uniqueProducts.add(item["Cleaned Product"]);
    }
  });
  
  const totalProducts = uniqueProducts.size;
  
  // Revenue by category
  const revenueByCategory: Record<string, number> = {};
  data.forEach(item => {
    const category = item["Cleaned Category"] || "Uncategorized";
    const value = parseFloat(item["Payment Value"]) || 0;
    
    revenueByCategory[category] = (revenueByCategory[category] || 0) + value;
  });
  
  // Revenue by product
  const revenueByProduct: Record<string, number> = {};
  data.forEach(item => {
    const product = item["Cleaned Product"] || "Other";
    const value = parseFloat(item["Payment Value"]) || 0;
    
    revenueByProduct[product] = (revenueByProduct[product] || 0) + value;
  });
  
  // Sales by payment method
  const salesByMethod: Record<string, number> = {};
  data.forEach(item => {
    const method = item["Payment Method"] || "Other";
    const value = parseFloat(item["Payment Value"]) || 0;
    
    salesByMethod[method] = (salesByMethod[method] || 0) + value;
  });
  
  // Sales by location
  const salesByLocation: Record<string, number> = {};
  data.forEach(item => {
    const location = item["Calculated Location"] || "Unknown";
    const value = parseFloat(item["Payment Value"]) || 0;
    
    salesByLocation[location] = (salesByLocation[location] || 0) + value;
  });
  
  // Find date range
  let minDate = new Date();
  let maxDate = new Date(0);
  
  data.forEach(item => {
    if (item["Payment Date"]) {
      // Handle potential date format variations
      const date = parseDate(item["Payment Date"]);
      if (date) {
        if (date < minDate) minDate = date;
        if (date > maxDate) maxDate = date;
      }
    }
  });

  return {
    totalSales,
    totalTransactions,
    averageOrderValue,
    totalProducts,
    revenueByCategory,
    revenueByProduct,
    salesByMethod,
    salesByLocation,
    dateRange: {
      start: minDate,
      end: maxDate
    }
  };
};

export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  // Try different date formats
  // Format: DD/MM/YYYY HH:mm:ss
  const formats = [
    /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/,  // DD/MM/YYYY HH:mm:ss
    /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
    /(\d{4})-(\d{2})-(\d{2})/     // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      if (match.length === 7) {
        // DD/MM/YYYY HH:mm:ss
        return new Date(
          parseInt(match[3], 10),
          parseInt(match[2], 10) - 1,
          parseInt(match[1], 10),
          parseInt(match[4], 10),
          parseInt(match[5], 10),
          parseInt(match[6], 10)
        );
      } else if (match.length === 4) {
        // DD/MM/YYYY
        return new Date(
          parseInt(match[3], 10),
          parseInt(match[2], 10) - 1,
          parseInt(match[1], 10)
        );
      } else if (match.length === 4) {
        // YYYY-MM-DD
        return new Date(
          parseInt(match[1], 10),
          parseInt(match[2], 10) - 1,
          parseInt(match[3], 10)
        );
      }
    }
  }
  
  // Last resort, try standard parsing
  const parsedDate = new Date(dateString);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const filterDataByDateRange = (data: SalesItem[], days: number): SalesItem[] => {
  if (days === 0) return data; // Return all data if no filter
  
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  return data.filter(item => {
    const paymentDate = parseDate(item["Payment Date"]);
    return paymentDate ? paymentDate >= cutoffDate : false;
  });
};

export const convertToChartData = (dataObj: Record<string, number>): ChartData[] => {
  return Object.entries(dataObj)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const getTopItems = (items: ChartData[], count = 5): ChartData[] => {
  const topItems = items.slice(0, count);
  
  // Calculate "Others" if there are more items
  if (items.length > count) {
    const othersTotal = items
      .slice(count)
      .reduce((sum, item) => sum + item.value, 0);
      
    topItems.push({ name: 'Others', value: othersTotal });
  }
  
  return topItems;
};

export const calculateUnitsSold = (data: SalesItem[]): number => {
  return data.length;
};

export const calculateATVAndAUV = (data: SalesItem[]): { atv: number, auv: number } => {
  // ATV - Average Transaction Value
  const atv = data.reduce((sum, item) => sum + (parseFloat(item["Payment Value"]) || 0), 0) / 
    (data.length || 1);
    
  // Calculate unique customers and their total value
  const customerMap = new Map<string, number>();
  data.forEach(item => {
    const customerId = item["Member ID"];
    if (customerId) {
      const currentTotal = customerMap.get(customerId) || 0;
      customerMap.set(customerId, currentTotal + (parseFloat(item["Payment Value"]) || 0));
    }
  });
  
  // AUV - Average User Value
  const uniqueCustomers = customerMap.size || 1;
  const totalValue = Array.from(customerMap.values()).reduce((sum, value) => sum + value, 0);
  const auv = totalValue / uniqueCustomers;
  
  return { atv, auv };
};

export const calculateUPT = (data: SalesItem[]): number => {
  // UPT - Units Per Transaction
  // We need to group by transaction ID
  const transactions = new Map<string, number>();
  
  data.forEach(item => {
    const transactionId = item["Payment Transaction ID"];
    if (transactionId) {
      const currentCount = transactions.get(transactionId) || 0;
      transactions.set(transactionId, currentCount + 1);
    }
  });
  
  // Calculate average UPT
  const totalTransactions = transactions.size || 1;
  const totalUnits = data.length;
  
  return totalUnits / totalTransactions;
};
