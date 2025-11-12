import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
  options?: { label: string; value: number }[];
}

const defaultOptions = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

export function DateRangeSelector({ value, onChange, options = defaultOptions }: DateRangeSelectorProps) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn('text-sm')}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
