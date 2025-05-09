import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, ArrowUp, ArrowDown } from 'lucide-react';

interface SalesData {
  name: string;
  value: number;
  color?: string;
}

interface CategoryData {
  category: string;
  sales: number;
}

interface SalesGrowthData {
  month: string;
  sales: number;
  growth: number;
}

interface TopProduct {
  name: string;
  sales: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const salesData: SalesData[] = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

const categoryData: CategoryData[] = [
  { category: 'Electronics', sales: 400 },
  { category: 'Clothing', sales: 300 },
  { category: 'Home Goods', sales: 200 },
  { category: 'Books', sales: 278 },
  { category: 'Toys', sales: 189 },
];

const salesGrowthData: SalesGrowthData[] = [
  { month: 'Jan', sales: 4000, growth: 10 },
  { month: 'Feb', sales: 3000, growth: -5 },
  { month: 'Mar', sales: 2000, growth: 3 },
  { month: 'Apr', sales: 2780, growth: 7 },
  { month: 'May', sales: 1890, growth: -2 },
  { month: 'Jun', sales: 2390, growth: 5 },
  { month: 'Jul', sales: 3490, growth: 9 },
];

const topProducts: TopProduct[] = [
  { name: 'Product A', sales: 4000, color: '#0088FE' },
  { name: 'Product B', sales: 3000, color: '#00C49F' },
  { name: 'Product C', sales: 2000, color: '#FFBB28' },
  { name: 'Product D', sales: 2780, color: '#FF8042' },
  { name: 'Product E', sales: 1890, color: '#8884d8' },
];

interface SalesChartProps {
    data: SalesData[];
    isLoading: boolean;
}

const SalesChart: React.FC<SalesChartProps> = ({ data, isLoading }) => {
    if (isLoading) {
        return <p>Loading chart...</p>;
    }

    if (!data || data.length === 0) {
        return <p>No data available for the chart.</p>;
    }

    return (
        <Card className="col-span-4 md:col-span-8 lg:col-span-8">
            <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
            </CardHeader>
            <CardContent className="pl-2 pb-4">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default SalesChart;

export const CategoryBreakdown = () => {
  return (
    <Card className="col-span-4 md:col-span-4 lg:col-span-3">
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              dataKey="sales"
              isAnimationActive={false}
              data={categoryData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const SalesGrowth = () => {
  return (
    <Card className="col-span-4 md:col-span-4 lg:col-span-4">
      <CardHeader>
        <CardTitle>Sales Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesGrowthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const TopProducts = () => {
    return (
      <Card className="col-span-4 md:col-span-8 lg:col-span-4">
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between">
                <span className="font-medium">{product.name}</span>
                <Badge variant="secondary">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {product.sales}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

export const RevenueOverview = () => {
    const revenue = 54000;
    const growth = 12.5;
  
    return (
      <Card className="col-span-4 md:col-span-4 lg:col-span-3">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${revenue}</div>
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            {growth > 0 ? (
              <ArrowUp className="h-4 w-4 mr-1 text-green-500" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1 text-red-500" />
            )}
            <span>{growth}% vs last month</span>
          </div>
        </CardContent>
      </Card>
    );
  };

export const RadialBarChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadialBarChart 
        cx="50%" 
        cy="50%" 
        innerRadius="10%" 
        outerRadius="80%" 
        barSize={10} 
        data={data}
      >
        <RadialBar
          label={{ position: "insideEnd", fill: "#333", fontSize: 11 }}
          background
          dataKey="value"
          animationDuration={900}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </RadialBar>
        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
        <Tooltip />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};
