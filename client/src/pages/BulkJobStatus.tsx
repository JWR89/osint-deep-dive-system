import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function BulkJobStatus() {
  const [, params] = useRoute("/bulk/:id");
  const [, navigate] = useLocation();
  const jobId = Number(params?.id);

  const { data: job, isLoading } = trpc.bulk.status.useQuery(
    { id: jobId },
    { refetchInterval: (query) => query.state.data?.status === "running" ? 3000 : false }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p className="text-muted-foreground">Bulk job not found</p>
      </div>
    );
  }

  const progress = job.totalSubjects > 0 ? Math.round((job.completedSubjects / job.totalSubjects) * 100) : 0;
  const investigationIds = (job.investigationIds as number[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Bulk Investigation Progress</h1>
        <p className="text-muted-foreground mt-1">Tracking batch job #{job.id}</p>
      </div>

      {/* Status Card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Job Status</CardTitle>
            <Badge
              variant="secondary"
              className={
                job.status === "completed" ? "bg-emerald-400/10 text-emerald-400" :
                job.status === "running" ? "bg-blue-400/10 text-blue-400" :
                job.status === "failed" ? "bg-red-400/10 text-red-400" :
                "bg-yellow-400/10 text-yellow-400"
              }
            >
              {job.status === "running" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {job.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono text-foreground">{job.completedSubjects} / {job.totalSubjects}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-3 rounded-lg bg-muted/20">
              <p className="text-2xl font-bold text-foreground">{job.totalSubjects}</p>
              <p className="text-xs text-muted-foreground">Total Subjects</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-400/5">
              <p className="text-2xl font-bold text-emerald-400">{job.completedSubjects}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-400/5">
              <p className="text-2xl font-bold text-blue-400">{job.totalSubjects - job.completedSubjects}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investigation Results */}
      {investigationIds.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Investigation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {investigationIds.map((id, idx) => (
                <div key={id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                    <span className="text-sm font-medium text-foreground">Investigation #{id}</span>
                  </div>
                  <Link href={`/report/${id}`}>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      View Report <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate("/bulk")}>
          Back to Bulk Jobs
        </Button>
        <Button variant="outline" onClick={() => navigate("/history")}>
          View All Investigations
        </Button>
      </div>
    </div>
  );
}
