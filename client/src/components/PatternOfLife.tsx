import { Clock, MapPin, Activity, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PatternData {
  dailyRoutines?: string;
  activityWindows?: string[];
  frequentLocations?: string[];
  lifestyleIndicators?: string[];
  behavioralNotes?: string;
}

export function PatternOfLife({ data }: { data: PatternData | null }) {
  if (!data) return <p className="text-sm text-muted-foreground">Pattern of life analysis not yet computed.</p>;

  return (
    <div className="space-y-5">
      {data.dailyRoutines && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Daily Routines</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.dailyRoutines}</p>
        </div>
      )}

      {data.activityWindows && data.activityWindows.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-foreground">Activity Windows</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.activityWindows.map((w, i) => (
              <Badge key={i} variant="secondary" className="bg-cyan-400/10 text-cyan-400 text-xs">{w}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.frequentLocations && data.frequentLocations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">Frequent Locations</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.frequentLocations.map((loc, i) => (
              <Badge key={i} variant="outline" className="text-xs">{loc}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.lifestyleIndicators && data.lifestyleIndicators.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-foreground">Lifestyle Indicators</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.lifestyleIndicators.map((ind, i) => (
              <Badge key={i} variant="secondary" className="bg-violet-400/10 text-violet-400 text-xs">{ind}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.behavioralNotes && (
        <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
          <p className="text-xs font-medium text-foreground mb-1">Behavioral Notes</p>
          <p className="text-xs text-muted-foreground">{data.behavioralNotes}</p>
        </div>
      )}
    </div>
  );
}
