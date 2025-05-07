
export interface SalesItem {
  "Member ID": string;
  "Customer Name": string;
  "Customer Email": string;
  "Paying Member ID": string;
  "Sale Item ID": string;
  "Payment Category": string;
  "Payment Date": string;
  "Payment Value": string;
  "Paid In Money Credits": string;
  "Payment VAT": string;
  "Payment Item": string;
  "Payment Method": string;
  "Payment Status": string;
  "Payment Transaction ID": string;
  "Stripe Token": string;
  "Sold By": string;
  "Calculated Location": string;
  "Cleaned Product": string;
  "Cleaned Category": string;
  "Month"?: number;
  "Year"?: number;
  "MonthYear"?: string;
  "Tax Amount"?: number;
  "Revenue Post Tax"?: number;
  "Revenue Pre Tax"?: number;
  "Sales Associate"?: string;
  [key: string]: any;
}

export interface SalesSummary {
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalProducts: number;
  totalUniqueClients: number;
  revenueByCategory: Record<string, number>;
  revenueByProduct: Record<string, number>;
  salesByMethod: Record<string, number>;
  salesByLocation: Record<string, number>;
  salesByAssociate: Record<string, number>;
  monthlyData: MonthlyData[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface TimePeriod {
  id: string;
  label: string;
  days: number;
  active: boolean;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  active: boolean;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface MonthlyData {
  monthYear: string;
  sortKey: string;
  totalSales: number;
  totalTax: number;
  unitsSold: number;
  transactions: number;
  uniqueClients: number;
  preTaxRevenue: number;
  postTaxRevenue: number;
  atv: number;
  auv: number;
  averageSpend: number;
}

export interface ViewOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface GroupedTotals {
  totalRevenue: number;
  preTaxRevenue: number;
  taxAmount: number;
  unitsSold: number;
  transactions: number;
  uniqueClients: number;
  atv: number;
  auv: number;
}

export interface PerformanceMetric {
  key: string;
  name: string;
  value: number;
  trend?: number;
}
