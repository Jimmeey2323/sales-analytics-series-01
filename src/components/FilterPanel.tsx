
import React, { useState, useMemo } from 'react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Calendar, 
  X, 
  Search, 
  SlidersHorizontal,
  CalendarRange,
  Tag,
  MapPin,
  User,
  CreditCard
} from 'lucide-react';
import { TimePeriod, SalesItem } from '@/types/sales';
import TimeFilter from './TimeFilter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isAfter, isBefore, isValid, parse } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  salesData: SalesItem[];
  onFilterChange: (filters: Record<string, any>) => void;
  filters: Record<string, any>;
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
  isLoading,
  salesData,
  onFilterChange,
  filters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Date | undefined, Date | undefined]>([undefined, undefined]);
  
  const activePeriod = periods.find(p => p.active);
  
  // Extract unique options for filter dropdowns
  const uniqueLocations = useMemo(() => {
    const locations = new Set(salesData.map(item => item["Calculated Location"]).filter(Boolean));
    return Array.from(locations).sort();
  }, [salesData]);

  const uniqueProducts = useMemo(() => {
    const products = new Set(salesData.map(item => item["Cleaned Product"]).filter(Boolean));
    return Array.from(products).sort();
  }, [salesData]);
  
  const uniqueCategories = useMemo(() => {
    const categories = new Set(salesData.map(item => item["Cleaned Category"]).filter(Boolean));
    return Array.from(categories).sort();
  }, [salesData]);
  
  const uniqueSellers = useMemo(() => {
    const sellers = new Set(salesData.map(item => item["Sold By"]).filter(Boolean));
    return Array.from(sellers).sort();
  }, [salesData]);
  
  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(salesData.map(item => item["Payment Method"]).filter(Boolean));
    return Array.from(methods).sort();
  }, [salesData]);

  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
    if (onPriceRangeChange) {
      onPriceRangeChange(values[0], values[1]);
    }
  };

  const clearSearch = () => {
    onSearchChange('');
  };

  const handleFilterChange = (field: string, value: any) => {
    const updatedFilters = { ...filters, [field]: value };
    onFilterChange(updatedFilters);
  };

  const handleDateRangeSelect = (field: string, dates: [Date | undefined, Date | undefined]) => {
    setDateRange(dates);
    if (dates[0] && dates[1]) {
      handleFilterChange('dateRange', {
        start: dates[0],
        end: dates[1]
      });
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filters.locations?.length) count++;
    if (filters.products?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.sellers?.length) count++;
    if (filters.paymentMethods?.length) count++;
    if (filters.dateRange) count++;
    if (priceRange[0] !== minPrice || priceRange[1] !== maxPrice) count++;
    return count;
  };

  const filterCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium text-gray-800">Filters & Search</h3>
              
              {filterCount > 0 && (
                <Badge variant="default" className="bg-primary text-white">
                  {filterCount} active
                </Badge>
              )}
              
              <div className="flex flex-wrap gap-2 ml-2">
                {activePeriod && (
                  <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                    {activePeriod.label}
                  </Badge>
                )}
                
                {searchQuery && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-700 flex items-center gap-1">
                    <span className="max-w-[100px] truncate">{searchQuery}</span>
                    <X className="h-3 w-3 cursor-pointer" onClick={(e) => {
                      e.stopPropagation();
                      clearSearch();
                    }} />
                  </Badge>
                )}

                {filters.locations?.length > 0 && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{filters.locations.length} locations</span>
                  </Badge>
                )}

                {filters.products?.length > 0 && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{filters.products.length} products</span>
                  </Badge>
                )}

                {filters.categories?.length > 0 && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{filters.categories.length} categories</span>
                  </Badge>
                )}

                {filters.sellers?.length > 0 && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{filters.sellers.length} sellers</span>
                  </Badge>
                )}

                {filters.paymentMethods?.length > 0 && (
                  <Badge variant="outline" className="bg-teal-100 text-teal-700 flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    <span>{filters.paymentMethods.length} payment methods</span>
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {filterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterChange({});
                    onSearchChange('');
                    setPriceRange([minPrice, maxPrice]);
                    setDateRange([undefined, undefined]);
                  }}
                >
                  Clear All
                </Button>
              )}
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
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
                        {dateRange[0] && dateRange[1] ? 
                          `${format(dateRange[0], 'PP')} - ${format(dateRange[1], 'PP')}` : 
                          'Custom date range...'
                        }
                        <CalendarRange className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="flex p-2">
                        <div className="space-y-2 pr-2 border-r">
                          <div className="text-xs font-medium text-center">Start Date</div>
                          <CalendarComponent
                            mode="single"
                            selected={dateRange[0]}
                            onSelect={(date) => handleDateRangeSelect('dateRange', [date, dateRange[1]])}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </div>
                        <div className="space-y-2 pl-2">
                          <div className="text-xs font-medium text-center">End Date</div>
                          <CalendarComponent
                            mode="single"
                            selected={dateRange[1]}
                            onSelect={(date) => handleDateRangeSelect('dateRange', [dateRange[0], date])}
                            disabled={(date) => dateRange[0] ? isBefore(date, dateRange[0]) : false}
                            initialFocus={false}
                            className="p-3 pointer-events-auto"
                          />
                        </div>
                      </div>
                      <div className="border-t p-3 flex justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDateRangeSelect('dateRange', [undefined, undefined])}
                        >
                          Clear
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            if (dateRange[0] && dateRange[1]) {
                              handleFilterChange('dateRange', { start: dateRange[0], end: dateRange[1] });
                            }
                          }}
                          disabled={!dateRange[0] || !dateRange[1]}
                        >
                          Apply
                        </Button>
                      </div>
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
            
            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              {/* Location Filter */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Location
                </h4>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-gray-500">
                      {filters.locations?.length ? `${filters.locations.length} selected` : 'Select locations...'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle>Select Locations</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-2 max-h-[70vh] overflow-y-auto">
                      <Input 
                        placeholder="Search locations..." 
                        className="mb-4" 
                        onChange={(e) => {
                          // Implementation for location search filtering would go here
                        }} 
                      />
                      {uniqueLocations.map((location) => (
                        <div key={location} className="flex items-center space-x-2 py-2 border-b border-gray-100">
                          <Checkbox 
                            id={`location-${location}`} 
                            checked={(filters.locations || []).includes(location)}
                            onCheckedChange={(checked) => {
                              const locationFilters = [...(filters.locations || [])];
                              if (checked) {
                                locationFilters.push(location);
                              } else {
                                const index = locationFilters.indexOf(location);
                                if (index > -1) {
                                  locationFilters.splice(index, 1);
                                }
                              }
                              handleFilterChange('locations', locationFilters);
                            }}
                          />
                          <label htmlFor={`location-${location}`} className="text-sm cursor-pointer flex-1">
                            {location}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => handleFilterChange('locations', [])}
                      >
                        Clear All
                      </Button>
                      <Button 
                        onClick={() => {
                          // Logic to handle applying the location filter changes
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Product Filter */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Product
                </h4>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-gray-500">
                      {filters.products?.length ? `${filters.products.length} selected` : 'Select products...'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle>Select Products</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-2 max-h-[70vh] overflow-y-auto">
                      <Input 
                        placeholder="Search products..." 
                        className="mb-4" 
                        onChange={(e) => {
                          // Implementation for product search filtering would go here
                        }} 
                      />
                      {uniqueProducts.map((product) => (
                        <div key={product} className="flex items-center space-x-2 py-2 border-b border-gray-100">
                          <Checkbox 
                            id={`product-${product}`} 
                            checked={(filters.products || []).includes(product)}
                            onCheckedChange={(checked) => {
                              const productFilters = [...(filters.products || [])];
                              if (checked) {
                                productFilters.push(product);
                              } else {
                                const index = productFilters.indexOf(product);
                                if (index > -1) {
                                  productFilters.splice(index, 1);
                                }
                              }
                              handleFilterChange('products', productFilters);
                            }}
                          />
                          <label htmlFor={`product-${product}`} className="text-sm cursor-pointer flex-1">
                            {product}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => handleFilterChange('products', [])}
                      >
                        Clear All
                      </Button>
                      <Button 
                        onClick={() => {
                          // Logic to handle applying the product filter changes
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Category
                </h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-gray-500">
                      {filters.categories?.length ? `${filters.categories.length} selected` : 'Select categories...'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                    {uniqueCategories.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={(filters.categories || []).includes(category)}
                        onCheckedChange={(checked) => {
                          const categoryFilters = [...(filters.categories || [])];
                          if (checked) {
                            categoryFilters.push(category);
                          } else {
                            const index = categoryFilters.indexOf(category);
                            if (index > -1) {
                              categoryFilters.splice(index, 1);
                            }
                          }
                          handleFilterChange('categories', categoryFilters);
                        }}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sold By Filter */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" /> Sold By
                </h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-gray-500">
                      {filters.sellers?.length ? `${filters.sellers.length} selected` : 'Select sellers...'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                    {uniqueSellers.map((seller) => (
                      <DropdownMenuCheckboxItem
                        key={seller}
                        checked={(filters.sellers || []).includes(seller)}
                        onCheckedChange={(checked) => {
                          const sellerFilters = [...(filters.sellers || [])];
                          if (checked) {
                            sellerFilters.push(seller);
                          } else {
                            const index = sellerFilters.indexOf(seller);
                            if (index > -1) {
                              sellerFilters.splice(index, 1);
                            }
                          }
                          handleFilterChange('sellers', sellerFilters);
                        }}
                      >
                        {seller}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Payment Method Filter - Added in a new row */}
            <div className="mt-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Method
                </h4>
                <div className="flex flex-wrap gap-2">
                  {uniquePaymentMethods.map((method) => (
                    <Badge 
                      key={method} 
                      variant={(filters.paymentMethods || []).includes(method) ? "default" : "outline"}
                      className={`cursor-pointer ${(filters.paymentMethods || []).includes(method) ? 'bg-primary' : 'hover:bg-primary/10'}`}
                      onClick={() => {
                        const methodFilters = [...(filters.paymentMethods || [])];
                        if (methodFilters.includes(method)) {
                          const index = methodFilters.indexOf(method);
                          methodFilters.splice(index, 1);
                        } else {
                          methodFilters.push(method);
                        }
                        handleFilterChange('paymentMethods', methodFilters);
                      }}
                    >
                      {method}
                    </Badge>
                  ))}
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
