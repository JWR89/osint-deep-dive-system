import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link2, MapPin, Users, Zap } from "lucide-react";

interface ComparisonProps {
  subject1: string;
  subject2: string;
  connectionStrength: number;
  sharedConnections: string[];
  sharedLocations: string[];
  sharedInterests: string[];
  timelineOverlap: string[];
  riskAssessment: string;
}

export default function CrossSubjectComparison({
  subject1,
  subject2,
  connectionStrength,
  sharedConnections,
  sharedLocations,
  sharedInterests,
  timelineOverlap,
  riskAssessment,
}: ComparisonProps) {
  const getRiskColor = (strength: number) => {
    if (strength > 70) return "text-red-400";
    if (strength > 40) return "text-yellow-400";
    return "text-green-400";
  };

  const getRiskBg = (strength: number) => {
    if (strength > 70) return "bg-red-900/20 border-red-800";
    if (strength > 40) return "bg-yellow-900/20 border-yellow-800";
    return "bg-green-900/20 border-green-800";
  };

  return (
    <div className="space-y-6">
      {/* Connection Strength Overview */}
      <Card className={`border ${getRiskBg(connectionStrength)}`}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className={`w-4 h-4 ${getRiskColor(connectionStrength)}`} />
            Connection Strength Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{subject1} ↔ {subject2}</span>
              <span className={`text-lg font-bold ${getRiskColor(connectionStrength)}`}>{connectionStrength}%</span>
            </div>
            <Progress value={connectionStrength} className="h-2" />
          </div>

          <div className={`p-3 rounded-lg border ${getRiskBg(connectionStrength)}`}>
            <p className={`text-sm ${getRiskColor(connectionStrength)}`}>{riskAssessment}</p>
          </div>
        </CardContent>
      </Card>

      {/* Shared Connections */}
      {sharedConnections.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Shared Connections ({sharedConnections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sharedConnections.map((connection, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-background/50">
                  <span className="text-primary">•</span>
                  <span className="text-sm">{connection}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shared Locations */}
      {sharedLocations.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Shared Locations ({sharedLocations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sharedLocations.map((location, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-background/50">
                  <span className="text-primary">📍</span>
                  <span className="text-sm">{location}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shared Interests / Platforms */}
      {sharedInterests.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Shared Platforms & Interests ({sharedInterests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sharedInterests.map((interest, idx) => (
                <Badge key={idx} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Overlap */}
      {timelineOverlap.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Timeline Overlap</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {timelineOverlap.map((overlap, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">→</span>
                  <span className="text-muted-foreground">{overlap}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {sharedConnections.length === 0 && sharedLocations.length === 0 && sharedInterests.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            No significant connections or overlaps detected between these subjects.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
