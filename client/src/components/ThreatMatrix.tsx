import { Shield, DollarSign, Eye, Plane, AlertTriangle } from "lucide-react";

interface ThreatVector {
  score: number;
  reasoning: string;
}

interface ThreatMatrixData {
  physicalThreat: ThreatVector;
  financialRisk: ThreatVector;
  reputationalRisk: ThreatVector;
  flightRisk: ThreatVector;
  deceptionLevel: ThreatVector;
}

export function ThreatMatrix({ data }: { data: ThreatMatrixData | null }) {
  if (!data) return <p className="text-sm text-muted-foreground">Threat matrix not yet computed.</p>;

  const vectors = [
    { key: "physicalThreat", label: "Physical Threat", icon: Shield, data: data.physicalThreat },
    { key: "financialRisk", label: "Financial Risk", icon: DollarSign, data: data.financialRisk },
    { key: "reputationalRisk", label: "Reputational Risk", icon: Eye, data: data.reputationalRisk },
    { key: "flightRisk", label: "Flight Risk", icon: Plane, data: data.flightRisk },
    { key: "deceptionLevel", label: "Deception Level", icon: AlertTriangle, data: data.deceptionLevel },
  ];

  const getColor = (score: number) => {
    if (score >= 70) return "text-red-400 bg-red-400";
    if (score >= 40) return "text-amber-400 bg-amber-400";
    return "text-emerald-400 bg-emerald-400";
  };

  return (
    <div className="space-y-4">
      {vectors.map(({ key, label, icon: Icon, data: v }) => {
        if (!v) return null;
        const color = getColor(v.score);
        const [textColor, bgColor] = color.split(" ");
        return (
          <div key={key} className="p-3 rounded-lg border border-border/50 bg-background/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${textColor}`} />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <span className={`text-sm font-bold ${textColor}`}>{v.score}/100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${bgColor} transition-all duration-500`}
                style={{ width: `${v.score}%`, opacity: 0.7 }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{v.reasoning}</p>
          </div>
        );
      })}
    </div>
  );
}
