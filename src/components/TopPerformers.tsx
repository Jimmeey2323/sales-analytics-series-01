
import React from 'react';
import { Card } from '@/components/ui/card';
import { SalesSummary, ChartData, PerformanceMetric } from '@/types/sales';
import { getTopPerformers, getBottomPerformers, formatCurrency } from '@/utils/salesUtils';
import { Trophy, ThumbsDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopPerformersProps {
  salesSummary: SalesSummary;
}

const PerformanceSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  metrics: PerformanceMetric[];
  positive?: boolean;
}> = ({ title, icon, metrics, positive = true }) => {
  const colorClass = positive 
    ? "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200" 
    : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200";
  
  const barColor = positive ? "#FF9800" : "#9E9E9E";

  return (
    <Card className={`p-5 ${colorClass}`}>
      <div className="flex items-center mb-4">
        <div className={`p-2 rounded-full mr-3 ${positive ? "bg-amber-100" : "bg-gray-200"}`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={metric.key} className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">{metric.name}</span>
              <span className={`font-semibold ${positive ? "text-amber-600" : "text-gray-600"}`}>
                {formatCurrency(metric.value)}
              </span>
            </div>
            
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: `${(metric.value / metrics[0].value) * 100}%`,
                  backgroundColor: barColor
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={metrics.map(m => ({ name: m.name, value: m.value }))}
            margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fontSize: 12 }} 
              width={120}
            />
            <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
            <Bar dataKey="value" fill={barColor} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const TopPerformers: React.FC<TopPerformersProps> = ({ salesSummary }) => {
  const categoryPerformers = {
    top: getTopPerformers(salesSummary.revenueByCategory, 5).map((item, index) => ({
      key: `top-category-${index}`,
      name: item.name,
      value: item.value,
    })),
    bottom: getBottomPerformers(salesSummary.revenueByCategory, 5).map((item, index) => ({
      key: `bottom-category-${index}`,
      name: item.name,
      value: item.value,
    }))
  };

  const productPerformers = {
    top: getTopPerformers(salesSummary.revenueByProduct, 5).map((item, index) => ({
      key: `top-product-${index}`,
      name: item.name,
      value: item.value,
    })),
    bottom: getBottomPerformers(salesSummary.revenueByProduct, 5).map((item, index) => ({
      key: `bottom-product-${index}`,
      name: item.name,
      value: item.value,
    }))
  };

  const locationPerformers = {
    top: getTopPerformers(salesSummary.salesByLocation, 5).map((item, index) => ({
      key: `top-location-${index}`,
      name: item.name,
      value: item.value,
    })),
    bottom: getBottomPerformers(salesSummary.salesByLocation, 5).map((item, index) => ({
      key: `bottom-location-${index}`,
      name: item.name,
      value: item.value,
    }))
  };

  const associatePerformers = {
    top: getTopPerformers(salesSummary.salesByAssociate, 5).map((item, index) => ({
      key: `top-associate-${index}`,
      name: item.name,
      value: item.value,
    })),
    bottom: getBottomPerformers(salesSummary.salesByAssociate, 5).map((item, index) => ({
      key: `bottom-associate-${index}`,
      name: item.name,
      value: item.value,
    }))
  };
  
  const paymentMethodPerformers = {
    top: getTopPerformers(salesSummary.salesByMethod, 5).map((item, index) => ({
      key: `top-method-${index}`,
      name: item.name,
      value: item.value,
    })),
    bottom: getBottomPerformers(salesSummary.salesByMethod, 5).map((item, index) => ({
      key: `bottom-method-${index}`,
      name: item.name,
      value: item.value,
    }))
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories">
        <TabsList className="bg-white border mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="associates">Associates</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformanceSection 
              title="Top Performing Categories" 
              icon={<Trophy className="text-amber-600" size={20} />} 
              metrics={categoryPerformers.top} 
            />
            <PerformanceSection 
              title="Bottom Performing Categories" 
              icon={<ThumbsDown className="text-gray-600" size={20} />} 
              metrics={categoryPerformers.bottom} 
              positive={false}
            />
          </div>
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformanceSection 
              title="Top Performing Products" 
              icon={<Trophy className="text-amber-600" size={20} />}
              metrics={productPerformers.top} 
            />
            <PerformanceSection 
              title="Bottom Performing Products" 
              icon={<ThumbsDown className="text-gray-600" size={20} />}
              metrics={productPerformers.bottom} 
              positive={false}
            />
          </div>
        </TabsContent>
        
        {/* Locations Tab */}
        <TabsContent value="locations" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformanceSection 
              title="Top Performing Locations" 
              icon={<Trophy className="text-amber-600" size={20} />}
              metrics={locationPerformers.top} 
            />
            <PerformanceSection 
              title="Bottom Performing Locations" 
              icon={<ThumbsDown className="text-gray-600" size={20} />}
              metrics={locationPerformers.bottom} 
              positive={false}
            />
          </div>
        </TabsContent>
        
        {/* Associates Tab */}
        <TabsContent value="associates" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformanceSection 
              title="Top Performing Associates" 
              icon={<Trophy className="text-amber-600" size={20} />}
              metrics={associatePerformers.top} 
            />
            <PerformanceSection 
              title="Bottom Performing Associates" 
              icon={<ThumbsDown className="text-gray-600" size={20} />}
              metrics={associatePerformers.bottom} 
              positive={false}
            />
          </div>
        </TabsContent>
        
        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformanceSection 
              title="Top Payment Methods" 
              icon={<Trophy className="text-amber-600" size={20} />}
              metrics={paymentMethodPerformers.top} 
            />
            <PerformanceSection 
              title="Bottom Payment Methods" 
              icon={<ThumbsDown className="text-gray-600" size={20} />}
              metrics={paymentMethodPerformers.bottom} 
              positive={false}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopPerformers;
