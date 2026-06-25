import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Clock, CheckCircle2, AlertCircle, Loader2, Trash2,
  Search, PlusCircle
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, className: "bg-muted text-muted-foreground" },
  running: { label: "Running", icon: Loader2, className: "bg-primary/10 text-primary" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-green-500/10 text-green-400" },
  failed: { label: "Failed", icon: AlertCircle, className: "bg-destructive/10 text-destructive" },
};

export default function History() {
  const [, setLocation] = useLocation();
  const { data: investigations, isLoading, refetch } = trpc.investigation.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.investigation.delete.useMutation({
    onSuccess: () => {
      toast.success("Investigation deleted");
      utils.investigation.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Investigation History
          </h1>
          <p className="text-muted-foreground">
            All past investigations and their reports.
          </p>
        </div>
        <Button onClick={() => setLocation("/new")}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Investigation
        </Button>
      </div>

      {/* Investigation List */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !investigations || investigations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No investigations found.</p>
              <Button onClick={() => setLocation("/new")}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Start Your First Investigation
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {investigations.map((inv) => {
                const config = STATUS_CONFIG[inv.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                const StatusIcon = config.icon;
                const details = inv.subjectDetails as Record<string, string> | null;

                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-5 hover:bg-accent/30 transition-colors group"
                  >
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => {
                        if (inv.status === "running" || inv.status === "pending") {
                          setLocation(`/investigation/${inv.id}/progress`);
                        } else {
                          setLocation(`/investigation/${inv.id}`);
                        }
                      }}
                    >
                      <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
                        <span className="text-base font-semibold text-foreground">
                          {inv.subjectName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {inv.subjectName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>
                            {new Date(inv.createdAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                          {details?.location && (
                            <span className="truncate">{details.location}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="secondary" className={config.className}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${inv.status === "running" ? "animate-spin" : ""}`} />
                        {config.label}
                      </Badge>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Investigation</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the investigation on "{inv.subjectName}" and all associated findings. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: inv.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
