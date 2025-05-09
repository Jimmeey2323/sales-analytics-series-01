
import React, { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { SalesItem } from '@/types/sales';
import { format, parseISO, isValid } from 'date-fns';

interface DateGroupingProps {
  data: SalesItem[];
  dateField: keyof SalesItem;
  onGroupedData: (data: Record<string, SalesItem[]>) => void;
}

type GroupingOption = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'none';

const DateGrouping: React.FC<DateGroupingProps> = ({ data, dateField, onGroupedData }) => {
  const [groupBy, setGroupBy] = useState<GroupingOption>('none');
  
  React.useEffect(() => {
    if (groupBy === 'none') {
      onGroupedData({});
      return;
    }
    
    const grouped = data.reduce((acc: Record<string, SalesItem[]>, item) => {
      if (!item[dateField]) return acc;
      
      try {
        const dateValue = parseISO(item[dateField] as string);
        if (!isValid(dateValue)) return acc;
        
        let key: string;
        
        switch (groupBy) {
          case 'day':
            key = format(dateValue, 'yyyy-MM-dd');
            break;
          case 'week':
            // Get the week number and year
            key = `Week ${format(dateValue, 'w, yyyy')}`;
            break;
          case 'month':
            key = format(dateValue, 'MMMM yyyy');
            break;
          case 'quarter':
            const quarter = Math.floor((dateValue.getMonth() / 3)) + 1;
            key = `Q${quarter} ${dateValue.getFullYear()}`;
            break;
          case 'year':
            key = format(dateValue, 'yyyy');
            break;
          default:
            key = 'unknown';
        }
        
        if (!acc[key]) {
          acc[key] = [];
        }
        
        acc[key].push(item);
      } catch (error) {
        console.error("Error processing date:", error);
      }
      
      return acc;
    }, {});
    
    onGroupedData(grouped);
  }, [data, dateField, groupBy, onGroupedData]);
  
  return (
    <Card className="p-4 bg-white shadow-sm border border-gray-100">
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Date Grouping Options</h3>
        
        <div>
          <Select
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as GroupingOption)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select grouping method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="day">By Day</SelectItem>
              <SelectItem value="week">By Week</SelectItem>
              <SelectItem value="month">By Month</SelectItem>
              <SelectItem value="quarter">By Quarter</SelectItem>
              <SelectItem value="year">By Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-xs text-gray-500">
          {groupBy !== 'none' && (
            <p>Data will be grouped by {groupBy}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DateGrouping;
