import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Briefcase, MapPin, Shield, Heart, User, AlertTriangle, Globe } from "lucide-react";

interface TimelineEvent {
  date: string;
  title: string;
  category: string;
  content: string;
  source: string;
}

const categoryConfig: Record<string, { icon: any; color: string; label: string }> = {
  identity: { icon: User, color: "text-blue-400", label: "Identity" },
  social_media: { icon: Globe, color: "text-purple-400", label: "Social Media" },
  public_records: { icon: MapPin, color: "text-emerald-400", label: "Public Records" },
  criminal: { icon: AlertTriangle, color: "text-red-400", label: "Criminal" },
  dating: { icon: Heart, color: "text-pink-400", label: "Dating" },
  professional: { icon: Briefcase, color: "text-amber-400", label: "Professional" },
  breaches: { icon: Shield, color: "text-orange-400", label: "Breaches" },
  dark_web: { icon: AlertTriangle, color: "text-red-500", label: "Dark Web" },
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No timeline events available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {events.map((event, idx) => {
          const config = categoryConfig[event.category] || categoryConfig.identity;
          const Icon = config.icon;
          const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          return (
            <div key={idx} className="relative flex gap-4 pl-2">
              {/* Timeline dot */}
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>

              {/* Content */}
              <Card className="flex-1 border-border/50 hover:border-border transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">{formattedDate}</span>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${config.color} bg-transparent border border-current/20`}>
                          {config.label}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{event.content}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">Source: {event.source}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
