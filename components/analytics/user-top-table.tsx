import { AnalyticsTopTable } from "./analytics-top-table";

interface UserTopTableItem {
  id: string;
  name: string;
  slug: string;
  views: number;
  participants?: number;
}

interface UserTopTableProps {
  title?: string;
  items: UserTopTableItem[];
  hrefPrefix?: string;
  emptyMessage?: string;
  showParticipants?: boolean;
}

export function UserTopTable({
  items,
  hrefPrefix = "",
  emptyMessage,
  showParticipants,
}: UserTopTableProps) {
  return (
    <AnalyticsTopTable
      items={items}
      hrefPrefix={hrefPrefix}
      emptyMessage={emptyMessage}
      showParticipants={showParticipants}
    />
  );
}
