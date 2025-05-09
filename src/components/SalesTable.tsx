import React, { useState, useMemo, useEffect } from 'react';
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
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Loader
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
  refreshData?: () => Promise<void>;
}

type ViewMode = 'default' | 'compact' | 'detailed' | 'grid' | 'grouped';

const SalesTable: React.FC<SalesTableProps> = ({ data, isLoading, refreshData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SalesItem | string;
    direction: 'asc' | 'desc';
  }>({
    key: 'Payment Date',
    direction: 'desc'
  });
  const [detailedItem, setDetailedItem] = useState<SalesItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [groupBy, setGroupBy] = useState<keyof SalesItem | ''>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [visibleColumns, setVisibleColumns] = useState<Array<keyof SalesItem | string>>([
    'Payment Date', 
    'Customer Name', 
    'Payment Item', 
    'Cleaned Product',
    'Cleaned Category',
    'Payment Method', 
    'Payment Value', 
    'Payment Status'
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const searchTermLower = searchTerm.toLowerCase();
    return data.filter(item => {
      return Object.entries(item).some(([key, value]) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchTermLower);
      });
    });
  }, [data, searchTerm]);

  // Sort data with proper date handling
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const keyA = a[sortConfig.key as keyof SalesItem];
      const keyB = b[sortConfig.key as keyof SalesItem];
      
      // Handle specific column types
      if (sortConfig.key === 'Payment Value') {
        return sortConfig.direction === 'asc' 
          ? parseFloat(keyA || '0') - parseFloat(keyB || '0')
          : parseFloat(keyB || '0') - parseFloat(keyA || '0');
      }
      
      // Handle date columns - Payment Date or any column with monthYear
      if (sortConfig.key === 'Payment Date' || sortConfig.key.toString().includes('monthYear') || sortConfig.key.toString().includes('date')) {
        const dateA = keyA ? parseDate(keyA.toString()) || new Date(0) : new Date(0);
        const dateB = keyB ? parseDate(keyB.toString()) || new Date(0) : new Date(0);
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

  const handleSort = (key: keyof SalesItem | string) => {
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

  const renderSortIcon = (key: keyof SalesItem | string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const toggleColumnVisibility = (column: keyof SalesItem | string) => {
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

  const handleRowExpand = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleGroupExpand = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleRefresh = async () => {
    if (refreshData) {
      setIsRefreshing(true);
      await refreshData();
      setIsRefreshing(false);
    }
  };

  const exportToCsv = () => {
    // Create CSV content
    const headers = visibleColumns.map(col => `"${col}"`).join(',');
    const rows = sortedData.map(item => {
      return visibleColumns.map(col => `"${item[col as keyof SalesItem] || ''}"`).join(',');
    }).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sales_data.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          {viewMode === 'default' && (
            <TableHead className="w-8">
              <span className="sr-only">Expand</span>
            </TableHead>
          )}
          {visibleColumns.map((key) => (
            <TableHead 
              key={key.toString()}
              className={`cursor-pointer whitespace-nowrap ${
                key === 'Payment Value' ? 'text-right' : key === 'Payment Status' ? 'text-right' : ''
              }`}
              onClick={() => handleSort(key)}
            >
              <div className="flex items-center space-x-1">
                {availableColumns[key.toString()]?.icon || null}
                <span>{availableColumns[key.toString()]?.label || key}</span>
                {renderSortIcon(key)}
              </div>
            </TableHead>
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
            <div 
              className="p-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
              onClick={() => toggleGroupExpand(group)}
            >
              <div className="flex items-center gap-2">
                {expandedGroups[group] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="font-medium text-gray-800">{group}</span>
                <span className="text-sm text-gray-500">{items.length} items</span>
              </div>
              <div className="font-medium text-primary">
                {formatCurrency(groupSummary[group].total)}
              </div>
            </div>
            {expandedGroups[group] && (
              <div className="overflow-x-auto">
                <Table>
                  {renderTableHeader()}
                  <TableBody>
                    {items.map((item, index) => renderTableRow(item, index))}
                    {/* Group Totals Row */}
                    <TableRow className="bg-gray-50 font-medium">
                      <TableCell colSpan={viewMode === 'default' ? 1 : 0}></TableCell>
                      {visibleColumns.map((col, idx) => (
                        <TableCell 
                          key={`total-${col}-${idx}`}
                          className={col === 'Payment Value' ? 'text-right' : ''}
                        >
                          {col === 'Payment Value' 
                            ? formatCurrency(groupSummary[group].total)
                            : col === 'Customer Name' 
                              ? `Total (${items.length} items)`
                              : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
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

  const getRowId = (item: SalesItem, index: number) => {
    return `${item["Payment Transaction ID"] || ""}-${index}`;
  };

  const renderChildRows = (item: SalesItem, index: number) => {
    const rowId = getRowId(item, index);
    
    // Create a detailed view of all data in the item
    return (
      <TableRow 
        key={`child-${rowId}`} 
        className={`bg-gray-50 ${expandedRows[rowId] ? 'border-b' : ''}`}
      >
        <TableCell colSpan={visibleColumns.length + 1} className="p-0">
          <div className={`drill-down-row ${expandedRows[rowId] ? 'expanded' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {Object.entries(item).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs text-gray-500">{key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderTableRow = (item: SalesItem, index: number) => {
    const rowId = getRowId(item, index);
    
    return (
      <React.Fragment key={rowId}>
        <TableRow 
          className="cursor-pointer hover:bg-gray-50"
        >
          {viewMode === 'default' && (
            <TableCell className="p-0 w-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowExpand(rowId);
                }}
                className="h-8 w-8"
              >
                {expandedRows[rowId] ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </Button>
            </TableCell>
          )}
          
          {visibleColumns.map((col) => (
            <TableCell 
              key={`${rowId}-${col}`} 
              className={`whitespace-nowrap ${
                col === 'Payment Value' ? 'text-right font-medium' : 
                col === 'Payment Status' ? 'text-right' : ''
              }`}
              onClick={() => handleRowClick(item)}
            >
              {col === 'Payment Date' ? (
                formatDate(item[col as keyof SalesItem] as string)
              ) : col === 'Payment Value' ? (
                formatCurrency(parseFloat(item[col as keyof SalesItem] as string || '0'))
              ) : col === 'Customer Name' ? (
                <div>
                  <div className="font-medium">{item[col as keyof SalesItem]}</div>
                  <div className="text-xs text-gray-500">{item["Customer Email"]}</div>
                </div>
              ) : col === 'Payment Status' ? (
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  item[col as keyof SalesItem] === "succeeded"
                    ? "bg-green-100 text-green-800"
                    : item[col as keyof SalesItem] === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {item[col as keyof SalesItem]}
                </span>
              ) : (
                item[col as keyof SalesItem]
              )}
            </TableCell>
          ))}
        </TableRow>
        
        {/* Child rows for drill-down */}
        {viewMode === 'default' && renderChildRows(item, index)}
      </React.Fragment>
    );
  };

  return (
    <div className="w-full rounded-xl overflow-hidden bg-white border border-gray-200 shadow-md">
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
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing || !refreshData}
          >
            {isRefreshing ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span>Refresh</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={exportToCsv}
          >
            <Download size={14} />
            <span>Export</span>
          </Button>
        
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <SlidersHorizontal size={14} className="mr-1" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys({
                "Payment Date": "Date",
                "Customer Name": "Customer",
                "Payment Item": "Item",
                "Cleaned Product": "Product",
                "Cleaned Category": "Category",
                "Calculated Location": "Location",
                "Payment Method": "Method",
                "Payment Value": "Amount",
                "Payment Status": "Status",
                "Sold By": "Sold By"
              }).map(col => (
                <DropdownMenuCheckboxItem
                  key={col}
                  checked={visibleColumns.includes(col)}
                  onCheckedChange={() => toggleColumnVisibility(col)}
                >
                  {col}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Group By Dropdown */}
          <Select 
            value={groupBy as string} 
            onValueChange={(value) => {
              setGroupBy(value === '' ? '' : value as keyof SalesItem);
              if (value) {
                setViewMode('grouped');
              }
            }}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Group by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No grouping</SelectItem>
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
              <SelectItem value="100">100 rows</SelectItem>
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

      <div className={viewMode === 'grid' ? 'p-4' : 'overflow-x-auto'}>
        {viewMode === 'grid' ? (
          renderGridView()
        ) : viewMode === 'grouped' ? (
          renderGroupedView()
        ) : (
          <Table className="table-fancy">
            {renderTableHeader()}
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array(pageSize).fill(0).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {viewMode === 'default' && (
                      <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                    )}
                    {Array(visibleColumns.length).fill(0).map((_, cellIndex) => (
                      <TableCell key={`skeleton-cell-${index}-${cellIndex}`}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : Array.isArray(paginatedData) && paginatedData.length > 0 ? (
                <>
                  {paginatedData.map((item, index) => renderTableRow(item, index))}
                  
                  {/* Totals row at the bottom */}
                  <TableRow className="totals-row">
                    {viewMode === 'default' && <TableCell></TableCell>}
                    {visibleColumns.map((col, idx) => (
                      <TableCell 
                        key={`bottom-total-${col}-${idx}`}
                        className={col === 'Payment Value' ? 'text-right' : ''}
                      >
                        {col === 'Payment Value' 
                          ? formatCurrency(totals.total)
                          : col === 'Customer Name' 
                            ? `Grand Total (${totals.count} transactions)`
                            : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + (viewMode === 'default' ? 1 : 0)} className="text-center py-8 text-gray-500">
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
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full mb-4 justify-start bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:text-primary">Details</TabsTrigger>
                  <TabsTrigger value="customer" className="data-[state=active]:bg-white data-[state=active]:text-primary">Customer</TabsTrigger>
                  <TabsTrigger value="payment" className="data-[state=active]:bg-white data-[state=active]:text-primary">Payment</TabsTrigger>
                  <TabsTrigger value="product" className="data-[state=active]:bg-white data-[state=active]:text-primary">Product</TabsTrigger>
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
                
                {/* Other tabs content... */}
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
