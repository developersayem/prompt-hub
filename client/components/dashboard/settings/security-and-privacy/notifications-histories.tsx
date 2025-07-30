import LoadingCom from "@/components/shared/loading-com";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";

export type INotification = {
  userId: string;
  message: string;
  date: string;
};

export interface NotificationHistoryRef {
  refreshHistory: () => void;
}

const NotificationHistory = forwardRef<NotificationHistoryRef>((props, ref) => {
  const [history, setHistory] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/settings/notification-histories`,
        {
          credentials: "include", // if cookies/session needed
        }
      );
      const json = await res.json();
      if (json.success) {
        setHistory(json.data);
      } else {
        console.error("Failed to fetch history");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshHistory: fetchHistory,
  }));

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History />
          Notification History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {loading && <LoadingCom />}
        {!loading && history.length === 0 && (
          <p>No notification history found.</p>
        )}
        {history.map((h, i) => (
          <div key={i} className="border-b pb-2">
            <p>{h.message}</p>
            <p className="text-xs text-gray-400">
              {new Date(h.date).toLocaleString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

NotificationHistory.displayName = "NotificationHistory";

export default NotificationHistory;
