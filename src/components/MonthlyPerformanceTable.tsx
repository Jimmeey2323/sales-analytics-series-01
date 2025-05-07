
import React, { useState } from 'react';
import { MonthlyData } from '../types/sales';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/utils/salesUtils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MonthlyPerformanceTableProps {
  data: MonthlyData[];
  title: string;
}

const MonthlyPerformanceTable: React.FC<MonthlyPerformanceTableProps> = ({ data, title }) => {
  const [sortColumn, setSortColumn] = useState<keyof MonthlyData>('sortKey');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof MonthlyData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortColumn] > b[sortColumn] ? 1 : -1;
    } else {
      return a[sortColumn] < b[sortColumn] ? 1 : -1;
    }
  });

  // Calculate totals for the last row
  const totals = data.reduce(
    (acc, month) => {
      acc.totalSales += month.totalSales;
      acc.totalTax += month.totalTax;
      acc.unitsSold += month.unitsSold;
      acc.transactions += month.transactions;
      acc.uniqueClients = Math.max(acc.uniqueClients, month.uniqueClients); // Take the highest unique client count
      acc.preTaxRevenue += month.preTaxRevenue;
      acc.postTaxRevenue += month.postTaxRevenue;
      return acc;
    },
    {
      totalSales: 0,
      totalTax: 0,
      unitsSold: 0,
      transactions: 0,
      uniqueClients: 0,
      preTaxRevenue: 0,
      postTaxRevenue: 0,
    }
  );

  const calculateAverage = (value: number) => value / (data.length || 1);

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('monthYear')}
              >
                <div className="flex items-center">
                  <span>Month</span>
                  {sortColumn === 'monthYear' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('preTaxRevenue')}
              >
                <div className="flex items-center justify-center">
                  <span>Revenue (Pre-tax)</span>
                  {sortColumn === 'preTaxRevenue' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('postTaxRevenue')}
              >
                <div className="flex items-center justify-center">
                  <span>Revenue (Post-tax)</span>
                  {sortColumn === 'postTaxRevenue' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('totalTax')}
              >
                <div className="flex items-center justify-center">
                  <span>Tax Amount</span>
                  {sortColumn === 'totalTax' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('unitsSold')}
              >
                <div className="flex items-center justify-center">
                  <span>Units Sold</span>
                  {sortColumn === 'unitsSold' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('transactions')}
              >
                <div className="flex items-center justify-center">
                  <span>Transactions</span>
                  {sortColumn === 'transactions' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('uniqueClients')}
              >
                <div className="flex items-center justify-center">
                  <span>Unique Clients</span>
                  {sortColumn === 'uniqueClients' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('atv')}
              >
                <div className="flex items-center justify-center">
                  <span>ATV</span>
                  {sortColumn === 'atv' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('auv')}
              >
                <div className="flex items-center justify-center">
                  <span>AUV</span>
                  {sortColumn === 'auv' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((month, index) => (
              <TableRow key={month.sortKey}>
                <TableCell className="font-medium">{month.monthYear}</TableCell>
                <TableCell className="text-center">{formatCurrency(month.preTaxRevenue)}</TableCell>
                <TableCell className="text-center">{formatCurrency(month.postTaxRevenue)}</TableCell>
                <TableCell className="text-center">{formatCurrency(month.totalTax)}</TableCell>
                <TableCell className="text-center">{month.unitsSold}</TableCell>
                <TableCell className="text-center">{month.transactions}</TableCell>
                <TableCell className="text-center">{month.uniqueClients}</TableCell>
                <TableCell className="text-center">{formatCurrency(month.atv)}</TableCell>
                <TableCell className="text-center">{formatCurrency(month.auv)}</TableCell>
              </TableRow>
            ))}
            {/* Totals row */}
            <TableRow className="bg-gray-50 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-center">{formatCurrency(totals.preTaxRevenue)}</TableCell>
              <TableCell className="text-center">{formatCurrency(totals.postTaxRevenue)}</TableCell>
              <TableCell className="text-center">{formatCurrency(totals.totalTax)}</TableCell>
              <TableCell className="text-center">{totals.unitsSold}</TableCell>
              <TableCell className="text-center">{totals.transactions}</TableCell>
              <TableCell className="text-center">{totals.uniqueClients}</TableCell>
              <TableCell className="text-center">{formatCurrency(calculateAverage(totals.totalSales) / calculateAverage(totals.transactions))}</TableCell>
              <TableCell className="text-center">{formatCurrency(calculateAverage(totals.totalSales) / calculateAverage(totals.uniqueClients))}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MonthlyPerformanceTable;
