import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import {
  Loader2, CheckCircle2, Circle, Shield, Users, FileText,
  Scale, Heart, Briefcase, AlertCircle, Database, Skull
} from "lucide-react";

const CATEGORY_CONFIG = {
  identity: { label: "Identity", icon: Shield, color: "text-blue-400" },
  social_media: { label: "Social Media", icon: Users, color: "text-purple-400" },
  public_records: { label: "Public Records", icon: FileText, color: "text-emerald-400" },
  criminal: { label: "Criminal", icon: Scale, color: "text-red-400" },
  dating: { label: "Dating", icon: Heart, color: "text-pink-400" },
  professional: { label: "Professional", icon: Briefcase, color: "text-amber-400" },
  breaches: { label: "Data Breaches", icon: Database, color: "text-orange-400" },
  dark_web: { label: "Dark Web", icon: Skull, color: "text-red-500" },
};

const DATA_SOURCES = [
  { name: "Identity Verification & Cross-Reference", category: "identity" },
  { name: "Facebook Profile Search", category: "social_media" },
  { name: "Instagram Discovery", category: "social_media" },
  { name: "Twitter/X Intelligence", category: "social_media" },
  { name: "LinkedIn Professional Network", category: "social_media" },
  { name: "TikTok Presence", category: "social_media" },
  { name: "YouTube Channel Discovery", category: "social_media" },
  { name: "Username Search (400+ Platforms)", category: "social_media" },
  { name: "Address History & Property Records", category: "public_records" },
  { name: "Phone Number Registry", category: "public_records" },
  { name: "Relatives & Known Associates", category: "public_records" },
  { name: "Voter Registration & Public Filings", category: "public_records" },
  { name: "Criminal Court Records", category: "criminal" },
  { name: "Arrest Records & Mugshots", category: "criminal" },
  { name: "Sex Offender Registry", category: "criminal" },
  { name: "Warrant & Watch List Check", category: "criminal" },
  { name: "Dating Platform Detection", category: "dating" },
  { name: "Breach Data Analysis", category: "dating" },
  { name: "Employment & Business Records", category: "professional" },
  { name: "Professional Licenses & Certifications", category: "professional" },
  { name: "Domain & Website Ownership", category: "professional" },
  { name: "HaveIBeenPwned Database", category: "breaches" },
  { name: "Credential Leak Archives", category: "breaches" },
  { name: "Data Breach Aggregators", category: "breaches" },
  { name: "Dark Web Forum Mentions", category: "dark_web" },
  { name: "Paste Site Scanning", category: "dark_web" },
  { name: "Tor Hidden Service Indexing", category: "dark_web" },
];

export default function InvestigationProgress() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id || "0");

  const { data: investigation, refetch } = trpc.investigation.status.useQuery(
    { id },
    { enabled: id > 0, refetchInterval: 2000 }
  );

  useEffect(() => {
    if (investigation?.status === "completed") {
      const timer = setTimeout(() => {
        setLocation(`/investigation/${id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [investigation?.status, id, setLocation]);

  if (!investigation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentSource = investigation.currentSource;
  const progress = investigation.progress || 0;
  const isCompleted = investigation.status === "completed";
  const isFailed = investigation.status === "failed";

  // Determine which sources are done based on progress
  const completedCount = Math.floor((progress / 100) * DATA_SOURCES.length);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          {isCompleted ? "Investigation Complete" : isFailed ? "Investigation Failed" : "Investigation in Progress"}
        </h1>
        <p className="text-muted-foreground">
          {isCompleted
            ? `Deep dive on "${investigation.subjectName}" is complete.`
            : isFailed
            ? `Investigation on "${investigation.subjectName}" encountered an error.`
            : `Conducting deep dive on "${investigation.subjectName}"...`
          }
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <span className="text-sm font-mono text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {currentSource && !isCompleted && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Currently querying: <span className="text-foreground font-medium">{currentSource}</span></span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>All sources queried successfully. Redirecting to report...</span>
            </div>
          )}
          {isFailed && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Investigation encountered an error. Some findings may still be available.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Sources Status */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Data Sources</h3>
          <div className="space-y-6">
            {Object.entries(CATEGORY_CONFIG).map(([catKey, catConfig]) => {
              const CategoryIcon = catConfig.icon;
              const categorySources = DATA_SOURCES.filter(s => s.category === catKey);

              return (
                <div key={catKey} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIcon className={`h-4 w-4 ${catConfig.color}`} />
                    <span className="text-sm font-medium text-foreground">{catConfig.label}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 pl-6">
                    {categorySources.map((source) => {
                      const sourceIndex = DATA_SOURCES.indexOf(source);
                      const isDone = sourceIndex < completedCount;
                      const isActive = currentSource === source.name;

                      return (
                        <div
                          key={source.name}
                          className={`flex items-center gap-2 py-1.5 px-3 rounded-md text-sm transition-all ${
                            isActive ? "bg-primary/10 border border-primary/20" : ""
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                          ) : isActive ? (
                            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          )}
                          <span className={`${isDone ? "text-muted-foreground" : isActive ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>
                            {source.name}
                          </span>
                          {isActive && (
                            <span className="ml-auto text-xs text-primary animate-pulse-glow">QUERYING</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {(isCompleted || isFailed) && (
        <div className="flex gap-3">
          <Button onClick={() => setLocation(`/investigation/${id}`)} className="flex-1">
            View Report
          </Button>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
