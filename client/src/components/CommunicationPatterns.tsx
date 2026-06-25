import { MessageSquare, Users, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommData {
  primaryPlatforms?: string[];
  activityFrequency?: string;
  interactionStyle?: string;
  topContacts?: string[];
  heatmap?: { morning: number; afternoon: number; evening: number; night: number };
}

export function CommunicationPatterns({ data }: { data: CommData | null }) {
  if (!data) return <p className="text-sm text-muted-foreground">Communication patterns not yet analyzed.</p>;

  const heatmap = data.heatmap;
  const maxHeat = heatmap ? Math.max(heatmap.morning, heatmap.afternoon, heatmap.evening, heatmap.night, 1) : 1;

  return (
    <div className="space-y-5">
      {data.primaryPlatforms && data.primaryPlatforms.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Primary Platforms</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.primaryPlatforms.map((p, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.activityFrequency && (
        <div>
          <p className="text-xs font-medium text-foreground mb-1">Activity Frequency</p>
          <p className="text-sm text-muted-foreground">{data.activityFrequency}</p>
        </div>
      )}

      {data.interactionStyle && (
        <div>
          <p className="text-xs font-medium text-foreground mb-1">Interaction Style</p>
          <p className="text-sm text-muted-foreground">{data.interactionStyle}</p>
        </div>
      )}

      {data.topContacts && data.topContacts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">Top Contacts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.topContacts.map((c, i) => (
              <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
            ))}
          </div>
        </div>
      )}

      {heatmap && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">Activity Heatmap</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["morning", "afternoon", "evening", "night"] as const).map((period) => {
              const val = heatmap[period] || 0;
              const intensity = val / maxHeat;
              return (
                <div key={period} className="text-center">
                  <div
                    className="h-12 rounded-lg border border-border/50 flex items-center justify-center mb-1 transition-colors"
                    style={{ backgroundColor: `rgba(59, 130, 246, ${intensity * 0.6})` }}
                  >
                    <span className="text-xs font-bold text-foreground">{val}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground capitalize">{period}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
