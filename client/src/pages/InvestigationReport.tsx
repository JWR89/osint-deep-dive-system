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
  Clock, Network, MapPin, Bell, Database, Skull,
  DollarSign, Car, Fingerprint, UserCheck, Newspaper,
  Server, Gavel, GraduationCap, Brain, MessageSquare, Eye
} from "lucide-react";
import { RiskScore } from "@/components/RiskScore";
import { Timeline } from "@/components/Timeline";
import { RelationshipGraph } from "@/components/RelationshipGraph";
import { GeolocationMap } from "@/components/GeolocationMap";
import { Annotations } from "@/components/Annotations";
import { ThreatMatrix } from "@/components/ThreatMatrix";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { PatternOfLife } from "@/components/PatternOfLife";
import { DeceptionIndicators } from "@/components/DeceptionIndicators";
import { CommunicationPatterns } from "@/components/CommunicationPatterns";
import { AliasResolution } from "@/components/AliasResolution";
import { SourceReliabilityBadge } from "@/components/SourceReliabilityBadge";
import PsychologicalProfileComponent from "@/components/PsychologicalProfile";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  identity: { label: "Identity", icon: Shield, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  social_media: { label: "Social Media", icon: Users, color: "text-purple-400", bgColor: "bg-purple-400/10" },
  public_records: { label: "Public Records", icon: FileText, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  criminal: { label: "Criminal", icon: Scale, color: "text-red-400", bgColor: "bg-red-400/10" },
  dating: { label: "Dating", icon: Heart, color: "text-pink-400", bgColor: "bg-pink-400/10" },
  professional: { label: "Professional", icon: Briefcase, color: "text-amber-400", bgColor: "bg-amber-400/10" },
  breaches: { label: "Data Breaches", icon: Database, color: "text-orange-400", bgColor: "bg-orange-400/10" },
  dark_web: { label: "Dark Web", icon: Skull, color: "text-red-500", bgColor: "bg-red-500/10" },
  financial: { label: "Financial Footprint", icon: DollarSign, color: "text-green-400", bgColor: "bg-green-400/10" },
  vehicles_assets: { label: "Vehicles & Assets", icon: Car, color: "text-sky-400", bgColor: "bg-sky-400/10" },
  digital_fingerprint: { label: "Digital Fingerprinting", icon: Fingerprint, color: "text-violet-400", bgColor: "bg-violet-400/10" },
  aliases: { label: "Aliases & Identity", icon: UserCheck, color: "text-indigo-400", bgColor: "bg-indigo-400/10" },
  media_sentiment: { label: "Media & Sentiment", icon: Newspaper, color: "text-teal-400", bgColor: "bg-teal-400/10" },
  domain_infrastructure: { label: "Domain & Infrastructure", icon: Server, color: "text-slate-400", bgColor: "bg-slate-400/10" },
  court_documents: { label: "Court Documents", icon: Gavel, color: "text-rose-400", bgColor: "bg-rose-400/10" },
  professional_verification: { label: "Professional Verification", icon: GraduationCap, color: "text-lime-400", bgColor: "bg-lime-400/10" },
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
  const groupedFindings: Record<string, typeof findings> = {};
  for (const finding of findings) {
    if (!groupedFindings[finding.category]) groupedFindings[finding.category] = [];
    groupedFindings[finding.category].push(finding);
  }

  const subjectDetails = investigation.subjectDetails as Record<string, string> | null;
  const categories = Object.keys(CATEGORY_CONFIG);
  const riskBreakdown = investigation.riskBreakdown as any;
  const relationships = (investigation.relationships as any[]) || [];
  const timeline = (investigation.timeline as any[]) || [];
  const geolocations = (investigation.geolocations as any[]) || [];
  const threatMatrix = (investigation as any).threatMatrix || null;
  const executiveSummary = (investigation as any).executiveSummary || null;
  const patternOfLife = (investigation as any).patternOfLife || null;
  const deceptionIndicators = (investigation as any).deceptionIndicators || null;
  const communicationPatterns = (investigation as any).communicationPatterns || null;
  const aliases = (investigation as any).aliases || null;
  const networkAnalysis = (investigation as any).networkAnalysis || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-muted-foreground hover:text-foreground -ml-2 mb-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Intelligence Report
          </h1>
          <p className="text-muted-foreground">
            Subject: <span className="text-foreground font-medium">{investigation.subjectName}</span>
            {" "}&middot;{" "}
            {new Date(investigation.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Monitor</span>
            <Switch checked={!!investigation.monitoringEnabled} onCheckedChange={(checked) => toggleMonitoringMutation.mutate({ id, enabled: checked })} />
          </div>
          <Button onClick={handleExport} disabled={isExporting} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold px-6 transition-all duration-200 active:scale-[0.97]">
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {isExporting ? "Generating PDF..." : "Download PDF Report"}
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      {executiveSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Executive Summary — Intelligence Briefing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExecutiveSummary summary={executiveSummary} />
          </CardContent>
        </Card>
      )}

      {/* Risk Score */}
      {investigation.riskScore !== null && investigation.riskScore !== undefined && (
        <RiskScore score={investigation.riskScore} breakdown={riskBreakdown} />
      )}

      {/* Subject Summary Card */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {investigation.imageUrl && (
              <div className="shrink-0">
                <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-border bg-muted">
                  <img src={investigation.imageUrl} alt={`Subject: ${investigation.subjectName}`} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5 font-medium">Subject Photo</p>
              </div>
            )}
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {subjectDetails && Object.entries(subjectDetails)
                  .filter(([key, value]) => value && !['additionalInfo', 'imageUrl', 'imageKey'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-sm text-foreground font-medium">{value as string}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border flex-wrap">
            <Badge variant="secondary" className="bg-primary/10 text-primary">{findings.length} Findings</Badge>
            <Badge variant="secondary" className="bg-green-400/10 text-green-400">{findings.filter(f => f.confidence === "high").length} High Confidence</Badge>
            <Badge variant="secondary" className="bg-yellow-400/10 text-yellow-400">{findings.filter(f => f.confidence === "medium").length} Medium</Badge>
            <Badge variant="secondary" className="bg-red-400/10 text-red-400">{findings.filter(f => f.confidence === "low").length} Low</Badge>
            <Badge variant="secondary" className="bg-cyan-400/10 text-cyan-400">{Object.keys(groupedFindings).length} Categories</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Intelligence Tabs */}
      <Tabs defaultValue="findings" className="space-y-4">
        <TabsList className="bg-card border border-border h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="findings" className="text-xs"><FileText className="w-3.5 h-3.5 mr-1" />Findings ({findings.length})</TabsTrigger>
          <TabsTrigger value="intelligence" className="text-xs"><Brain className="w-3.5 h-3.5 mr-1" />Intelligence</TabsTrigger>
          <TabsTrigger value="psychology" className="text-xs"><MessageSquare className="w-3.5 h-3.5 mr-1" />Psychology</TabsTrigger>
          <TabsTrigger value="threat" className="text-xs"><Shield className="w-3.5 h-3.5 mr-1" />Threat Matrix</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs"><Clock className="w-3.5 h-3.5 mr-1" />Timeline ({timeline.length})</TabsTrigger>
          <TabsTrigger value="relationships" className="text-xs"><Network className="w-3.5 h-3.5 mr-1" />Network</TabsTrigger>
          <TabsTrigger value="geolocation" className="text-xs"><MapPin className="w-3.5 h-3.5 mr-1" />Geolocation</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs"><Globe className="w-3.5 h-3.5 mr-1" />Case Notes</TabsTrigger>
        </TabsList>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          <Tabs defaultValue="all_cat" className="space-y-4">
            <TabsList className="bg-muted/30 border border-border/50 h-auto flex-wrap gap-1 p-1">
              <TabsTrigger value="all_cat" className="text-xs">All ({findings.length})</TabsTrigger>
              {categories.map(cat => {
                const config = CATEGORY_CONFIG[cat];
                const count = groupedFindings[cat]?.length ?? 0;
                if (count === 0) return null;
                return <TabsTrigger key={cat} value={cat} className="text-xs">{config.label} ({count})</TabsTrigger>;
              })}
            </TabsList>

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
                        <Badge variant="secondary" className="ml-auto text-xs">{catFindings.length} findings</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {catFindings.map((finding, idx) => <FindingCard key={finding.id || idx} finding={finding} />)}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {categories.map(cat => {
              const config = CATEGORY_CONFIG[cat];
              const catFindings = groupedFindings[cat] || [];
              const CategoryIcon = config.icon;
              return (
                <TabsContent key={cat} value={cat} className="space-y-4">
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center`}><CategoryIcon className={`h-4 w-4 ${config.color}`} /></div>
                        {config.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {catFindings.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-4 text-center">No findings in this category.</p>
                      ) : catFindings.map((finding, idx) => <FindingCard key={finding.id || idx} finding={finding} />)}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>

        {/* Intelligence Analysis Tab */}
        <TabsContent value="intelligence" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Eye className="w-4 h-4 text-violet-400" />Pattern of Life</CardTitle>
              </CardHeader>
              <CardContent><PatternOfLife data={patternOfLife} /></CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" />Communication Patterns</CardTitle>
              </CardHeader>
              <CardContent><CommunicationPatterns data={communicationPatterns} /></CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" />Deception Indicators</CardTitle>
              </CardHeader>
              <CardContent><DeceptionIndicators data={deceptionIndicators} /></CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><UserCheck className="w-4 h-4 text-indigo-400" />Alias & Identity Resolution</CardTitle>
              </CardHeader>
              <CardContent><AliasResolution data={aliases} /></CardContent>
            </Card>
          </div>
          {networkAnalysis && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Network className="w-4 h-4 text-primary" />Network Analysis (2nd & 3rd Degree)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {networkAnalysis.innerCircle?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Inner Circle</p>
                      <div className="space-y-1">{networkAnalysis.innerCircle.map((p: string, i: number) => <Badge key={i} variant="outline" className="text-xs mr-1 mb-1">{p}</Badge>)}</div>
                    </div>
                  )}
                  {networkAnalysis.secondDegree?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">2nd Degree</p>
                      <div className="space-y-1">{networkAnalysis.secondDegree.map((p: string, i: number) => <Badge key={i} variant="secondary" className="text-xs mr-1 mb-1">{p}</Badge>)}</div>
                    </div>
                  )}
                  {networkAnalysis.organizations?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Organizations</p>
                      <div className="space-y-1">{networkAnalysis.organizations.map((o: string, i: number) => <Badge key={i} variant="secondary" className="text-xs bg-amber-400/10 text-amber-400 mr-1 mb-1">{o}</Badge>)}</div>
                    </div>
                  )}
                </div>
                {networkAnalysis.hiddenConnections && (
                  <div className="mt-4 p-3 rounded-lg border border-amber-400/30 bg-amber-400/5">
                    <p className="text-xs font-medium text-amber-400 mb-1">Hidden Connections</p>
                    <p className="text-xs text-muted-foreground">{networkAnalysis.hiddenConnections}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Psychology Tab */}
        <TabsContent value="psychology">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" />Psychological Profile Analysis</CardTitle></CardHeader>
            <CardContent>{investigation.psychologicalProfile ? <PsychologicalProfileComponent profile={investigation.psychologicalProfile} /> : <p className="text-sm text-muted-foreground italic">No psychological profile data available. Run investigation with social media scraping enabled.</p>}</CardContent>
          </Card>
        </TabsContent>

        {/* Threat Assessment Tab */}
        <TabsContent value="threat">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-red-400" />Threat Assessment Matrix</CardTitle>
            </CardHeader>
            <CardContent><ThreatMatrix data={threatMatrix} /></CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Chronological Timeline</CardTitle></CardHeader>
            <CardContent><Timeline events={timeline} /></CardContent>
          </Card>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Network className="w-4 h-4 text-primary" />Link Analysis & Connections</CardTitle></CardHeader>
            <CardContent><RelationshipGraph relationships={relationships} /></CardContent>
          </Card>
        </TabsContent>

        {/* Geolocation Tab */}
        <TabsContent value="geolocation">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Geolocation Intelligence</CardTitle></CardHeader>
            <CardContent><GeolocationMap locations={geolocations} /></CardContent>
          </Card>
        </TabsContent>

        {/* Case Notes Tab */}
        <TabsContent value="notes">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Case Notes & Annotations</CardTitle></CardHeader>
            <CardContent><Annotations investigationId={id} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky bottom export bar */}
      <div className="sticky bottom-0 left-0 right-0 z-10 mt-8">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">Full Intelligence Report Ready</p>
              <p className="text-xs text-muted-foreground">{findings.length} findings &middot; {Object.keys(groupedFindings).filter(k => (groupedFindings[k]?.length || 0) > 0).length} categories &middot; CONFIDENTIAL watermark</p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={isExporting} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold px-6 transition-all duration-200 active:scale-[0.97]">
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {isExporting ? "Generating..." : "Download PDF Report"}
          </Button>
        </div>
      </div>
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
          <SourceReliabilityBadge rating={finding.sourceReliability} />
          {corroboration > 1 && (
            <Badge variant="secondary" className="text-[10px] bg-cyan-400/10 text-cyan-400">{corroboration}x corroborated</Badge>
          )}
          <Badge variant="outline" className={`text-[10px] ${confidence.color} border-current/20`}>
            <ConfidenceIcon className="h-3 w-3 mr-1" />{confidence.label}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{finding.content}</p>
      <Separator className="mb-3" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/70">Source:</span>
        <span>{finding.source}</span>
        {finding.sourceUrl && (
          <a href={finding.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline ml-auto">
            <ExternalLink className="h-3 w-3" />View Source
          </a>
        )}
      </div>
    </div>
  );
}
