declare module 'react-day-picker' {
  import * as React from 'react';
  
  export interface DayPickerProps {
    mode?: 'single' | 'multiple' | 'range';
    selected?: Date | Date[] | { from?: Date; to?: Date };
    onSelect?: (date: Date | Date[] | { from?: Date; to?: Date } | undefined) => void;
    showOutsideDays?: boolean;
    className?: string;
    classNames?: Record<string, string>;
    components?: Record<string, React.ComponentType<any>>;
  }
  
  export const DayPicker: React.ComponentType<DayPickerProps>;
}


