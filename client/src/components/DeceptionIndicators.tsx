import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Indicator {
  indicator: string;
  sources: string[];
  severity: "high" | "medium" | "low";
}

export function DeceptionIndicators({ data }: { data: Indicator[] | null }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-400">
        <Info className="h-4 w-4" />
        <span>No deception indicators detected. Data appears consistent across sources.</span>
      </div>
    );
  }

  const severityConfig = {
    high: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
    medium: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
    low: { icon: Info, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  };

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const config = severityConfig[item.severity] || severityConfig.medium;
        const Icon = config.icon;
        return (
          <div key={i} className={`p-3 rounded-lg border ${config.border} ${config.bg}`}>
            <div className="flex items-start gap-2">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">{item.indicator}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.sources.map((src, j) => (
                    <Badge key={j} variant="outline" className="text-[10px]">{src}</Badge>
                  ))}
                </div>
              </div>
              <Badge variant="secondary" className={`text-[10px] ${config.color} shrink-0`}>
                {item.severity.toUpperCase()}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
