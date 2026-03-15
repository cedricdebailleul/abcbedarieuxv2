import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCard {
  label: string;
  value: string | number;
  growth?: number;
  icon?: React.ReactNode;
}

interface AnalyticsKpiCardsProps {
  cards: KpiCard[];
}

const gridCols: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
};

export function AnalyticsKpiCards({ cards }: AnalyticsKpiCardsProps) {
  const colClass = gridCols[Math.min(cards.length, 4)] ?? "grid-cols-2 md:grid-cols-4";
  return (
    <div className={cn("grid gap-4", colClass)}>
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              {card.icon && <div className="text-muted-foreground">{card.icon}</div>}
            </div>
            <p className="text-2xl font-bold">
              {typeof card.value === "number"
                ? card.value.toLocaleString("fr-FR")
                : card.value}
            </p>
            {card.growth !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {card.growth > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                ) : card.growth < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    card.growth > 0
                      ? "text-green-500"
                      : card.growth < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                  )}
                >
                  {card.growth > 0 ? "+" : ""}{card.growth}% vs période précédente
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
