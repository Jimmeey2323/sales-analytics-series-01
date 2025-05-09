import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SalesItem } from '@/types/sales';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Save,
  Plus,
  X,
  Search,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/utils/salesUtils';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import DateGrouping from './DateGrouping';

interface CustomTableBuilderProps {
  salesData: SalesItem[];
}

type AggregationType = 'count' | 'unique' | 'sum' | 'average' | 'max' | 'min';
type SortDirection = 'asc' | 'desc' | 'none';

interface ColumnConfig {
  field: keyof SalesItem | '';
  label: string;
  aggregation: AggregationType;
  width: number;
  sortDirection: SortDirection;
  visible: boolean;
}

interface SavedTable {
  id: string;
  name: string;
  columns: ColumnConfig[];
  filters: Record<string, any>;
  showTotals: boolean;
  showSubtotals: boolean;
  groupBy: keyof SalesItem | '';
}

const CustomTableBuilder: React.FC<CustomTableBuilderProps> = ({ salesData }) => {
  const [activeTab, setActiveTab] = useState<string>('builder');
  const [tableName, setTableName] = useState<string>('New Custom Table');
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { field: 'Cleaned Category', label: 'Category', aggregation: 'count', width: 150, sortDirection: 'none', visible: true },
    { field: 'Payment Value', label: 'Revenue', aggregation: 'sum', width: 120, sortDirection: 'desc', visible: true },
    { field: 'Customer Name', label: 'Customer', aggregation: 'unique', width: 180, sortDirection: 'none', visible: true },
  ]);
  const [availableFields, setAvailableFields] = useState<(keyof SalesItem)[]>([]);
  const [savedTables, setSavedTables] = useState<SavedTable[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showTotals, setShowTotals] = useState<boolean>(true);
  const [showSubtotals, setShowSubtotals] = useState<boolean>(true);
  const [groupBy, setGroupBy] = useState<keyof SalesItem | ''>('');
  
  const [dateGroupedData, setDateGroupedData] = useState<Record<string, SalesItem[]>>({});
  const [dateField, setDateField] = useState<keyof SalesItem | ''>('');
  const [showDateGrouping, setShowDateGrouping] = useState(false);

  // Get all available fields from the first item
  React.useEffect(() => {
    if (salesData.length > 0) {
      const fields = Object.keys(salesData[0]) as (keyof SalesItem)[];
      setAvailableFields(fields);
    }
  }, [salesData]);

  const addColumn = () => {
    const newColumn: ColumnConfig = {
      field: '',
      label: 'New Column',
      aggregation: 'count',
      width: 120,
      sortDirection: 'none',
      visible: true
    };
    setColumns([...columns, newColumn]);
  };

  const removeColumn = (index: number) => {
    const newColumns = columns.filter((_, idx) => idx !== index);
    setColumns(newColumns);
  };

  const updateColumn = (index: number, field: keyof ColumnConfig, value: any) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    
    // If field is updated, set the label to match the field name
    if (field === 'field') {
      newColumns[index].label = value ? (value as string) : 'New Column';
    }
    
    setColumns(newColumns);
  };

  const handleSort = (index: number) => {
    const newColumns = [...columns];
    const currentDirection = newColumns[index].sortDirection;
    
    // Reset all columns sort direction
    newColumns.forEach((col) => {
      col.sortDirection = 'none';
    });
    
    // Set the new direction for the selected column
    if (currentDirection === 'none' || currentDirection === 'desc') {
      newColumns[index].sortDirection = 'asc';
    } else {
      newColumns[index].sortDirection = 'desc';
    }
    
    setColumns(newColumns);
  };

  const saveTable = () => {
    const newSavedTable: SavedTable = {
      id: Date.now().toString(),
      name: tableName,
      columns,
      filters: {}, // Add filters if needed
      showTotals,
      showSubtotals,
      groupBy
    };
    
    setSavedTables([...savedTables, newSavedTable]);
  };

  const loadTable = (table: SavedTable) => {
    setTableName(table.name);
    setColumns(table.columns);
    setShowTotals(table.showTotals);
    setShowSubtotals(table.showSubtotals);
    setGroupBy(table.groupBy);
    setActiveTab('builder');
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return salesData;
    
    const searchLower = searchTerm.toLowerCase();
    return salesData.filter(item => {
      return Object.entries(item).some(([key, value]) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchLower);
      });
    });
  }, [salesData, searchTerm]);

  // Sort data based on column configuration
  const sortedData = useMemo(() => {
    const sortColumn = columns.find(col => col.sortDirection !== 'none');
    if (!sortColumn || !sortColumn.field) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const valueA = a[sortColumn.field as keyof SalesItem];
      const valueB = b[sortColumn.field as keyof SalesItem];
      
      // Handle numeric values
      if (sortColumn.field === 'Payment Value') {
        const numA = parseFloat(valueA as string || '0');
        const numB = parseFloat(valueB as string || '0');
        return sortColumn.sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      
      // Handle string values
      if (sortColumn.sortDirection === 'asc') {
        return (valueA || '').toString().localeCompare((valueB || '').toString());
      } else {
        return (valueB || '').toString().localeCompare((valueA || '').toString());
      }
    });
  }, [filteredData, columns]);

  // Group data if groupBy is specified
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

  // Calculate aggregations
  const calculateAggregation = (data: SalesItem[], field: keyof SalesItem, type: AggregationType): number | string => {
    if (!field || data.length === 0) return '-';
    
    switch (type) {
      case 'count':
        return data.length;
      case 'unique':
        return new Set(data.map(item => item[field])).size;
      case 'sum':
        return data.reduce((sum, item) => {
          const value = item[field];
          return sum + (parseFloat(value as string || '0') || 0);
        }, 0);
      case 'average':
        const sum = data.reduce((sum, item) => {
          const value = item[field];
          return sum + (parseFloat(value as string || '0') || 0);
        }, 0);
        return sum / data.length;
      case 'max':
        return Math.max(...data.map(item => parseFloat(item[field] as string || '0') || 0));
      case 'min':
        const values = data.map(item => parseFloat(item[field] as string || '0') || 0).filter(val => val > 0);
        return values.length > 0 ? Math.min(...values) : 0;
      default:
        return '-';
    }
  };

  const formatValue = (value: number | string, field: keyof SalesItem, aggregation: AggregationType): string => {
    if (value === '-') return '-';
    
    if (field === 'Payment Value' || aggregation === 'sum' || aggregation === 'average' || aggregation === 'max' || aggregation === 'min') {
      if (typeof value === 'number') {
        if (field === 'Payment Value') {
          return formatCurrency(value);
        }
        return value.toLocaleString(undefined, {maximumFractionDigits: 0});
      }
    }
    
    return String(value);
  };

  // Render table based on configuration
  const renderTable = () => {
    const visibleColumns = columns.filter(col => col.visible);
    
    if (visibleColumns.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Add columns to build your table
        </div>
      );
    }
    
    // If we're grouping data
    if (groupBy && groupedData) {
      return (
        <div className="space-y-6">
          {Object.entries(groupedData).map(([group, items]) => (
            <Card key={group} className="overflow-hidden">
              <div className="p-3 bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{group}</span>
                  <span className="text-sm text-gray-500">{items.length} items</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table className="table-fancy">
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.map((column, idx) => (
                        <TableHead 
                          key={idx}
                          className="cursor-pointer whitespace-nowrap"
                          onClick={() => handleSort(columns.indexOf(column))}
                          style={{ width: `${column.width}px` }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{column.label}</span>
                            {column.sortDirection !== 'none' && (
                              column.sortDirection === 'asc' 
                                ? <ArrowUpAZ size={14} /> 
                                : <ArrowDownAZ size={14} />
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        {visibleColumns.map((column, colIdx) => (
                          <TableCell key={colIdx}>
                            {column.field === 'Payment Value' 
                              ? formatCurrency(parseFloat(item[column.field] as string || '0')) 
                              : item[column.field]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    
                    {/* Subtotals for this group */}
                    {showSubtotals && (
                      <TableRow className="bg-gray-50 font-medium">
                        {visibleColumns.map((column, colIdx) => (
                          <TableCell key={colIdx}>
                            {colIdx === 0 
                              ? `Subtotal (${items.length} items)`
                              : formatValue(
                                  calculateAggregation(items, column.field as keyof SalesItem, column.aggregation),
                                  column.field as keyof SalesItem,
                                  column.aggregation
                                )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ))}
        </div>
      );
    }
    
    // Standard table
    return (
      <Table className="table-fancy">
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column, idx) => (
              <TableHead 
                key={idx}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort(columns.indexOf(column))}
                style={{ width: `${column.width}px` }}
              >
                <div className="flex items-center justify-between">
                  <span>{column.label}</span>
                  {column.sortDirection !== 'none' && (
                    column.sortDirection === 'asc' 
                      ? <ArrowUpAZ size={14} /> 
                      : <ArrowDownAZ size={14} />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item, idx) => (
            <TableRow key={idx}>
              {visibleColumns.map((column, colIdx) => (
                <TableCell key={colIdx}>
                  {column.field === 'Payment Value' 
                    ? formatCurrency(parseFloat(item[column.field] as string || '0')) 
                    : item[column.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
          
          {/* Totals row */}
          {showTotals && (
            <TableRow className="totals-row">
              {visibleColumns.map((column, colIdx) => (
                <TableCell key={colIdx}>
                  {colIdx === 0 
                    ? `Total (${sortedData.length} items)`
                    : formatValue(
                        calculateAggregation(sortedData, column.field as keyof SalesItem, column.aggregation),
                        column.field as keyof SalesItem,
                        column.aggregation
                      )}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">Custom Table Builder</h2>
        
        <div className="flex items-center gap-2">
          <Input 
            value={tableName} 
            onChange={(e) => setTableName(e.target.value)} 
            className="bg-white/20 border-white/30 text-white placeholder:text-white/70 w-48"
            placeholder="Table name"
          />
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={saveTable}
            className="flex items-center gap-2"
          >
            <Save size={14} />
            <span>Save</span>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="builder" className="data-[state=active]:bg-white">Builder</TabsTrigger>
          <TabsTrigger value="preview" className="data-[state=active]:bg-white">Preview</TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-white">Saved Tables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="builder" className="space-y-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Settings size={14} />
                  <span>Column Configuration</span>
                </h3>
                
                <div className="space-y-4">
                  {columns.map((column, index) => (
                    <div key={index} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
                      <div className="flex-grow">
                        <Select
                          value={column.field as string}
                          onValueChange={(value) => updateColumn(index, 'field', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field as string} value={field as string}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-28">
                        <Select
                          value={column.aggregation}
                          onValueChange={(value) => updateColumn(index, 'aggregation', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Aggregation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="unique">Count Unique</SelectItem>
                            <SelectItem value="sum">Sum</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="max">Maximum</SelectItem>
                            <SelectItem value="min">Minimum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-20">
                        <Input
                          type="number"
                          value={column.width}
                          onChange={(e) => updateColumn(index, 'width', parseInt(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`visible-${index}`}
                          checked={column.visible}
                          onCheckedChange={(checked) => updateColumn(index, 'visible', !!checked)}
                        />
                        <label htmlFor={`visible-${index}`} className="text-xs">Visible</label>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeColumn(index)}
                        className="h-8 w-8"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addColumn}
                    className="flex items-center gap-2"
                  >
                    <Plus size={14} />
                    <span>Add Column</span>
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium mb-3">Table Options</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox 
                        id="show-totals" 
                        checked={showTotals} 
                        onCheckedChange={(checked) => setShowTotals(!!checked)} 
                      />
                      <label htmlFor="show-totals">Show totals row</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-subtotals" 
                        checked={showSubtotals} 
                        onCheckedChange={(checked) => setShowSubtotals(!!checked)} 
                      />
                      <label htmlFor="show-subtotals">Show subtotals</label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1">Group by</label>
                    <Select
                      value={groupBy as string}
                      onValueChange={(value) => setGroupBy(value === '' ? '' : value as keyof SalesItem)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No grouping</SelectItem>
                        {availableFields.map((field) => (
                          <SelectItem key={field as string} value={field as string}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
                <h3 className="text-sm font-medium mb-3">Search & Filter</h3>
                
                <div className="mb-4 relative">
                  <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
                  <Input
                    placeholder="Search data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="text-sm text-gray-500 mb-2">
                  {sortedData.length} items found
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm mb-1">Date Field</label>
                  <Select
                    value={dateField as string}
                    onValueChange={(value) => {
                      setDateField(value === '' ? '' : value as keyof SalesItem);
                      setShowDateGrouping(value !== '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {availableFields.filter(field => 
                        field.toLowerCase().includes('date') || 
                        field.toLowerCase().includes('time')
                      ).map((field) => (
                        <SelectItem key={field as string} value={field as string}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {showDateGrouping && dateField && (
                  <div className="mb-4">
                    <DateGrouping 
                      data={filteredData} 
                      dateField={dateField} 
                      onGroupedData={setDateGroupedData} 
                    />
                  </div>
                )}
                
                {/* Add more filters here */}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="py-4">
          <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow">
            {renderTable()}
          </div>
        </TabsContent>
        
        <TabsContent value="saved" className="py-4">
          <div className="space-y-4">
            {savedTables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No saved tables yet. Build and save a table to see it here.
              </div>
            ) : (
              savedTables.map((table) => (
                <Card key={table.id} className="overflow-hidden">
                  <div className="p-3 flex justify-between items-center cursor-pointer"
                       onClick={() => loadTable(table)}>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={16} />
                      <span className="font-medium">{table.name}</span>
                      <span className="text-sm text-gray-500">
                        {table.columns.filter(c => c.visible).length} columns
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => loadTable(table)}>
                      Load
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default CustomTableBuilder;
