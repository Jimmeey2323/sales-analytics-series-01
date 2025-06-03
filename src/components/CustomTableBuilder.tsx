
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CustomTableBuilderProps {
  data: any[];
  columns: string[];
}

const CustomTableBuilder: React.FC<CustomTableBuilderProps> = ({ data, columns }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column}>
                {typeof row[column] === 'number' ? 
                  Number(row[column]).toLocaleString() : 
                  String(row[column] || '')
                }
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CustomTableBuilder;
