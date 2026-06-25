import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { PlusCircle, Search, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, className: "bg-muted text-muted-foreground" },
  running: { label: "Running", icon: Loader2, className: "bg-primary/10 text-primary" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-green-500/10 text-green-400" },
  failed: { label: "Failed", icon: AlertCircle, className: "bg-destructive/10 text-destructive" },
};

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: investigations, isLoading } = trpc.investigation.list.useQuery();

  const recentInvestigations = investigations?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Intelligence Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name?.split(" ")[0] || "Analyst"}. Begin a new investigation or review past reports.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:border-primary/50 transition-all duration-200 group"
          onClick={() => setLocation("/new")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <PlusCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">New Investigation</p>
              <p className="text-sm text-muted-foreground">Start a deep dive</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
              <Search className="h-6 w-6 text-chart-2" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Total Investigations</p>
              <p className="text-2xl font-bold text-foreground">{investigations?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">
                {investigations?.filter(i => i.status === "completed").length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Investigations */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Investigations</CardTitle>
          {investigations && investigations.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setLocation("/history")}>
              View all
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentInvestigations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No investigations yet. Start your first deep dive.</p>
              <Button onClick={() => setLocation("/new")}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Investigation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInvestigations.map((inv) => {
                const config = STATUS_CONFIG[inv.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                const StatusIcon = config.icon;
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      if (inv.status === "running" || inv.status === "pending") {
                        setLocation(`/investigation/${inv.id}/progress`);
                      } else {
                        setLocation(`/investigation/${inv.id}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                        <span className="text-sm font-semibold text-foreground">
                          {inv.subjectName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {inv.subjectName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={config.className}>
                      <StatusIcon className={`h-3 w-3 mr-1 ${inv.status === "running" ? "animate-spin" : ""}`} />
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
