
import React, { useState } from 'react';
import CounterAnimation from './CounterAnimation';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Info, ExternalLink } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/salesUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SalesChart from './SalesChart';
import { PieChart, LineChart } from 'lucide-react';
import { ChartData } from '@/types/sales';

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: React.ReactNode;
  colorClass?: string;
  trend?: number;
  delay?: number;
  details?: Record<string, number>;
  formatter?: 'currency' | 'number' | 'percent';
  description?: string;
  chartData?: ChartData[];
  timeSeriesData?: Array<{ date: string; value: number }>;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon,
  colorClass = 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
  trend,
  delay = 0,
  details,
  formatter = 'number',
  description,
  chartData,
  timeSeriesData
}) => {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  const formatValue = (val: number) => {
    if (formatter === 'currency') {
      return formatCurrency(val);
    } else if (formatter === 'number') {
      return formatNumber(val);
    } else if (formatter === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    return val.toFixed(decimals);
  };

  // Convert detailed data for additional chart visualization
  const detailsToChartData = (): ChartData[] => {
    if (!details) return [];
    return Object.entries(details).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  return (
    <>
      <Card 
        className={`metric-card transition-all duration-500 shadow-lg hover:shadow-xl ${colorClass} overflow-hidden border-l-4 ${
          expanded ? 'h-auto' : 'h-36'
        }`}
        style={{ 
          animationDelay: `${delay}ms`,
          borderLeftColor: expanded ? 'var(--primary)' : 'transparent'
        }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-1.5 cursor-help">
                        <Info size={14} className="text-gray-400 hover:text-gray-600" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {icon && <div className="text-gray-600">{icon}</div>}
              {details && (
                <div className="flex items-center space-x-2">
                  <Collapsible open={expanded} onOpenChange={setExpanded}>
                    <CollapsibleTrigger asChild>
                      <button 
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-full p-1 transition-colors"
                        aria-label={expanded ? "Collapse details" : "Expand details"}
                      >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </CollapsibleTrigger>
                  </Collapsible>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto w-auto"
                    onClick={() => setModalOpen(true)}
                  >
                    <ExternalLink size={16} className="text-gray-500 hover:text-gray-700" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-baseline">
            <div className="metric-value text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              <CounterAnimation 
                value={value} 
                prefix={prefix} 
                suffix={suffix} 
                decimals={decimals}
                formatter={formatter === 'currency' ? formatCurrency : formatter === 'number' ? formatNumber : undefined}
              />
            </div>
          </div>
          
          {trend !== undefined && (
            <div className="mt-2">
              <span className={`flex items-center text-xs font-medium ${
                trend >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {trend >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span className="ml-0.5">{Math.abs(trend).toFixed(1)}%</span>
                <span className="text-xs text-gray-400 ml-1">vs prev. period</span>
              </span>
            </div>
          )}
          
          {details && expanded && (
            <Collapsible open={expanded}>
              <CollapsibleContent>
                <div className="mt-4 pt-2 border-t border-gray-200">
                  {Object.entries(details).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center py-1.5 text-sm hover:bg-gray-50/50 px-1 rounded transition-colors">
                      <span className="text-gray-600">{key}</span>
                      <span className="font-medium text-gray-800">{formatValue(val)}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {icon && <span>{icon}</span>}
              <span>{title} Details</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-6 py-4">
            <div className="bg-gray-50/50 p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-2 text-gray-700">Overview</h3>
              <div className="text-3xl font-bold">
                {formatValue(value)}
                {trend !== undefined && (
                  <span className={`ml-3 text-lg ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                  </span>
                )}
              </div>
              {description && <p className="mt-2 text-gray-600">{description}</p>}
            </div>

            {details && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center gap-2">
                    <LineChart size={18} className="text-primary" />
                    <span>Breakdown</span>
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(details).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">{key}</span>
                          <span className="font-medium">{formatValue(val)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                            style={{ width: `${(val / (Math.max(...Object.values(details)) || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center gap-2">
                    <PieChart size={18} className="text-primary" />
                    <span>Distribution</span>
                  </h3>
                  <div className="h-64">
                    <SalesChart 
                      data={detailsToChartData()} 
                      title={title}
                      colors={['#4361ee', '#7209b7', '#f72585']}
                      description={`Distribution of ${title}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {timeSeriesData && timeSeriesData.length > 0 && (
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Historical Trend</h3>
                <div className="h-64">
                  {/* You would implement a line chart here using the timeSeriesData */}
                </div>
              </div>
            )}

            {chartData && chartData.length > 0 && (
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Related Data</h3>
                <div className="h-64">
                  <SalesChart 
                    data={chartData} 
                    title={`${title} Breakdown`}
                    colors={['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0']}
                    description={`Detailed breakdown of ${title}`}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MetricCard;
