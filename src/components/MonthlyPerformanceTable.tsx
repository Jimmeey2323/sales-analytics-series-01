
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
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/salesUtils';
import { ArrowUp, ArrowDown, Calendar, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MonthlyPerformanceTableProps {
  data: MonthlyData[];
  title: string;
}

const MonthlyPerformanceTable: React.FC<MonthlyPerformanceTableProps> = ({ data, title }) => {
  const [sortColumn, setSortColumn] = useState<keyof MonthlyData>('sortKey');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<string>('revenue');

  const handleSort = (column: keyof MonthlyData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort data based on column
  const sortedData = [...data].sort((a, b) => {
    // Special case for monthYear to sort by date
    if (sortColumn === 'monthYear') {
      // Parse month names and convert to comparable values
      const getMonthValue = (monthStr: string) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const [month, year] = monthStr.split(' ');
        const monthIndex = months.indexOf(month);
        return parseInt(year) * 100 + monthIndex;
      };
      
      const monthA = getMonthValue(a[sortColumn] as string);
      const monthB = getMonthValue(b[sortColumn] as string);
      
      if (sortDirection === 'asc') {
        return monthA - monthB;
      } else {
        return monthB - monthA;
      }
    }
    
    // Default sorting for numbers and other values
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
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar size={18} />
          {title}
        </h3>
      </div>
      
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="revenue" className="data-[state=active]:bg-white data-[state=active]:text-primary">Revenue</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-white data-[state=active]:text-primary">Transactions</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-white data-[state=active]:text-primary">Customers</TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-white data-[state=active]:text-primary">Key Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="m-0">
            <div className="overflow-x-auto">
              <Table className="table-fancy">
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('monthYear')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Month</span>
                        {sortColumn === 'monthYear' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('preTaxRevenue')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Revenue (Pre-tax)</span>
                        {sortColumn === 'preTaxRevenue' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('postTaxRevenue')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Revenue (Post-tax)</span>
                        {sortColumn === 'postTaxRevenue' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('totalTax')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Tax Amount</span>
                        {sortColumn === 'totalTax' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((month, index) => (
                    <TableRow key={month.sortKey}>
                      <TableCell className="font-medium">{month.monthYear}</TableCell>
                      <TableCell className="text-center">{formatCurrency(Math.round(month.preTaxRevenue))}</TableCell>
                      <TableCell className="text-center">{formatCurrency(Math.round(month.postTaxRevenue))}</TableCell>
                      <TableCell className="text-center">{formatCurrency(Math.round(month.totalTax))}</TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="totals-row">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">{formatCurrency(Math.round(totals.preTaxRevenue))}</TableCell>
                    <TableCell className="text-center">{formatCurrency(Math.round(totals.postTaxRevenue))}</TableCell>
                    <TableCell className="text-center">{formatCurrency(Math.round(totals.totalTax))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="transactions" className="m-0">
            <div className="overflow-x-auto">
              <Table className="table-fancy">
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('monthYear')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Month</span>
                        {sortColumn === 'monthYear' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('transactions')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Transactions</span>
                        {sortColumn === 'transactions' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('unitsSold')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Units Sold</span>
                        {sortColumn === 'unitsSold' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('postTaxRevenue')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Revenue</span>
                        {sortColumn === 'postTaxRevenue' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((month, index) => (
                    <TableRow key={month.sortKey}>
                      <TableCell className="font-medium">{month.monthYear}</TableCell>
                      <TableCell className="text-center">{month.transactions}</TableCell>
                      <TableCell className="text-center">{month.unitsSold}</TableCell>
                      <TableCell className="text-center">{formatCurrency(Math.round(month.postTaxRevenue))}</TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="totals-row">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">{totals.transactions}</TableCell>
                    <TableCell className="text-center">{totals.unitsSold}</TableCell>
                    <TableCell className="text-center">{formatCurrency(Math.round(totals.postTaxRevenue))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="customers" className="m-0">
            <div className="overflow-x-auto">
              <Table className="table-fancy">
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('monthYear')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Month</span>
                        {sortColumn === 'monthYear' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('uniqueClients')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Unique Clients</span>
                        {sortColumn === 'uniqueClients' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('transactions')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Transactions</span>
                        {sortColumn === 'transactions' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <span>Repeat Rate</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((month, index) => (
                    <TableRow key={month.sortKey}>
                      <TableCell className="font-medium">{month.monthYear}</TableCell>
                      <TableCell className="text-center">{month.uniqueClients}</TableCell>
                      <TableCell className="text-center">{month.transactions}</TableCell>
                      <TableCell className="text-center">
                        {month.uniqueClients > 0 
                          ? `${Math.round((month.transactions - month.uniqueClients) * 100 / month.uniqueClients)}%` 
                          : '0%'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals/Averages row */}
                  <TableRow className="totals-row">
                    <TableCell>Total/Avg</TableCell>
                    <TableCell className="text-center">{totals.uniqueClients}</TableCell>
                    <TableCell className="text-center">{totals.transactions}</TableCell>
                    <TableCell className="text-center">
                      {totals.uniqueClients > 0 
                        ? `${Math.round((totals.transactions - totals.uniqueClients) * 100 / totals.uniqueClients)}%` 
                        : '0%'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics" className="m-0">
            <div className="overflow-x-auto">
              <Table className="table-fancy">
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('monthYear')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Month</span>
                        {sortColumn === 'monthYear' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('atv')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>ATV</span>
                        {sortColumn === 'atv' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('auv')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>AUV</span>
                        {sortColumn === 'auv' && (
                          sortDirection === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <span>Units/Transaction</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((month, index) => (
                    <TableRow key={month.sortKey}>
                      <TableCell className="font-medium">{month.monthYear}</TableCell>
                      <TableCell className="text-center">{formatCurrency(Math.round(month.atv))}</TableCell>
                      <TableCell className="text-center">{formatCurrency(Math.round(month.auv))}</TableCell>
                      <TableCell className="text-center">
                        {month.transactions > 0 
                          ? Math.round(month.unitsSold * 10 / month.transactions) / 10
                          : 0}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Averages row */}
                  <TableRow className="totals-row">
                    <TableCell>Average</TableCell>
                    <TableCell className="text-center">
                      {formatCurrency(Math.round(totals.postTaxRevenue / totals.transactions))}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatCurrency(Math.round(totals.postTaxRevenue / totals.uniqueClients))}
                    </TableCell>
                    <TableCell className="text-center">
                      {totals.transactions > 0 
                        ? Math.round(totals.unitsSold * 10 / totals.transactions) / 10
                        : 0}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default MonthlyPerformanceTable;
