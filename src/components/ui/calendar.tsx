import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, SelectSingleEventHandler, DateRange } from "react-day-picker";
import { isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar(
    {
        className,
        classNames,
        showOutsideDays = true,
        onSelect,
        ...props
    }: CalendarProps
) {
    const createSafeDate = (date: Date | undefined | any): Date | undefined => {
        if (!date)
            return undefined;

        try {
            if (typeof date === "object" && "from" in date) {
                return createSafeDate(date.from);
            }

            const safeDate = new Date(date);
            safeDate.setHours(12, 0, 0, 0);

            if (!isValid(safeDate)) {
                return undefined;
            }

            return safeDate;
        } catch (error) {
            return undefined;
        }
    };

    const handleSelect = React.useCallback((
        day: Date | undefined | any,
        selectedDay: Date,
        activeModifiers: Record<string, boolean>
    ) => {
        if (!onSelect)
            return;

        if (!day) {
            (onSelect as any)(undefined);
            return;
        }

        try {
            if (typeof day === "object" && "from" in day) {
                (onSelect as any)(day);
                return;
            }

            const fixedDate = createSafeDate(day);

            if (!fixedDate) {
                return;
            }

            if (props.mode === "range" && typeof onSelect === "function") {
                const range = props.selected as DateRange | undefined;

                if (!range?.from) {
                    (onSelect as any)({
                        from: fixedDate,
                        to: undefined
                    });
                } else if (range.from && !range.to) {
                    const isAfter = fixedDate > range.from;

                    if (isAfter) {
                        (onSelect as any)({
                            ...range,
                            to: fixedDate
                        });
                    } else {
                        (onSelect as any)({
                            from: fixedDate,
                            to: range.from
                        });
                    }
                } else {
                    (onSelect as any)({
                        from: fixedDate,
                        to: undefined
                    });
                }
            } else {
                (onSelect as SelectSingleEventHandler)(fixedDate);
            }
        } catch (error) {
            (onSelect as any)(undefined);
        }
    }, [onSelect, props.mode, props.selected]);

    const processSelectedProp = () => {
        if (props.mode === "range" && props.selected) {
            const selected = props.selected as DateRange;
            const validFrom = selected.from && isValid(selected.from) ? selected.from : undefined;
            const validTo = selected.to && isValid(selected.to) ? selected.to : undefined;

            return {
                ...props,

                selected: {
                    from: validFrom,
                    to: validTo
                }
            };
        }

        if (props.selected && !isValid(props.selected as Date)) {
            return {
                ...props,
                selected: undefined
            };
        }

        return props;
    };

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

                nav_button: cn(buttonVariants({
                    variant: "outline"
                }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),

                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",

                day: cn(buttonVariants({
                    variant: "ghost"
                }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),

                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames
            }}
            components={{
                IconLeft: (
                    {
                        ..._props
                    }
                ) => <ChevronLeft className="h-4 w-4" />,

                IconRight: (
                    {
                        ..._props
                    }
                ) => <ChevronRight className="h-4 w-4" />
            }}
            onSelect={handleSelect}
            {...processedProps} />
    );
}

Calendar.displayName = "Calendar";
export { Calendar };