import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCircle, Loader2, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

export default function Alerts() {
  const utils = trpc.useUtils();
  const { data: alerts, isLoading } = trpc.alerts.list.useQuery();

  const markReadMutation = trpc.alerts.markRead.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
      utils.alerts.unreadCount.invalidate();
    },
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "bulk_complete": return CheckCircle;
      case "monitoring_update": return AlertTriangle;
      default: return Info;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "bulk_complete": return "text-emerald-400";
      case "monitoring_update": return "text-amber-400";
      default: return "text-blue-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Alerts & Notifications</h1>
          <p className="text-muted-foreground mt-1">Monitoring updates and system notifications.</p>
        </div>
        {alerts && alerts.filter(a => !a.isRead).length > 0 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {alerts.filter(a => !a.isRead).length} Unread
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !alerts || alerts.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No alerts yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Enable monitoring on investigations to receive alerts when new information surfaces.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const Icon = getAlertIcon(alert.type);
            const color = getAlertColor(alert.type);
            return (
              <Card
                key={alert.id}
                className={`border-border/50 transition-colors ${!alert.isRead ? "bg-primary/5 border-primary/20" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!alert.isRead ? "bg-primary/10" : "bg-muted/30"}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!alert.isRead ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {alert.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 shrink-0"
                        onClick={() => markReadMutation.mutate({ id: alert.id })}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
