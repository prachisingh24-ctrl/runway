import { format, parseISO } from 'date-fns';
import { DatePicker } from '@project/components/ui/date-picker';

/** DatePicker bound to a YYYY-MM-DD string. */
export default function DateField({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <DatePicker
      className={className}
      value={value ? parseISO(value) : undefined}
      onChange={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
    />
  );
}
