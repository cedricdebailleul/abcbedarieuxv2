import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface TopItem {
  id: string;
  name: string;
  slug: string;
  views: number;
  participants?: number;
}

interface AnalyticsTopTableProps {
  items: TopItem[];
  hrefPrefix: string;
  emptyMessage?: string;
  showParticipants?: boolean;
}

export function AnalyticsTopTable({
  items,
  hrefPrefix,
  emptyMessage = "Aucune donnée sur la période",
  showParticipants = false,
}: AnalyticsTopTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-mono text-muted-foreground w-5 shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <Link
              href={`${hrefPrefix}/${item.slug}`}
              className="text-sm font-medium hover:underline truncate block"
            >
              {item.name}
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showParticipants && item.participants !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {item.participants} part.
              </Badge>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {item.views.toLocaleString("fr-FR")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
