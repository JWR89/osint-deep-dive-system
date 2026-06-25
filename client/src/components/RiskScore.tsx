import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface RiskBreakdown {
  identity: number;
  socialMedia: number;
  publicRecords: number;
  criminal: number;
  dating: number;
  professional: number;
  breaches: number;
  darkWeb: number;
}

function getRiskLevel(score: number): { label: string; color: string; bgColor: string; icon: any } {
  if (score >= 75) return { label: "Critical Exposure", color: "text-red-400", bgColor: "bg-red-400", icon: AlertTriangle };
  if (score >= 50) return { label: "High Exposure", color: "text-orange-400", bgColor: "bg-orange-400", icon: AlertTriangle };
  if (score >= 25) return { label: "Moderate Exposure", color: "text-yellow-400", bgColor: "bg-yellow-400", icon: Shield };
  return { label: "Low Exposure", color: "text-emerald-400", bgColor: "bg-emerald-400", icon: CheckCircle };
}

const categoryLabels: Record<string, string> = {
  identity: "Identity",
  socialMedia: "Social Media",
  publicRecords: "Public Records",
  criminal: "Criminal",
  dating: "Dating",
  professional: "Professional",
  breaches: "Data Breaches",
  darkWeb: "Dark Web",
};

const categoryColors: Record<string, string> = {
  identity: "bg-blue-400",
  socialMedia: "bg-purple-400",
  publicRecords: "bg-emerald-400",
  criminal: "bg-red-400",
  dating: "bg-pink-400",
  professional: "bg-amber-400",
  breaches: "bg-orange-400",
  darkWeb: "bg-red-500",
};

export function RiskScore({ score, breakdown }: { score: number; breakdown: RiskBreakdown | null }) {
  const risk = getRiskLevel(score);
  const Icon = risk.icon;

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* Score Circle */}
          <div className="relative shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="50" cy="50" r="42"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(score / 100) * 264} 264`}
                strokeLinecap="round"
                className={risk.color}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${risk.color}`}>{score}</span>
              <span className="text-[9px] text-muted-foreground">/100</span>
            </div>
          </div>

          {/* Risk Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${risk.color}`} />
              <h3 className={`text-lg font-bold ${risk.color}`}>{risk.label}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This score represents the subject's overall digital exposure level based on findings across {breakdown ? Object.values(breakdown).filter(v => v > 0).length : 0} active categories.
            </p>
          </div>
        </div>

        {/* Breakdown Bars */}
        {breakdown && (
          <div className="mt-6 space-y-2.5">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-24 shrink-0 text-right">
                  {categoryLabels[key] || key}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${categoryColors[key] || "bg-gray-400"}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 font-mono">{value}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
