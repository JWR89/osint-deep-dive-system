import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Zap, Link2 } from "lucide-react";

interface MLInsight {
  type: "pattern" | "prediction" | "anomaly" | "relationship" | "temporal";
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  actionable: boolean;
  severity: "low" | "medium" | "high" | "critical";
}

interface InsightsTabProps {
  patterns: MLInsight[];
  anomalies: MLInsight[];
  predictions: string[];
  riskFactors: string[];
}

export default function InsightsTab({ patterns, anomalies, predictions, riskFactors }: InsightsTabProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/20 text-red-300 border-red-800";
      case "high":
        return "bg-orange-900/20 text-orange-300 border-orange-800";
      case "medium":
        return "bg-yellow-900/20 text-yellow-300 border-yellow-800";
      default:
        return "bg-blue-900/20 text-blue-300 border-blue-800";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-400";
    if (confidence >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div className="space-y-6">
      {/* Risk Factors Summary */}
      {riskFactors.length > 0 && (
        <Card className="border-red-900/30 bg-red-950/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Key Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {riskFactors.map((factor, idx) => (
                <Badge key={idx} variant="outline" className="bg-red-900/20 text-red-300 border-red-800">
                  {factor}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              Detected Patterns ({patterns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patterns.map((pattern, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(pattern.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{pattern.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${getConfidenceColor(pattern.confidence)}`}>
                      {pattern.confidence}% confidence
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{pattern.description}</p>
                {pattern.evidence.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">Evidence:</span> {pattern.evidence.slice(0, 2).join(" • ")}
                  </div>
                )}
                {pattern.actionable && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Actionable
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Anomalies Detected */}
      {anomalies.length > 0 && (
        <Card className="border-yellow-900/30 bg-yellow-950/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Anomalies & Red Flags ({anomalies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{anomaly.title}</h4>
                  <span className={`text-xs font-mono ${getConfidenceColor(anomaly.confidence)}`}>
                    {anomaly.confidence}% confidence
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{anomaly.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Behavioral Predictions */}
      {predictions.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Predicted Behaviors ({predictions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {predictions.map((prediction, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-muted-foreground">{prediction}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {patterns.length === 0 && anomalies.length === 0 && predictions.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            No significant patterns or anomalies detected in this investigation.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
