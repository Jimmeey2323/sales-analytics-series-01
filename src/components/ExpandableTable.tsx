
import React, { useState } from 'react';
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
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { SalesItem } from '@/types/sales';
import { formatCurrency } from '@/utils/salesUtils';

interface ExpandableTableProps {
  data: SalesItem[];
  groupByField: string;
  columns: { key: string; label: string }[];
  title: string;
}

interface GroupedData {
  [key: string]: {
    items: SalesItem[];
    total: number;
    count: number;
  }
}

const ExpandableTable: React.FC<ExpandableTableProps> = ({ 
  data, 
  groupByField, 
  columns, 
  title 
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Group data by the specified field
  const groupedData: GroupedData = React.useMemo(() => {
    return data.reduce((acc: GroupedData, item) => {
      const groupValue = item[groupByField]?.toString() || 'Unknown';
      
      if (!acc[groupValue]) {
        acc[groupValue] = {
          items: [],
          total: 0,
          count: 0
        };
      }
      
      acc[groupValue].items.push(item);
      acc[groupValue].total += parseFloat(item["Payment Value"] || '0');
      acc[groupValue].count += 1;
      
      return acc;
    }, {});
  }, [data, groupByField]);

  // Sort groups by total value (descending)
  const sortedGroups = React.useMemo(() => {
    return Object.entries(groupedData)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([key, value]) => ({ key, ...value }));
  }, [groupedData]);

  // Toggle expansion of a group
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Toggle expansion of an item
  const toggleItem = (itemKey: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  // Calculate grand total
  const grandTotal = sortedGroups.reduce((total, group) => total + group.total, 0);
  const totalItems = sortedGroups.reduce((total, group) => total + group.count, 0);

  return (
    <Card className="overflow-hidden shadow-lg border border-gray-200">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="text-sm text-gray-600">{totalItems} items total</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="font-semibold">{groupByField}</TableHead>
              <TableHead className="text-right font-semibold">Items</TableHead>
              <TableHead className="text-right font-semibold">Total Revenue</TableHead>
              <TableHead className="text-right font-semibold">% of Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGroups.map((group) => (
              <React.Fragment key={group.key}>
                {/* Parent row */}
                <TableRow 
                  isGroupHeader 
                  className="cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-200"
                  onClick={() => toggleGroup(group.key)}
                >
                  <TableCell className="w-10">
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      {expandedGroups[group.key] ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{group.key}</TableCell>
                  <TableCell className="text-right">{group.count}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(Math.round(group.total))}</TableCell>
                  <TableCell className="text-right">
                    {Math.round((group.total / grandTotal) * 100)}%
                  </TableCell>
                </TableRow>
                
                {/* Child rows */}
                {expandedGroups[group.key] && group.items.map((item, itemIndex) => (
                  <React.Fragment key={`${group.key}-${itemIndex}`}>
                    <TableRow 
                      isChildRow
                      className="hover:bg-blue-50/50 border-t border-gray-100"
                      level={1}
                    >
                      <TableCell indent={1}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0 ml-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItem(`${group.key}-${itemIndex}`);
                          }}
                        >
                          {expandedItems[`${group.key}-${itemIndex}`] ? 
                            <ChevronDown className="h-3 w-3" /> : 
                            <ArrowRight className="h-3 w-3" />
                          }
                        </Button>
                      </TableCell>
                      {columns.map((column, colIndex) => (
                        <TableCell 
                          key={`${group.key}-${itemIndex}-${column.key}`}
                          className={column.key === "Payment Value" ? "text-right" : ""}
                        >
                          {column.key === "Payment Value" 
                            ? formatCurrency(Math.round(parseFloat(item[column.key] || '0')))
                            : item[column.key]}
                        </TableCell>
                      ))}
                      {/* Add empty cells for missing columns */}
                      {columns.length < 4 && Array(4 - columns.length).fill(0).map((_, i) => (
                        <TableCell key={`empty-${itemIndex}-${i}`}></TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Show detailed item data when expanded */}
                    {expandedItems[`${group.key}-${itemIndex}`] && (
                      <TableRow 
                        isChildRow
                        className="bg-gray-50/50"
                        level={2}
                      >
                        <TableCell colSpan={5} className="p-0">
                          <div className="p-3 pl-16 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(item)
                              .filter(([key]) => key !== groupByField && !columns.some(col => col.key === key))
                              .slice(0, 8) // Limit to prevent too much data
                              .map(([key, value]) => (
                                <div key={key} className="border-l-2 border-indigo-200 pl-2">
                                  <div className="text-xs text-gray-500">{key}</div>
                                  <div className="text-sm font-medium">
                                    {key === "Payment Value" || key === "Payment Amount" 
                                      ? formatCurrency(parseFloat(value?.toString() || '0'))
                                      : value?.toString()}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                
                {expandedGroups[group.key] && (
                  <TableRow className="bg-blue-50/70 font-medium border-t border-b border-gray-200">
                    <TableCell></TableCell>
                    <TableCell className="pl-10">
                      <span className="text-blue-700">Subtotal for {group.key}</span>
                    </TableCell>
                    <TableCell className="text-right text-blue-700">{group.count} items</TableCell>
                    <TableCell className="text-right text-blue-700">
                      {formatCurrency(Math.round(group.total))}
                    </TableCell>
                    <TableCell className="text-right text-blue-700">
                      {Math.round((group.total / grandTotal) * 100)}%
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            
            {/* Total row */}
            <TableRow className="bg-gray-100 font-semibold text-gray-800 border-t-2 border-gray-300">
              <TableCell></TableCell>
              <TableCell>Grand Total</TableCell>
              <TableCell className="text-right">{totalItems} items</TableCell>
              <TableCell className="text-right">{formatCurrency(Math.round(grandTotal))}</TableCell>
              <TableCell className="text-right">100%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default ExpandableTable;
