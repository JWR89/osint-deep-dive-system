import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  Download, ArrowLeft, Shield, Users, FileText,
  Scale, Heart, Briefcase, ExternalLink, Loader2,
  CheckCircle2, AlertTriangle, HelpCircle, Globe,
  Clock, Network, MapPin, Bell, Database, Skull
} from "lucide-react";
import { RiskScore } from "@/components/RiskScore";
import { Timeline } from "@/components/Timeline";
import { RelationshipGraph } from "@/components/RelationshipGraph";
import { GeolocationMap } from "@/components/GeolocationMap";
import { Annotations } from "@/components/Annotations";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  identity: { label: "Identity", icon: Shield, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  social_media: { label: "Social Media", icon: Users, color: "text-purple-400", bgColor: "bg-purple-400/10" },
  public_records: { label: "Public Records", icon: FileText, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  criminal: { label: "Criminal", icon: Scale, color: "text-red-400", bgColor: "bg-red-400/10" },
  dating: { label: "Dating", icon: Heart, color: "text-pink-400", bgColor: "bg-pink-400/10" },
  professional: { label: "Professional", icon: Briefcase, color: "text-amber-400", bgColor: "bg-amber-400/10" },
  breaches: { label: "Data Breaches", icon: Database, color: "text-orange-400", bgColor: "bg-orange-400/10" },
  dark_web: { label: "Dark Web", icon: Skull, color: "text-red-500", bgColor: "bg-red-500/10" },
};

const CONFIDENCE_CONFIG = {
  high: { label: "High", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
  medium: { label: "Medium", icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  low: { label: "Low", icon: HelpCircle, color: "text-red-400", bg: "bg-red-400/10" },
};

export default function InvestigationReport() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id || "0");
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = trpc.investigation.report.useQuery(
    { id },
    { enabled: id > 0 }
  );

  const exportMutation = trpc.investigation.exportPdf.useMutation({
    onSuccess: (result) => {
      window.open(result.url, "_blank");
      toast.success("Report exported successfully");
      setIsExporting(false);
    },
    onError: (error) => {
      toast.error(error.message || "Export failed");
      setIsExporting(false);
    },
  });

  const toggleMonitoringMutation = trpc.investigation.toggleMonitoring.useMutation({
    onSuccess: (result) => {
      toast.success(result.enabled ? "Monitoring enabled" : "Monitoring disabled");
    },
  });

  const handleExport = () => {
    setIsExporting(true);
    exportMutation.mutate({ id });
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { investigation, findings } = data;

  // Group findings by category
  const groupedFindings: Record<string, typeof findings> = {};
  for (const finding of findings) {
    if (!groupedFindings[finding.category]) {
      groupedFindings[finding.category] = [];
    }
    groupedFindings[finding.category].push(finding);
  }

  const subjectDetails = investigation.subjectDetails as Record<string, string> | null;
  const categories = Object.keys(CATEGORY_CONFIG);
  const riskBreakdown = investigation.riskBreakdown as any;
  const relationships = (investigation.relationships as any[]) || [];
  const timeline = (investigation.timeline as any[]) || [];
  const geolocations = (investigation.geolocations as any[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-foreground -ml-2 mb-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Intelligence Report
          </h1>
          <p className="text-muted-foreground">
            Subject: <span className="text-foreground font-medium">{investigation.subjectName}</span>
            {" "}&middot;{" "}
            {new Date(investigation.createdAt).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric"
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Monitoring Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Monitor</span>
            <Switch
              checked={!!investigation.monitoringEnabled}
              onCheckedChange={(checked) => toggleMonitoringMutation.mutate({ id, enabled: checked })}
            />
          </div>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Risk Score */}
      {investigation.riskScore !== null && investigation.riskScore !== undefined && (
        <RiskScore score={investigation.riskScore} breakdown={riskBreakdown} />
      )}

      {/* Subject Summary Card */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Subject Photo */}
            {investigation.imageUrl && (
              <div className="shrink-0">
                <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-border bg-muted">
                  <img
                    src={investigation.imageUrl}
                    alt={`Subject: ${investigation.subjectName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5 font-medium">Subject Photo</p>
              </div>
            )}
            {/* Details Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {subjectDetails && Object.entries(subjectDetails)
                  .filter(([key, value]) => value && !['additionalInfo', 'imageUrl', 'imageKey'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-foreground font-medium">{value as string}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border flex-wrap">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {findings.length} Findings
            </Badge>
            <Badge variant="secondary" className="bg-green-400/10 text-green-400">
              {findings.filter(f => f.confidence === "high").length} High Confidence
            </Badge>
            <Badge variant="secondary" className="bg-yellow-400/10 text-yellow-400">
              {findings.filter(f => f.confidence === "medium").length} Medium
            </Badge>
            <Badge variant="secondary" className="bg-red-400/10 text-red-400">
              {findings.filter(f => f.confidence === "low").length} Low
            </Badge>
            {findings.some(f => (f.corroborationCount || 1) > 1) && (
              <Badge variant="secondary" className="bg-cyan-400/10 text-cyan-400">
                {findings.filter(f => (f.corroborationCount || 1) > 1).length} Corroborated
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs: Timeline, Relationships, Geolocation, Notes */}
      <Tabs defaultValue="findings" className="space-y-4">
        <TabsList className="bg-card border border-border h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="findings" className="text-xs">
            <FileText className="w-3.5 h-3.5 mr-1" />
            Findings ({findings.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Timeline ({timeline.length})
          </TabsTrigger>
          <TabsTrigger value="relationships" className="text-xs">
            <Network className="w-3.5 h-3.5 mr-1" />
            Relationships ({relationships.length})
          </TabsTrigger>
          <TabsTrigger value="geolocation" className="text-xs">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            Geolocation ({geolocations.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">
            <Globe className="w-3.5 h-3.5 mr-1" />
            Case Notes
          </TabsTrigger>
        </TabsList>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          {/* Sub-tabs for categories */}
          <Tabs defaultValue="all_cat" className="space-y-4">
            <TabsList className="bg-muted/30 border border-border/50 h-auto flex-wrap gap-1 p-1">
              <TabsTrigger value="all_cat" className="text-xs">
                All ({findings.length})
              </TabsTrigger>
              {categories.map(cat => {
                const config = CATEGORY_CONFIG[cat];
                const count = groupedFindings[cat]?.length ?? 0;
                if (count === 0) return null;
                return (
                  <TabsTrigger key={cat} value={cat} className="text-xs">
                    {config.label} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* All findings */}
            <TabsContent value="all_cat" className="space-y-4">
              {categories.map(cat => {
                const config = CATEGORY_CONFIG[cat];
                const catFindings = groupedFindings[cat] || [];
                if (catFindings.length === 0) return null;
                const CategoryIcon = config.icon;

                return (
                  <Card key={cat} className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                          <CategoryIcon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        {config.label}
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {catFindings.length} findings
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {catFindings.map((finding, idx) => (
                        <FindingCard key={finding.id || idx} finding={finding} />
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Individual category tabs */}
            {categories.map(cat => {
              const config = CATEGORY_CONFIG[cat];
              const catFindings = groupedFindings[cat] || [];
              const CategoryIcon = config.icon;

              return (
                <TabsContent key={cat} value={cat} className="space-y-4">
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                          <CategoryIcon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        {config.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {catFindings.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-4 text-center">
                          No findings in this category.
                        </p>
                      ) : (
                        catFindings.map((finding, idx) => (
                          <FindingCard key={finding.id || idx} finding={finding} />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Chronological Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timeline} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                Link Analysis & Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RelationshipGraph relationships={relationships} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geolocation Tab */}
        <TabsContent value="geolocation">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Geolocation Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GeolocationMap locations={geolocations} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Case Notes Tab */}
        <TabsContent value="notes">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Case Notes & Annotations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Annotations investigationId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FindingCard({ finding }: { finding: any }) {
  const confidence = CONFIDENCE_CONFIG[finding.confidence as keyof typeof CONFIDENCE_CONFIG] || CONFIDENCE_CONFIG.medium;
  const ConfidenceIcon = confidence.icon;
  const corroboration = finding.corroborationCount || 1;

  return (
    <div className="p-4 rounded-lg border border-border/50 bg-background/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-semibold text-foreground leading-tight">{finding.title}</h4>
        <div className="flex items-center gap-2 shrink-0">
          {corroboration > 1 && (
            <Badge variant="secondary" className="text-[10px] bg-cyan-400/10 text-cyan-400">
              {corroboration}x corroborated
            </Badge>
          )}
          <Badge variant="outline" className={`text-[10px] ${confidence.color} border-current/20`}>
            <ConfidenceIcon className="h-3 w-3 mr-1" />
            {confidence.label}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{finding.content}</p>
      <Separator className="mb-3" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/70">Source:</span>
        <span>{finding.source}</span>
        {finding.sourceUrl && (
          <a
            href={finding.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline ml-auto"
          >
            <ExternalLink className="h-3 w-3" />
            View Source
          </a>
        )}
      </div>
    </div>
  );
}
