import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, SelectSingleEventHandler, DateRange } from "react-day-picker";
import { isValid } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onSelect,
  ...props
}: CalendarProps) {
  // Helper function to create a safe date object
  const createSafeDate = (date: Date | undefined | any): Date | undefined => {
    if (!date) return undefined;

    try {
      // Handle DateRange object being passed instead of Date
      if (typeof date === 'object' && 'from' in date) {
        console.warn('DateRange object passed to createSafeDate, extracting date.from');
        return createSafeDate(date.from);
      }

      // Create a new date at noon to avoid timezone issues
      const safeDate = new Date(date);
      safeDate.setHours(12, 0, 0, 0);

      // Validate the date
      if (!isValid(safeDate)) {
        console.error('Invalid date in Calendar component:', date);
        return undefined;
      }

      return safeDate;
    } catch (error) {
      console.error('Error creating safe date:', error);
      return undefined;
    }
  };

  // Create a custom onSelect handler to fix timezone issues
  const handleSelect = React.useCallback(
    (day: Date | undefined | any, selectedDay: Date, activeModifiers: Record<string, boolean>) => {
      if (!onSelect) return;

      // If day is undefined, pass it through
      if (!day) {
        (onSelect as any)(undefined);
        return;
      }

      try {
        // Check if day is a DateRange object instead of a Date
        if (typeof day === 'object' && 'from' in day) {
          console.warn('DateRange object passed to handleSelect instead of Date');
          // Just pass it through to the parent component
          (onSelect as any)(day);
          return;
        }

        // Create a safe date object
        const fixedDate = createSafeDate(day);
        if (!fixedDate) {
          console.error('Could not create a valid date from:', day);
          return;
        }

        // Handle different modes (single, range, multiple)
        if (props.mode === 'range' && typeof onSelect === 'function') {
          // For range mode, we need to handle the range object
          const range = props.selected as DateRange | undefined;

          // Determine if this is the start or end date
          if (!range?.from) {
            // First selection - start date
            (onSelect as any)({ from: fixedDate, to: undefined });
          } else if (range.from && !range.to) {
            // Second selection - end date
            const isAfter = fixedDate > range.from;

            if (isAfter) {
              (onSelect as any)({ ...range, to: fixedDate });
            } else {
              // If selecting a date before the start date, swap them
              (onSelect as any)({ from: fixedDate, to: range.from });
            }
          } else {
            // Reset selection
            (onSelect as any)({ from: fixedDate, to: undefined });
          }
        } else {
          // For single mode
          (onSelect as SelectSingleEventHandler)(fixedDate);
        }
      } catch (error) {
        console.error('Error in Calendar handleSelect:', error);
        // Pass undefined on error to reset the selection
        (onSelect as any)(undefined);
      }
    },
    [onSelect, props.mode, props.selected]
  );
  // Process selected prop to ensure valid dates
  const processSelectedProp = () => {
    if (props.mode === 'range' && props.selected) {
      const selected = props.selected as DateRange;

      // Validate from and to dates
      const validFrom = selected.from && isValid(selected.from) ? selected.from : undefined;
      const validTo = selected.to && isValid(selected.to) ? selected.to : undefined;

      return {
        ...props,
        selected: { from: validFrom, to: validTo }
      };
    }

    // For single mode
    if (props.selected && !isValid(props.selected as Date)) {
      return { ...props, selected: undefined };
    }

    return props;
  };

  // Get processed props with valid dates
  const processedProps = processSelectedProp();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      onSelect={handleSelect}
      {...processedProps}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
