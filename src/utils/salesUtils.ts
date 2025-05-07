
import { SalesItem, SalesSummary, ChartData, MonthlyData } from '../types/sales';

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

  // Count unique clients
  const uniqueClients = new Set();
  data.forEach(item => {
    if (item["Member ID"]) {
      uniqueClients.add(item["Member ID"]);
    }
  });
  
  const totalUniqueClients = uniqueClients.size;
  
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
  
  // Sales by associate
  const salesByAssociate: Record<string, number> = {};
  data.forEach(item => {
    const associate = item["Sold By"] || "Unknown";
    const value = parseFloat(item["Payment Value"]) || 0;
    
    salesByAssociate[associate] = (salesByAssociate[associate] || 0) + value;
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

  // Monthly data for trends
  const monthlyData = getMonthlyData(data);

  return {
    totalSales,
    totalTransactions,
    averageOrderValue,
    totalProducts,
    totalUniqueClients,
    revenueByCategory,
    revenueByProduct,
    salesByMethod,
    salesByLocation,
    salesByAssociate,
    monthlyData,
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
  if (amount >= 10000000) { // 1 Crore = 10,000,000
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) { // 1 Lakh = 100,000
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) { // 1 Thousand
    return `₹${(amount / 1000).toFixed(2)} K`;
  } else {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }
};

export const formatNumber = (value: number): string => {
  if (value >= 10000000) { // 1 Crore = 10,000,000
    return `${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) { // 1 Lakh = 100,000
    return `${(value / 100000).toFixed(2)} L`;
  } else if (value >= 1000) { // 1 Thousand
    return `${(value / 1000).toFixed(2)}K`;
  } else {
    return value.toFixed(0);
  }
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

export const getMonthlyData = (data: SalesItem[]): MonthlyData[] => {
  const monthlyMap = new Map<string, any>();

  data.forEach(item => {
    const date = parseDate(item["Payment Date"]);
    if (!date) return;
    
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const displayDate = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
    if (!monthlyMap.has(monthYear)) {
      monthlyMap.set(monthYear, {
        monthYear: displayDate,
        sortKey: monthYear,
        totalSales: 0,
        totalTax: 0,
        unitsSold: 0,
        transactions: 0,
        uniqueClients: new Set(),
        preTaxRevenue: 0,
        postTaxRevenue: 0,
      });
    }
    
    const monthData = monthlyMap.get(monthYear);
    const saleValue = parseFloat(item["Payment Value"]) || 0;
    const taxValue = parseFloat(item["Payment VAT"] || "0") || (saleValue * 0.15); // Assuming 15% VAT if not provided
    
    monthData.totalSales += saleValue;
    monthData.totalTax += taxValue;
    monthData.unitsSold += 1;
    monthData.transactions += 1;
    monthData.preTaxRevenue += (saleValue - taxValue);
    monthData.postTaxRevenue += saleValue;
    
    if (item["Member ID"]) {
      monthData.uniqueClients.add(item["Member ID"]);
    }
  });
  
  // Convert the Map to an array and calculate the derived metrics
  return Array.from(monthlyMap.values())
    .map(month => ({
      ...month,
      uniqueClients: month.uniqueClients.size,
      atv: month.totalSales / (month.transactions || 1),
      auv: month.totalSales / (month.uniqueClients.size || 1),
      averageSpend: month.totalSales / (month.uniqueClients.size || 1)
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
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

export const getTopPerformers = (data: Record<string, number>, count = 5): ChartData[] => {
  return Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, count);
};

export const getBottomPerformers = (data: Record<string, number>, count = 5): ChartData[] => {
  return Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0) // Only include items with positive values
    .sort((a, b) => a.value - b.value)
    .slice(0, count);
};

export const groupByField = (data: SalesItem[], field: keyof SalesItem): Record<string, SalesItem[]> => {
  const grouped: Record<string, SalesItem[]> = {};
  
  data.forEach(item => {
    const key = item[field]?.toString() || "Unknown";
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
};

export const calculateGroupTotals = (groupedData: Record<string, SalesItem[]>): Record<string, any> => {
  const groupTotals: Record<string, any> = {};
  
  Object.entries(groupedData).forEach(([key, items]) => {
    const totalValue = items.reduce((sum, item) => sum + (parseFloat(item["Payment Value"]) || 0), 0);
    const taxAmount = items.reduce((sum, item) => sum + (parseFloat(item["Payment VAT"]) || 0), 0);
    const uniqueClients = new Set(items.map(item => item["Member ID"])).size;
    
    groupTotals[key] = {
      totalRevenue: totalValue,
      preTaxRevenue: totalValue - taxAmount,
      taxAmount,
      unitsSold: items.length,
      transactions: new Set(items.map(item => item["Payment Transaction ID"])).size,
      uniqueClients,
      atv: totalValue / (items.length || 1),
      auv: totalValue / (uniqueClients || 1)
    };
  });
  
  return groupTotals;
};
