import { UserCheck, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AliasData {
  alias: string;
  platform: string;
  confidence: "high" | "medium" | "low";
  evidence: string;
}

export function AliasResolution({ data }: { data: AliasData[] | null }) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground">No alternate identities detected.</p>;

  const confColors = {
    high: "text-emerald-400 bg-emerald-400/10",
    medium: "text-amber-400 bg-amber-400/10",
    low: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="space-y-3">
      {data.map((alias, i) => (
        <div key={i} className="p-3 rounded-lg border border-border/50 bg-background/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground font-mono">{alias.alias}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{alias.platform}</Badge>
              <Badge className={`text-[10px] ${confColors[alias.confidence]}`}>{alias.confidence}</Badge>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Link2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{alias.evidence}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
