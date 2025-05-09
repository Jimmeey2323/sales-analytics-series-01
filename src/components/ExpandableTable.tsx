
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
import { ChevronDown, ChevronRight } from "lucide-react";
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

  // Calculate grand total
  const grandTotal = sortedGroups.reduce((total, group) => total + group.total, 0);
  const totalItems = sortedGroups.reduce((total, group) => total + group.count, 0);

  return (
    <Card className="overflow-hidden shadow-md border border-gray-200">
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
                  className="cursor-pointer hover:bg-blue-50 transition-colors"
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
                {expandedGroups[group.key] && (
                  <>
                    {/* Column headers for the expanded items */}
                    <TableRow isChildRow className="bg-gray-100">
                      <TableCell indent={1}></TableCell>
                      {columns.map((column) => (
                        <TableCell 
                          key={column.key} 
                          className={column.key === "Payment Value" ? "text-right" : ""}
                        >
                          <span className="text-xs font-medium text-gray-600">{column.label}</span>
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {group.items.map((item, itemIndex) => (
                      <TableRow 
                        key={`${group.key}-${itemIndex}`}
                        isChildRow
                        className="hover:bg-blue-50/50"
                      >
                        <TableCell indent={1}></TableCell>
                        {columns.map((column) => (
                          <TableCell 
                            key={`${group.key}-${itemIndex}-${column.key}`}
                            className={column.key === "Payment Value" ? "text-right" : ""}
                          >
                            {column.key === "Payment Value" 
                              ? formatCurrency(Math.round(parseFloat(item[column.key] || '0')))
                              : item[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    
                    {/* Subtotal row */}
                    <TableRow className="bg-blue-50/70 font-medium">
                      <TableCell indent={1}></TableCell>
                      <TableCell>Subtotal</TableCell>
                      <TableCell colSpan={columns.length - 2} className="text-right">
                        {group.count} items
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Math.round(group.total))}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </React.Fragment>
            ))}
            
            {/* Total row */}
            <TableRow className="bg-gray-100 font-semibold">
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
