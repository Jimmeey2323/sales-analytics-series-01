import React, { useState, useMemo } from 'react';
import { SalesItem } from '../types/sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  Search,
  List,
  LayoutGrid,
  BarChart3,
  ListTree,
  SlidersHorizontal,
  Eye,
  User,
  ShoppingCart,
  Calendar,
  MapPin,
  CreditCard,
  Tag,
  Info
} from 'lucide-react';
import { formatCurrency, parseDate } from '@/utils/salesUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface SalesTableProps {
  data: SalesItem[];
  isLoading: boolean;
}

type ViewMode = 'default' | 'compact' | 'detailed' | 'grid' | 'grouped';

const SalesTable: React.FC<SalesTableProps> = ({ data, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SalesItem;
    direction: 'asc' | 'desc';
  }>({
    key: 'Payment Date',
    direction: 'desc'
  });
  const [detailedItem, setDetailedItem] = useState<SalesItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [groupBy, setGroupBy] = useState<keyof SalesItem | ''>('');
  const [visibleColumns, setVisibleColumns] = useState<Array<keyof SalesItem>>([
    'Payment Date', 
    'Customer Name', 
    'Payment Item', 
    'Cleaned Product',
    'Payment Method', 
    'Payment Value', 
    'Payment Status'
  ]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        item["Customer Name"]?.toLowerCase().includes(searchTermLower) ||
        item["Customer Email"]?.toLowerCase().includes(searchTermLower) ||
        item["Payment Item"]?.toLowerCase().includes(searchTermLower) ||
        item["Calculated Location"]?.toLowerCase().includes(searchTermLower) ||
        item["Cleaned Product"]?.toLowerCase().includes(searchTermLower) ||
        item["Payment Transaction ID"]?.toLowerCase().includes(searchTermLower)
      );
    });
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const keyA = a[sortConfig.key];
      const keyB = b[sortConfig.key];
      
      // Handle specific column types
      if (sortConfig.key === 'Payment Value') {
        return sortConfig.direction === 'asc' 
          ? parseFloat(keyA || '0') - parseFloat(keyB || '0')
          : parseFloat(keyB || '0') - parseFloat(keyA || '0');
      }
      
      if (sortConfig.key === 'Payment Date') {
        const dateA = parseDate(keyA) || new Date(0);
        const dateB = parseDate(keyB) || new Date(0);
        return sortConfig.direction === 'asc' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      
      // Default string comparison
      if (sortConfig.direction === 'asc') {
        return (keyA || '').toString().localeCompare((keyB || '').toString());
      }
      return (keyB || '').toString().localeCompare((keyA || '').toString());
    });
  }, [filteredData, sortConfig]);

  // Group data by a field
  const groupedData = useMemo(() => {
    if (!groupBy) return null;
    
    const result: Record<string, SalesItem[]> = {};
    
    sortedData.forEach(item => {
      const groupValue = item[groupBy] as string || 'Unknown';
      if (!result[groupValue]) {
        result[groupValue] = [];
      }
      result[groupValue].push(item);
    });
    
    return result;
  }, [sortedData, groupBy]);

  // Create summary data for each group
  const groupSummary = useMemo(() => {
    if (!groupedData) return null;
    
    const result: Record<string, { count: number; total: number }> = {};
    
    Object.entries(groupedData).forEach(([group, items]) => {
      const total = items.reduce((sum, item) => sum + parseFloat(item["Payment Value"] || '0'), 0);
      result[group] = {
        count: items.length,
        total
      };
    });
    
    return result;
  }, [groupedData]);

  // Calculate total for all visible data
  const totals = useMemo(() => {
    const total = sortedData.reduce((sum, item) => sum + parseFloat(item["Payment Value"] || '0'), 0);
    return {
      count: sortedData.length,
      total
    };
  }, [sortedData]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (viewMode === 'grouped' && groupedData) return groupedData;
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize, viewMode, groupedData]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: keyof SalesItem) => {
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const formatDate = (dateString: string) => {
    const date = parseDate(dateString);
    if (!date) return dateString;
    
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderSortIcon = (key: keyof SalesItem) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const toggleColumnVisibility = (column: keyof SalesItem) => {
    if (visibleColumns.includes(column)) {
      // Only remove if we would still have at least one visible column
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter(c => c !== column));
      }
    } else {
      setVisibleColumns([...visibleColumns, column]);
    }
  };

  const handleRowClick = (item: SalesItem) => {
    setDetailedItem(item);
  };

  const renderTableHeader = () => {
    const availableColumns: Record<string, { label: string; icon: React.ReactNode }> = {
      "Payment Date": { label: "Date", icon: <Calendar size={14} /> },
      "Customer Name": { label: "Customer", icon: <User size={14} /> },
      "Payment Item": { label: "Item", icon: <Info size={14} /> },
      "Cleaned Product": { label: "Product", icon: <ShoppingCart size={14} /> },
      "Cleaned Category": { label: "Category", icon: <Tag size={14} /> },
      "Calculated Location": { label: "Location", icon: <MapPin size={14} /> },
      "Payment Method": { label: "Method", icon: <CreditCard size={14} /> },
      "Payment Value": { label: "Amount", icon: <BarChart3 size={14} /> },
      "Payment Status": { label: "Status", icon: <Info size={14} /> },
      "Sold By": { label: "Sold By", icon: <User size={14} /> },
    };

    return (
      <TableHeader className="bg-gray-50">
        <TableRow>
          {Object.entries(availableColumns).map(([key, value]) => (
            visibleColumns.includes(key as keyof SalesItem) && (
              <TableHead 
                key={key}
                className={`cursor-pointer whitespace-nowrap ${
                  key === 'Payment Value' ? 'text-right' : key === 'Payment Status' ? 'text-right' : ''
                }`}
                onClick={() => handleSort(key as keyof SalesItem)}
              >
                <div className="flex items-center space-x-1">
                  {value.icon}
                  <span>{value.label}</span>
                  {renderSortIcon(key as keyof SalesItem)}
                </div>
              </TableHead>
            )
          ))}
        </TableRow>
      </TableHeader>
    );
  };

  const renderGroupedView = () => {
    if (!groupedData || !groupSummary) return null;
    
    return (
      <div className="space-y-6">
        {Object.entries(groupedData).sort().map(([group, items]) => (
          <Card key={group} className="overflow-hidden border-l-4 border-primary/70 shadow-md">
            <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{group}</span>
                <span className="text-sm text-gray-500">{items.length} items</span>
              </div>
              <div className="font-medium text-primary">
                {formatCurrency(groupSummary[group].total)}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                {renderTableHeader()}
                <TableBody>
                  {items.map((item, index) => renderTableRow(item, index))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Array.isArray(paginatedData) ? paginatedData : []).map((item, index) => (
          <Card 
            key={`${item["Payment Transaction ID"]}-${index}`}
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleRowClick(item)}
          >
            <div className="p-3 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <span className="font-medium">{formatDate(item["Payment Date"])}</span>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  item["Payment Status"] === "succeeded"
                    ? "bg-green-100 text-green-800"
                    : item["Payment Status"] === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {item["Payment Status"]}
                </span>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium">{item["Customer Name"]}</h3>
              <p className="text-xs text-gray-500 mt-1">{item["Customer Email"]}</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{item["Payment Item"]}</span>
                  <span className="font-bold">{formatCurrency(parseFloat(item["Payment Value"]) || 0)}</span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>{item["Cleaned Product"]}</span>
                  <span>{item["Payment Method"]}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <MapPin size={12} className="inline mr-1" />
                  {item["Calculated Location"]}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderTableRow = (item: SalesItem, index: number) => (
    <TableRow 
      key={`${item["Payment Transaction ID"]}-${index}`}
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => handleRowClick(item)}
    >
      {visibleColumns.includes("Payment Date") && (
        <TableCell className="whitespace-nowrap">{formatDate(item["Payment Date"])}</TableCell>
      )}
      {visibleColumns.includes("Customer Name") && (
        <TableCell>
          <div className="font-medium">{item["Customer Name"]}</div>
          <div className="text-xs text-gray-500">{item["Customer Email"]}</div>
        </TableCell>
      )}
      {visibleColumns.includes("Payment Item") && (
        <TableCell>{item["Payment Item"]}</TableCell>
      )}
      {visibleColumns.includes("Cleaned Product") && (
        <TableCell>{item["Cleaned Product"]}</TableCell>
      )}
      {visibleColumns.includes("Payment Method") && (
        <TableCell>{item["Payment Method"]}</TableCell>
      )}
      {visibleColumns.includes("Payment Value") && (
        <TableCell className="text-right font-medium">
          {formatCurrency(parseFloat(item["Payment Value"]) || 0)}
        </TableCell>
      )}
      {visibleColumns.includes("Payment Status") && (
        <TableCell className="text-right">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            item["Payment Status"] === "succeeded"
              ? "bg-green-100 text-green-800"
              : item["Payment Status"] === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}>
            {item["Payment Status"]}
          </span>
        </TableCell>
      )}
    </TableRow>
  );

  const handleGroupChange = (value: string) => {
    // Fix the type issue by ensuring the value is treated as a string or empty string
    setGroupBy(value as keyof SalesItem | '');
    if (value) {
      setViewMode('grouped');
    }
  };

  return (
    <div className="w-full rounded-xl overflow-hidden">
      <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full md:w-64"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <SlidersHorizontal size={14} className="mr-1" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes("Payment Date")}
                onCheckedChange={() => toggleColumnVisibility("Payment Date")}
              >
                Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes("Customer Name")}
                onCheckedChange={() => toggleColumnVisibility("Customer Name")}
              >
                Customer
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes("Payment Item")}
                onCheckedChange={() => toggleColumnVisibility("Payment Item")}
              >
                Item
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes("Cleaned Product")}
                onCheckedChange={() => toggleColumnVisibility("Cleaned Product")}
              >
                Product
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes("Payment Method")}
                onCheckedChange={() => toggleColumnVisibility("Payment Method")}
              >
                Method
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes("Payment Value")}
                onCheckedChange={() => toggleColumnVisibility("Payment Value")}
              >
                Amount
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes("Payment Status")}
                onCheckedChange={() => toggleColumnVisibility("Payment Status")}
              >
                Status
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Group By Dropdown */}
          <Select 
            value={groupBy} 
            onValueChange={handleGroupChange}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Group by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="Cleaned Category">Category</SelectItem>
              <SelectItem value="Cleaned Product">Product</SelectItem>
              <SelectItem value="Calculated Location">Location</SelectItem>
              <SelectItem value="Payment Method">Payment Method</SelectItem>
              <SelectItem value="Sold By">Sold By</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Selector */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button 
              variant={viewMode === 'default' ? 'default' : 'ghost'} 
              size="sm"
              className="h-9 px-2 rounded-none"
              onClick={() => { setViewMode('default'); setGroupBy(''); }}
            >
              <List size={16} />
            </Button>
            <Button 
              variant={viewMode === 'compact' ? 'default' : 'ghost'} 
              size="sm"
              className="h-9 px-2 rounded-none"
              onClick={() => { setViewMode('compact'); setGroupBy(''); }}
            >
              <ListTree size={16} />
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              className="h-9 px-2 rounded-none"
              onClick={() => { setViewMode('grid'); setGroupBy(''); }}
            >
              <LayoutGrid size={16} />
            </Button>
          </div>

          <Select
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 rows</SelectItem>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="20">20 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Display the total row at the top when appropriate */}
      {(viewMode === 'default' || viewMode === 'compact') && (
        <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
          <div className="text-sm text-gray-700 font-medium">
            Total: {totals.count} transactions
          </div>
          <div className="text-sm text-gray-700 font-medium">
            {formatCurrency(totals.total)}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {viewMode === 'grid' ? (
          renderGridView()
        ) : viewMode === 'grouped' ? (
          renderGroupedView()
        ) : (
          <Table>
            {renderTableHeader()}
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array(pageSize).fill(0).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {Array(visibleColumns.length).fill(0).map((_, cellIndex) => (
                      <TableCell key={`skeleton-cell-${index}-${cellIndex}`}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : Array.isArray(paginatedData) && paginatedData.length > 0 ? (
                paginatedData.map((item, index) => renderTableRow(item, index))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-gray-500">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      
      <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {Array.isArray(paginatedData) && paginatedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} transactions
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || viewMode === 'grouped'}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || viewMode === 'grouped'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {viewMode !== 'grouped' && (
            <span className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
          )}
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || viewMode === 'grouped'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || viewMode === 'grouped'}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail View Dialog */}
      <Dialog open={!!detailedItem} onOpenChange={(open) => !open && setDetailedItem(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          
          {detailedItem && (
            <div className="space-y-6">
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="customer">Customer</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="product">Product</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Transaction ID</h3>
                        <p className="text-base">{detailedItem["Payment Transaction ID"]}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Date & Time</h3>
                        <p className="text-base">{formatDate(detailedItem["Payment Date"])}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          detailedItem["Payment Status"] === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : detailedItem["Payment Status"] === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {detailedItem["Payment Status"]}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Item</h3>
                        <p className="text-base">{detailedItem["Payment Item"]}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Sold By</h3>
                        <p className="text-base">{detailedItem["Sold By"]}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                        <p className="text-base">{detailedItem["Calculated Location"]}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="customer" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Customer Name</h3>
                        <p className="text-base">{detailedItem["Customer Name"]}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Customer Email</h3>
                        <p className="text-base">{detailedItem["Customer Email"]}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Member ID</h3>
                        <p className="text-base">{detailedItem["Member ID"]}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Paying Member ID</h3>
                        <p className="text-base">{detailedItem["Paying Member ID"]}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="payment" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                        <p className="text-2xl font-bold">{formatCurrency(parseFloat(detailedItem["Payment Value"]) || 0)}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                        <p className="text-base">{detailedItem["Payment Method"]}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Payment VAT</h3>
                        <p className="text-base">{detailedItem["Payment VAT"]}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Paid In Money Credits</h3>
                        <p className="text-base">{detailedItem["Paid In Money Credits"] || "0"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="product" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Product</h3>
                        <p className="text-base">{detailedItem["Cleaned Product"]}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
                        <p className="text-base">{detailedItem["Cleaned Category"]}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Sale Item ID</h3>
                        <p className="text-base">{detailedItem["Sale Item ID"]}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Category</h3>
                        <p className="text-base">{detailedItem["Payment Category"]}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="border-t pt-4 flex justify-end">
                <Button variant="outline" onClick={() => setDetailedItem(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesTable;
