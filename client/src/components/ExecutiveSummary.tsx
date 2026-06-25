import { FileText } from "lucide-react";

export function ExecutiveSummary({ summary }: { summary: string | null }) {
  if (!summary) return <p className="text-sm text-muted-foreground">Executive summary not yet generated.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Intelligence Briefing</h4>
          <p className="text-xs text-muted-foreground">Top-level summary for decision makers</p>
        </div>
      </div>
      <div className="prose prose-sm prose-invert max-w-none">
        {summary.split("\n").filter(Boolean).map((paragraph, i) => (
          <p key={i} className="text-sm text-foreground/90 leading-relaxed mb-3">{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
