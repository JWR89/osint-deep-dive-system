import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  ArrowLeft, Shield, Users, FileText, Scale, Heart, Briefcase,
  Loader2, GitCompare, CheckCircle2, AlertTriangle, HelpCircle
} from "lucide-react";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  identity: { label: "Identity", icon: Shield, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  social_media: { label: "Social Media", icon: Users, color: "text-purple-400", bgColor: "bg-purple-400/10" },
  public_records: { label: "Public Records", icon: FileText, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  criminal: { label: "Criminal", icon: Scale, color: "text-red-400", bgColor: "bg-red-400/10" },
  dating: { label: "Dating", icon: Heart, color: "text-pink-400", bgColor: "bg-pink-400/10" },
  professional: { label: "Professional", icon: Briefcase, color: "text-amber-400", bgColor: "bg-amber-400/10" },
};

const CONFIDENCE_CONFIG = {
  high: { label: "High", icon: CheckCircle2, color: "text-green-400" },
  medium: { label: "Medium", icon: AlertTriangle, color: "text-yellow-400" },
  low: { label: "Low", icon: HelpCircle, color: "text-red-400" },
};

export default function Compare() {
  const [, setLocation] = useLocation();
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const { data: investigations, isLoading: listLoading } = trpc.investigation.list.useQuery();

  const completedInvestigations = investigations?.filter(i => i.status === "completed") ?? [];

  const { data: leftReport } = trpc.investigation.report.useQuery(
    { id: parseInt(leftId) },
    { enabled: !!leftId }
  );

  const { data: rightReport } = trpc.investigation.report.useQuery(
    { id: parseInt(rightId) },
    { enabled: !!rightId }
  );

  const categories = Object.keys(CATEGORY_CONFIG);

  return (
    <div className="space-y-6">
      {/* Header */}
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
          Compare Reports
        </h1>
        <p className="text-muted-foreground">
          Select two completed investigations to compare findings side by side.
        </p>
      </div>

      {/* Selection */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Report A</label>
              <Select value={leftId} onValueChange={setLeftId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select an investigation..." />
                </SelectTrigger>
                <SelectContent>
                  {completedInvestigations
                    .filter(inv => inv.id.toString() !== rightId)
                    .map(inv => (
                    <SelectItem key={inv.id} value={inv.id.toString()}>
                      {inv.subjectName} — {new Date(inv.createdAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Report B</label>
              <Select value={rightId} onValueChange={setRightId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select an investigation..." />
                </SelectTrigger>
                <SelectContent>
                  {completedInvestigations
                    .filter(inv => inv.id.toString() !== leftId)
                    .map(inv => (
                    <SelectItem key={inv.id} value={inv.id.toString()}>
                      {inv.subjectName} — {new Date(inv.createdAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison */}
      {listLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : leftId && rightId && leftReport && rightReport ? (
        <div className="space-y-6">
          {/* Summary comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="font-semibold text-foreground text-lg">{leftReport.investigation.subjectName}</p>
                <p className="text-sm text-muted-foreground">
                  {leftReport.findings.length} findings
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-green-400/10 text-green-400 text-xs">
                    {leftReport.findings.filter(f => f.confidence === "high").length} High
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-400/10 text-yellow-400 text-xs">
                    {leftReport.findings.filter(f => f.confidence === "medium").length} Med
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="font-semibold text-foreground text-lg">{rightReport.investigation.subjectName}</p>
                <p className="text-sm text-muted-foreground">
                  {rightReport.findings.length} findings
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-green-400/10 text-green-400 text-xs">
                    {rightReport.findings.filter(f => f.confidence === "high").length} High
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-400/10 text-yellow-400 text-xs">
                    {rightReport.findings.filter(f => f.confidence === "medium").length} Med
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category-by-category comparison */}
          {categories.map(cat => {
            const config = CATEGORY_CONFIG[cat];
            const CategoryIcon = config.icon;
            const leftFindings = leftReport.findings.filter(f => f.category === cat);
            const rightFindings = rightReport.findings.filter(f => f.category === cat);

            return (
              <Card key={cat} className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <CategoryIcon className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>
                    {config.label}
                    <span className="ml-auto text-xs text-muted-foreground font-normal">
                      {leftFindings.length} vs {rightFindings.length} findings
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left column */}
                    <div className="space-y-2">
                      {leftFindings.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No findings</p>
                      ) : (
                        leftFindings.map((f, idx) => {
                          const conf = CONFIDENCE_CONFIG[f.confidence as keyof typeof CONFIDENCE_CONFIG] || CONFIDENCE_CONFIG.medium;
                          return (
                            <div key={idx} className="p-3 rounded-md border border-border/50 bg-background/50">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-foreground leading-tight">{f.title}</p>
                                <conf.icon className={`h-3 w-3 shrink-0 ${conf.color}`} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.content}</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">Source: {f.source}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {/* Right column */}
                    <div className="space-y-2">
                      {rightFindings.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No findings</p>
                      ) : (
                        rightFindings.map((f, idx) => {
                          const conf = CONFIDENCE_CONFIG[f.confidence as keyof typeof CONFIDENCE_CONFIG] || CONFIDENCE_CONFIG.medium;
                          return (
                            <div key={idx} className="p-3 rounded-md border border-border/50 bg-background/50">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-foreground leading-tight">{f.title}</p>
                                <conf.icon className={`h-3 w-3 shrink-0 ${conf.color}`} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.content}</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">Source: {f.source}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (leftId && rightId) && (!leftReport || !rightReport) ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-3 text-sm text-muted-foreground">Loading reports...</span>
        </div>
      ) : (leftId || rightId) && !(leftId && rightId) ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Select the second investigation to begin comparison.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <GitCompare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {completedInvestigations.length < 2
                ? "You need at least 2 completed investigations to compare reports."
                : "Select two investigations above to begin comparison."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
