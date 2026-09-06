"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react@0.487.0";
import { DayPicker } from "react-day-picker@8.10.1";
import { enUS } from "date-fns/locale";

import { cn } from "./utils";
import { buttonVariants } from "./button";

// Custom weekday names (3 letters)
const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={enUS}
      className={cn("p-3 mx-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2 justify-center",
        month: "flex flex-col gap-6 items-center",
        caption: "flex justify-center pt-2 relative items-center w-full mb-4",
        caption_label: "text-sm font-medium text-center",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 bg-transparent p-0 opacity-70 hover:opacity-100 border-2",
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse mx-auto",
        head_row: "flex w-full",
        head_cell:
          "text-muted-foreground rounded-md w-12 font-normal text-[0.8rem] flex items-center justify-center p-1 text-center",
        row: "flex w-full mt-4",
        cell: cn(
          "relative w-12 p-1 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-12 w-12 p-0 font-normal aria-selected:opacity-100 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
        Weekday: ({ weekday, className, ...props }) => {
          return (
            <th className={cn(className)} {...props}>
              {weekdayNames[weekday]}
            </th>
          );
        },
      }}
      locale={enUS}
      {...props}
    />
  );
}

export { Calendar };
