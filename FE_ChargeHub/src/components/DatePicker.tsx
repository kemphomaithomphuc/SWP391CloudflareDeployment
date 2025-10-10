import { useState } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const daysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 100; year <= currentYear; year++) {
    years.push(year);
  }
  return years.reverse();
};

export default function DatePicker({ value, onChange, placeholder = "Select date", className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"years" | "months" | "days">("days");
  
  // Parse current value or default to current date for navigation, but don't select it
  const parseDate = (dateStr?: string) => {
    if (dateStr) {
      const date = new Date(dateStr);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
      };
    }
    const today = new Date();
    return {
      year: today.getFullYear() - 25, // Default to 25 years ago for birth date
      month: today.getMonth(),
      day: today.getDate()
    };
  };

  const [currentDate, setCurrentDate] = useState(parseDate(value));
  const [selectedDate, setSelectedDate] = useState<{year: number; month: number; day: number} | null>(
    value ? parseDate(value) : null
  );

  const formatDate = (date: { year: number; month: number; day: number }) => {
    return `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  };

  const displayDate = (date: { year: number; month: number; day: number }) => {
    return `${months[date.month]} ${date.day}, ${date.year}`;
  };

  const handleDateSelect = (type: "year" | "month" | "day", value: number) => {
    if (type === "year") {
      const newDate = { ...currentDate, year: value };
      setCurrentDate(newDate);
      setView("months");
    } else if (type === "month") {
      const newDate = { ...currentDate, month: value };
      setCurrentDate(newDate);
      setView("days");
    } else if (type === "day") {
      const newDate = { ...currentDate, day: value };
      setSelectedDate(newDate);
      setCurrentDate(newDate);
      onChange?.(formatDate(newDate));
      setIsOpen(false);
      setView("days");
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = { ...currentDate };
    if (direction === "prev") {
      if (newDate.month === 0) {
        newDate.month = 11;
        newDate.year -= 1;
      } else {
        newDate.month -= 1;
      }
    } else {
      if (newDate.month === 11) {
        newDate.month = 0;
        newDate.year += 1;
      } else {
        newDate.month += 1;
      }
    }
    setCurrentDate(newDate);
  };

  const renderYears = () => {
    const years = generateYears();
    const currentYear = new Date().getFullYear();
    
    return (
      <div className="p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-card-foreground">Select Year</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("days")}
            className="h-8 w-8 p-0 hover:bg-accent"
          >
            ×
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {years.map((year) => (
            <Button
              key={year}
              variant={currentDate.year === year ? "default" : "ghost"}
              size="sm"
              onClick={() => handleDateSelect("year", year)}
              className={`h-8 text-sm hover:bg-accent ${
                currentDate.year === year ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
              }`}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderMonths = () => {
    return (
      <div className="p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-card-foreground">Select Month - {currentDate.year}</h3>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("years")}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("days")}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              ×
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <Button
              key={month}
              variant={currentDate.month === index ? "default" : "ghost"}
              size="sm"
              onClick={() => handleDateSelect("month", index)}
              className={`h-10 text-sm hover:bg-accent ${
                currentDate.month === index ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
              }`}
            >
              {month.slice(0, 3)}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const daysCount = daysInMonth(currentDate.month, currentDate.year);
    const firstDay = new Date(currentDate.year, currentDate.month, 1).getDay();
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysCount; day++) {
      days.push(day);
    }

    return (
      <div className="p-4 w-80">
        {/* Header with month/year and navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("years")}
              className="text-sm font-medium hover:bg-accent px-3"
            >
              {months[currentDate.month]} {currentDate.year}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 hover:bg-accent"
          >
            ×
          </Button>
        </div>
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isSelected = selectedDate && 
              selectedDate.day === day && 
              selectedDate.month === currentDate.month && 
              selectedDate.year === currentDate.year;
            
            return (
              <div key={index} className="h-8 flex items-center justify-center">
                {day && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDateSelect("day", day)}
                    className={`h-8 w-8 p-0 text-sm hover:bg-accent ${
                      isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                    }`}
                  >
                    {day}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Today button for quick access */}
        <div className="mt-4 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const todayDate = {
                year: today.getFullYear(),
                month: today.getMonth(),
                day: today.getDate()
              };
              setSelectedDate(todayDate);
              setCurrentDate(todayDate);
              onChange?.(formatDate(todayDate));
              setIsOpen(false);
            }}
            className="w-full h-8 text-sm border-border hover:bg-accent"
          >
            Today
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <div
          className={`h-11 w-full px-3 py-2 border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary bg-input-background hover:bg-accent cursor-pointer flex items-center text-left ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
          {selectedDate ? (
            <span className="text-card-foreground">{displayDate(selectedDate)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border border-border rounded-lg shadow-lg" align="start">
        {view === "years" && renderYears()}
        {view === "months" && renderMonths()}
        {view === "days" && renderDays()}
      </PopoverContent>
    </Popover>
  );
}