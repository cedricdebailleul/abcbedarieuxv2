"use client";

import { useState, useEffect } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type TimeSlot = {
  openTime: string;
  closeTime: string;
};

type DaySchedule = {
  dayOfWeek: string;
  isClosed: boolean;
  slots: TimeSlot[];
};

type OpeningHoursFormProps = {
  value: DaySchedule[];
  onChange: (hours: DaySchedule[]) => void;
  disabled?: boolean;
};

const DAYS = [
  { key: "MONDAY", label: "Lundi" },
  { key: "TUESDAY", label: "Mardi" },
  { key: "WEDNESDAY", label: "Mercredi" },
  { key: "THURSDAY", label: "Jeudi" },
  { key: "FRIDAY", label: "Vendredi" },
  { key: "SATURDAY", label: "Samedi" },
  { key: "SUNDAY", label: "Dimanche" },
];

export function OpeningHoursForm({
  value,
  onChange,
  disabled = false,
}: OpeningHoursFormProps) {
  // Initialiser avec des jours vides si pas de valeur
  const [schedules, setSchedules] = useState<DaySchedule[]>(() => {
    if (value && value.length > 0) {
      // Créer un map des jours existants
      const existingDays = new Map(value.map((v) => [v.dayOfWeek, v]));

      return DAYS.map((day) => {
        const existing = existingDays.get(day.key);
        if (existing) {
          return {
            dayOfWeek: day.key,
            isClosed: existing.isClosed,
            slots: existing.slots || [],
          };
        }
        return {
          dayOfWeek: day.key,
          isClosed: true,
          slots: [],
        };
      });
    }

    return DAYS.map((day) => ({
      dayOfWeek: day.key,
      isClosed: true,
      slots: [],
    }));
  });

  // Synchroniser avec les props quand elles changent
  useEffect(() => {
    if (value && value.length > 0) {
      const existingDays = new Map(value.map((v) => [v.dayOfWeek, v]));

      const newSchedules = DAYS.map((day) => {
        const existing = existingDays.get(day.key);
        if (existing) {
          return {
            dayOfWeek: day.key,
            isClosed: existing.isClosed,
            slots: existing.slots || [],
          };
        }
        return {
          dayOfWeek: day.key,
          isClosed: true,
          slots: [],
        };
      });

      setSchedules(newSchedules);
    }
  }, [value]);

  const updateSchedules = (newSchedules: DaySchedule[]) => {
    setSchedules(newSchedules);
    onChange(newSchedules);
  };

  const toggleDayClosed = (dayIndex: number) => {
    const newSchedules = [...schedules];
    const day = newSchedules[dayIndex];
    day.isClosed = !day.isClosed;

    // Si on ferme le jour, vider les créneaux
    if (day.isClosed) {
      day.slots = [];
    } else if (day.slots.length === 0) {
      // Si on ouvre le jour et qu'il n'y a pas de créneaux, en ajouter un par défaut
      day.slots = [{ openTime: "09:00", closeTime: "18:00" }];
    }

    updateSchedules(newSchedules);
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[dayIndex].slots.push({
      openTime: "09:00",
      closeTime: "18:00",
    });
    updateSchedules(newSchedules);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[dayIndex].slots.splice(slotIndex, 1);
    updateSchedules(newSchedules);
  };

  const updateTimeSlot = (
    dayIndex: number,
    slotIndex: number,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    const newSchedules = [...schedules];
    newSchedules[dayIndex].slots[slotIndex][field] = value;
    updateSchedules(newSchedules);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Horaires d&apos;ouverture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day, dayIndex) => {
          const schedule = schedules.find((s) => s.dayOfWeek === day.key) || {
            dayOfWeek: day.key,
            isClosed: true,
            slots: [],
          };

          return (
            <div key={day.key} className="space-y-3">
              {/* Jour + Switch ouvert/fermé */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{day.label}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Fermé</span>
                  <Switch
                    checked={!schedule.isClosed}
                    onCheckedChange={() => toggleDayClosed(dayIndex)}
                    disabled={disabled}
                  />
                  <span className="text-xs text-muted-foreground">Ouvert</span>
                </div>
              </div>

              {/* Créneaux horaires */}
              {!schedule.isClosed && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  {schedule.slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.openTime}
                        onChange={(e) =>
                          updateTimeSlot(
                            dayIndex,
                            slotIndex,
                            "openTime",
                            e.target.value
                          )
                        }
                        disabled={disabled}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">à</span>
                      <Input
                        type="time"
                        value={slot.closeTime}
                        onChange={(e) =>
                          updateTimeSlot(
                            dayIndex,
                            slotIndex,
                            "closeTime",
                            e.target.value
                          )
                        }
                        disabled={disabled}
                        className="w-24"
                      />
                      {schedule.slots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                          disabled={disabled}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Bouton ajouter créneau */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addTimeSlot(dayIndex)}
                    disabled={disabled}
                    className="gap-1 text-xs h-7"
                  >
                    <Plus className="w-3 h-3" />
                    Ajouter un créneau
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
