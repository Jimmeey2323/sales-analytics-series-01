
import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Search } from 'lucide-react';
import { SalesItem } from '@/types/sales';
import { formatCurrency } from '@/utils/salesUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from 'sonner';

interface ColumnDefinition {
  accessorKey: string;
  header: string;
  enableSorting: boolean;
  enableColumnFilter: boolean;
}

interface FilterDefinition {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface CustomTableBuilderProps {
  salesData: SalesItem[];
}

const CustomTableBuilder: React.FC<CustomTableBuilderProps> = ({ salesData }) => {
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { accessorKey: "Payment Date", header: "Payment Date", enableSorting: true, enableColumnFilter: true },
    { accessorKey: "Customer Name", header: "Customer Name", enableSorting: true, enableColumnFilter: true },
    { accessorKey: "Payment Method", header: "Payment Method", enableSorting: true, enableColumnFilter: true },
    { accessorKey: "Payment Value", header: "Payment Value", enableSorting: true, enableColumnFilter: true },
  ]);
  const [tableFilters, setTableFilters] = useState<FilterDefinition[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map(col => col.accessorKey));
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [isFilterConfigOpen, setIsFilterConfigOpen] = useState(false);

  const columnOptions = useMemo(() => {
    const allKeys = Array.from(new Set(salesData.flatMap(item => Object.keys(item))));
    return allKeys.map(key => ({ value: key, label: key }));
  }, [salesData]);

  const availableColumns = useMemo(() => {
    return columnOptions.filter(option => !columns.find(col => col.accessorKey === option.value));
  }, [columns, columnOptions]);

  const addColumn = (newColumnKey: string) => {
    if (!newColumnKey) return;
    const newColumn = {
      accessorKey: newColumnKey,
      header: newColumnKey,
      enableSorting: true,
      enableColumnFilter: true,
    };
    setColumns([...columns, newColumn]);
    setVisibleColumns([...visibleColumns, newColumnKey]);
  };

  const removeColumn = (columnToRemove: string) => {
    setColumns(columns.filter(col => col.accessorKey !== columnToRemove));
    setVisibleColumns(visibleColumns.filter(col => col !== columnToRemove));
    setTableFilters(tableFilters.filter(filter => filter.column !== columnToRemove));
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey) ? prev.filter(key => key !== columnKey) : [...prev, columnKey]
    );
  };

  const addFilter = () => {
    const newFilter: FilterDefinition = {
      id: Date.now().toString(),
      column: columns[0]?.accessorKey || '',
      operator: 'contains',
      value: '',
    };
    setTableFilters([...tableFilters, newFilter]);
  };

  const updateFilter = (id: string, field: string, value: string) => {
    setTableFilters(filters =>
      filters.map(filter =>
        filter.id === id ? { ...filter, [field]: value } : filter
      )
    );
  };

  const removeFilter = (id: string) => {
    setTableFilters(filters => filters.filter(filter => filter.id !== id));
  };

  const clearAllFilters = () => {
    setTableFilters([]);
  };

  const toggleColumnConfig = () => {
    setIsColumnConfigOpen(!isColumnConfigOpen);
  };

  const toggleFilterConfig = () => {
    setIsFilterConfigOpen(!isFilterConfigOpen);
  };

  const handleSortingChange = (column: string) => {
    setSorting(prev => {
      if (prev && prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { column, direction: 'asc' };
      }
    });
  };

  const sortedData = useMemo(() => {
    if (!sorting) return [...salesData];

    const { column, direction } = sorting;
    return [...salesData].sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];

      if (valueA === undefined || valueA === null) return direction === 'asc' ? -1 : 1;
      if (valueB === undefined || valueB === null) return direction === 'asc' ? 1 : -1;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return direction === 'asc' ? valueA - valueB : valueB - valueA;
      }

      const stringA = String(valueA).toLowerCase();
      const stringB = String(valueB).toLowerCase();

      if (stringA < stringB) return direction === 'asc' ? -1 : 1;
      if (stringA > stringB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [salesData, sorting]);

  const filteredRows = useMemo(() => {
    let filteredRows = [...sortedData];

    // Filter rows based on filters
    filteredRows = filteredRows.filter(row => {
      return tableFilters.every(filter => {
        const columnValue = String(row[filter.column] || '');
        const filterValue = String(filter.value);
        
        switch (filter.operator) {
          case 'contains':
            return columnValue.toLowerCase().includes(filterValue.toLowerCase());
          case 'equals':
            return columnValue.toLowerCase() === filterValue.toLowerCase();
          case 'starts_with':
            return columnValue.toLowerCase().startsWith(filterValue.toLowerCase());
          case 'ends_with':
            return columnValue.toLowerCase().endsWith(filterValue.toLowerCase());
          case 'greater_than':
            return Number(columnValue) > Number(filterValue); // Fixed conversion issue
          case 'less_than':
            return Number(columnValue) < Number(filterValue); // Fixed conversion issue
          default:
            return true;
        }
      });
    });

    return filteredRows;
  }, [sortedData, tableFilters]);

  const paginatedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, pagination]);

  const pageCount = useMemo(() => {
    return Math.ceil(filteredRows.length / pagination.pageSize);
  }, [filteredRows, pagination.pageSize]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, pageIndex: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, pageIndex: 0 }));
  };

  const getColumnHeader = (accessorKey: string) => {
    const column = columns.find(col => col.accessorKey === accessorKey);
    return column ? column.header : accessorKey;
  };

  return (
    <Card className="overflow-hidden shadow-lg">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Custom Table Builder</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleColumnConfig}>
            Configure Columns
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFilterConfig}>
            Configure Filters
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.filter(col => visibleColumns.includes(col.accessorKey)).map(column => (
                <TableHead key={column.accessorKey} className="cursor-pointer" onClick={() => handleSortingChange(column.accessorKey)}>
                  {getColumnHeader(column.accessorKey)}
                  {sorting?.column === column.accessorKey && (
                    <span>{sorting.direction === 'asc' ? ' ▲' : ' ▼'}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow key={index}>
                {columns.filter(col => visibleColumns.includes(col.accessorKey)).map(column => (
                  <TableCell key={column.accessorKey}>
                    {column.accessorKey === 'Payment Value' && typeof row[column.accessorKey] === 'number'
                      ? formatCurrency(row[column.accessorKey] as number)
                      : String(row[column.accessorKey])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="rows-per-page">Rows per page:</Label>
          <Select value={String(pagination.pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
            <SelectTrigger aria-labelledby="rows-per-page">
              <SelectValue placeholder={String(pagination.pageSize)} />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={pagination.pageIndex === 0}
            onClick={() => handlePageChange(0)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M15 18L9 12L15 6" />
              <path d="M21 18L15 12L21 6" />
            </svg>
            <span className="sr-only">Go to first page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={pagination.pageIndex === 0}
            onClick={() => handlePageChange(pagination.pageIndex - 1)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M15 18L9 12L15 6" />
            </svg>
            <span className="sr-only">Go to previous page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={pagination.pageIndex === pageCount - 1}
            onClick={() => handlePageChange(pagination.pageIndex + 1)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 18L15 12L9 6" />
            </svg>
            <span className="sr-only">Go to next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={pagination.pageIndex === pageCount - 1}
            onClick={() => handlePageChange(pageCount - 1)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 18L15 12L9 6" />
              <path d="M3 18L9 12L3 6" />
            </svg>
            <span className="sr-only">Go to last page</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagination.pageIndex + 1} of {pageCount}
          </span>
        </div>
      </div>

      {/* Column Configuration Dialog */}
      <Dialog open={isColumnConfigOpen} onOpenChange={setIsColumnConfigOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configure Columns</DialogTitle>
            <DialogDescription>
              Add, remove, and toggle visibility of columns in the table.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="column">Add Column</Label>
              <Select onValueChange={addColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((column) => (
                    <SelectItem key={column.value} value={column.value}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visible Columns</Label>
              <div className="border rounded-md p-2 space-y-1">
                {columns.map(column => (
                  <div key={column.accessorKey} className="flex items-center justify-between">
                    <Label htmlFor={column.accessorKey} className="mr-2">
                      {column.header}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={column.accessorKey}
                        checked={visibleColumns.includes(column.accessorKey)}
                        onCheckedChange={() => toggleColumnVisibility(column.accessorKey)}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeColumn(column.accessorKey)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={toggleColumnConfig}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Configuration Dialog */}
      <Dialog open={isFilterConfigOpen} onOpenChange={setIsFilterConfigOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configure Filters</DialogTitle>
            <DialogDescription>
              Add, modify, and remove filters to refine your table data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {tableFilters.map((filter, index) => (
              <div key={filter.id} className="flex items-center space-x-4">
                <div className="grid gap-2">
                  <Label htmlFor={`column-${index}`}>Column</Label>
                  <Select
                    value={filter.column}
                    onValueChange={(value) => updateFilter(filter.id, 'column', value)}
                  >
                    <SelectTrigger aria-labelledby={`column-${index}`}>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(column => (
                        <SelectItem key={column.accessorKey} value={column.accessorKey}>
                          {column.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`operator-${index}`}>Operator</Label>
                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
                  >
                    <SelectTrigger aria-labelledby={`operator-${index}`}>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="starts_with">Starts With</SelectItem>
                      <SelectItem value="ends_with">Ends With</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`value-${index}`}>Value</Label>
                  <Input
                    id={`value-${index}`}
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeFilter(filter.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ))}
            <Button variant="secondary" onClick={addFilter} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Filter
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
            <Button type="button" onClick={toggleFilterConfig}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CustomTableBuilder;
