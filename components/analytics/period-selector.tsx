"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

export type Period = "7d" | "30d" | "12m" | "custom";

interface PeriodSelectorProps {
  value: Period;
  customRange?: { from: string; to: string };
  onChange: (period: Period, range?: { from: string; to: string }) => void;
}

const PRESETS: { label: string; value: Period }[] = [
  { label: "7j", value: "7d" },
  { label: "30j", value: "30d" },
  { label: "12m", value: "12m" },
];

export function PeriodSelector({ value, customRange, onChange }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(
    customRange
      ? { from: new Date(customRange.from), to: new Date(customRange.to) }
      : undefined
  );

  const handlePreset = (preset: Period) => {
    onChange(preset);
  };

  const handleCustomApply = () => {
    if (range?.from && range?.to) {
      onChange("custom", {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      });
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {PRESETS.map(preset => (
        <Button
          key={preset.value}
          variant={value === preset.value ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset(preset.value)}
        >
          {preset.label}
        </Button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={value === "custom" ? "default" : "outline"}
            size="sm"
            className="gap-1"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {value === "custom" && customRange
              ? `${format(new Date(customRange.from), "dd/MM", { locale: fr })} – ${format(new Date(customRange.to), "dd/MM", { locale: fr })}`
              : "Personnalisé"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="end">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            locale={fr}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={handleCustomApply} disabled={!range?.from || !range?.to}>
              Appliquer
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
