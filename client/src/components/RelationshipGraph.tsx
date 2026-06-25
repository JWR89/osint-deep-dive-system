import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Users, Network } from "lucide-react";

interface RelationshipNode {
  id: string;
  name: string;
  type: string;
  category?: string;
  connection?: string;
  connections?: string[];
}

const typeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  subject: { icon: User, color: "text-blue-400", bgColor: "bg-blue-400/10 border-blue-400/30" },
  person: { icon: Users, color: "text-emerald-400", bgColor: "bg-emerald-400/10 border-emerald-400/30" },
  associate: { icon: Users, color: "text-purple-400", bgColor: "bg-purple-400/10 border-purple-400/30" },
  organization: { icon: Building2, color: "text-amber-400", bgColor: "bg-amber-400/10 border-amber-400/30" },
};

export function RelationshipGraph({ relationships }: { relationships: RelationshipNode[] }) {
  if (!relationships || relationships.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Network className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No relationship data available</p>
      </div>
    );
  }

  const subject = relationships.find(r => r.type === "subject");
  const connections = relationships.filter(r => r.type !== "subject");

  // Group connections by type
  const grouped = connections.reduce((acc, node) => {
    const type = node.type || "person";
    if (!acc[type]) acc[type] = [];
    acc[type].push(node);
    return acc;
  }, {} as Record<string, RelationshipNode[]>);

  return (
    <div className="space-y-6">
      {/* Subject Center Node */}
      {subject && (
        <div className="flex justify-center">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-blue-400/50 bg-blue-400/5">
            <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{subject.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Subject</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Lines Visual */}
      <div className="flex justify-center">
        <div className="w-px h-6 bg-border" />
      </div>

      {/* Grouped Connections */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([type, nodes]) => {
          const config = typeConfig[type] || typeConfig.person;
          const Icon = config.icon;
          const typeLabel = type === "person" ? "People" : type === "organization" ? "Organizations" : "Associates";

          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{typeLabel}</h4>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{nodes.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {nodes.map((node, idx) => (
                  <Card key={idx} className={`border ${config.bgColor}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${config.bgColor}`}>
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{node.name}</p>
                          {node.connection && (
                            <p className="text-[10px] text-muted-foreground truncate">{node.connection}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {connections.length > 0 && (
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            {connections.length} connection{connections.length !== 1 ? "s" : ""} identified across {Object.keys(grouped).length} categor{Object.keys(grouped).length !== 1 ? "ies" : "y"}
          </p>
        </div>
      )}
    </div>
  );
}
