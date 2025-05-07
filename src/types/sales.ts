
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
  [key: string]: string;
}

export interface SalesSummary {
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalProducts: number;
  revenueByCategory: Record<string, number>;
  revenueByProduct: Record<string, number>;
  salesByMethod: Record<string, number>;
  salesByLocation: Record<string, number>;
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
