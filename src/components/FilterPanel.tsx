
import React, { useState } from 'react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, ChevronUp, Filter, Calendar, X, Search, SlidersHorizontal } from 'lucide-react';
import { TimePeriod } from '@/types/sales';
import TimeFilter from './TimeFilter';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface FilterPanelProps {
  periods: TimePeriod[];
  onPeriodSelect: (period: TimePeriod) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceRangeChange?: (min: number, max: number) => void;
  isLoading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  periods,
  onPeriodSelect,
  searchQuery,
  onSearchChange,
  onRefresh,
  minPrice = 0,
  maxPrice = 10000,
  onPriceRangeChange,
  isLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  const [date, setDate] = useState<Date>();
  
  const activePeriod = periods.find(p => p.active);
  
  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
    if (onPriceRangeChange) {
      onPriceRangeChange(values[0], values[1]);
    }
  };

  const clearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium text-gray-800">Filters & Search</h3>
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                {activePeriod?.label || 'All Time'}
              </Badge>
              
              {searchQuery && (
                <Badge variant="outline" className="bg-gray-100 text-gray-700 flex items-center gap-1">
                  <span className="max-w-[100px] truncate">{searchQuery}</span>
                  <X className="h-3 w-3 cursor-pointer" onClick={clearSearch} />
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm">
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 border-t border-gray-100 bg-gray-50/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Search className="h-4 w-4" /> Search
                </h4>
                <div className="relative">
                  <Input
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-10 rounded-full border-gray-300"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  {searchQuery && (
                    <X 
                      className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" 
                      onClick={clearSearch}
                    />
                  )}
                </div>
              </div>
              
              {/* Time Period Filter */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Time Period
                </h4>
                <TimeFilter periods={periods} onSelect={onPeriodSelect} />
                
                <div className="mt-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-gray-500 border-gray-300">
                        {date ? format(date, 'PPP') : 'Custom date...'}
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Price Range Filter */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Price Range
                </h4>
                <div className="px-3 py-5">
                  <Slider
                    defaultValue={[minPrice, maxPrice]}
                    max={maxPrice}
                    min={minPrice}
                    step={100}
                    value={priceRange}
                    onValueChange={handlePriceChange}
                    className="mb-6"
                  />
                  <div className="flex items-center justify-between">
                    <div className="bg-white p-2 rounded border border-gray-200 text-xs font-medium text-gray-700">
                      ₹{priceRange[0]}
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200 text-xs font-medium text-gray-700">
                      ₹{priceRange[1]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
              
              <Button 
                onClick={onRefresh} 
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-300"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FilterPanel;
