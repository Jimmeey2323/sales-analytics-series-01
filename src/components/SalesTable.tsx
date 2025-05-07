
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
  Search
} from 'lucide-react';
import { formatCurrency, parseDate } from '@/utils/salesUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesTableProps {
  data: SalesItem[];
  isLoading: boolean;
}

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
        return (keyA || '').localeCompare(keyB || '');
      }
      return (keyB || '').localeCompare(keyA || '');
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

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

        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-1.5 border rounded text-sm"
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort("Payment Date")}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {renderSortIcon("Payment Date")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("Customer Name")}
              >
                <div className="flex items-center space-x-1">
                  <span>Customer</span>
                  {renderSortIcon("Customer Name")}
                </div>
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("Cleaned Product")}
              >
                <div className="flex items-center space-x-1">
                  <span>Product</span>
                  {renderSortIcon("Cleaned Product")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("Payment Method")}
              >
                <div className="flex items-center space-x-1">
                  <span>Method</span>
                  {renderSortIcon("Payment Method")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right"
                onClick={() => handleSort("Payment Value")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Amount</span>
                  {renderSortIcon("Payment Value")}
                </div>
              </TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array(pageSize).fill(0).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array(7).fill(0).map((_, cellIndex) => (
                    <TableCell key={`skeleton-cell-${index}-${cellIndex}`}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow key={`${item["Payment Transaction ID"]}-${index}`}>
                  <TableCell className="whitespace-nowrap">{formatDate(item["Payment Date"])}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item["Customer Name"]}</div>
                    <div className="text-xs text-gray-500">{item["Customer Email"]}</div>
                  </TableCell>
                  <TableCell>{item["Payment Item"]}</TableCell>
                  <TableCell>{item["Cleaned Product"]}</TableCell>
                  <TableCell>{item["Payment Method"]}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(parseFloat(item["Payment Value"]) || 0)}
                  </TableCell>
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {paginatedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} transactions
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SalesTable;
