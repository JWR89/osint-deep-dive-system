import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { MessageSquarePlus, Trash2, Star, Tag } from "lucide-react";
import { toast } from "sonner";

interface AnnotationsProps {
  investigationId: number;
  findingId?: number;
}

export function Annotations({ investigationId, findingId }: AnnotationsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");

  const utils = trpc.useUtils();
  const { data: annotations, isLoading } = trpc.annotations.list.useQuery({ investigationId });

  const createMutation = trpc.annotations.create.useMutation({
    onSuccess: () => {
      utils.annotations.list.invalidate({ investigationId });
      setContent("");
      setTag("");
      setIsAdding(false);
      toast.success("Note added");
    },
  });

  const deleteMutation = trpc.annotations.delete.useMutation({
    onSuccess: () => {
      utils.annotations.list.invalidate({ investigationId });
      toast.success("Note deleted");
    },
  });

  const highlightMutation = trpc.annotations.update.useMutation({
    onSuccess: () => {
      utils.annotations.list.invalidate({ investigationId });
    },
  });

  const filteredAnnotations = findingId
    ? annotations?.filter(a => a.findingId === findingId)
    : annotations;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4" />
          Case Notes
          {filteredAnnotations && filteredAnnotations.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{filteredAnnotations.length}</Badge>
          )}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs h-7"
        >
          {isAdding ? "Cancel" : "+ Add Note"}
        </Button>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <Card className="border-primary/30">
          <CardContent className="p-3 space-y-2">
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your note..."
              className="text-sm min-h-[80px] resize-none"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <Input
                  value={tag}
                  onChange={e => setTag(e.target.value)}
                  placeholder="Tag (optional)"
                  className="text-xs h-7"
                />
              </div>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!content.trim() || createMutation.isPending}
                onClick={() => {
                  createMutation.mutate({
                    investigationId,
                    findingId: findingId || undefined,
                    content: content.trim(),
                    tag: tag.trim() || undefined,
                  });
                }}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Annotations List */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading notes...</div>
      ) : filteredAnnotations && filteredAnnotations.length > 0 ? (
        <div className="space-y-2">
          {filteredAnnotations.map(annotation => (
            <Card
              key={annotation.id}
              className={`border-border/50 ${annotation.highlighted ? "border-yellow-400/50 bg-yellow-400/5" : ""}`}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-foreground leading-relaxed">{annotation.content}</p>
                    <div className="flex items-center gap-2">
                      {annotation.tag && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {annotation.tag}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(annotation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => highlightMutation.mutate({
                        id: annotation.id,
                        highlighted: !annotation.highlighted,
                      })}
                    >
                      <Star className={`w-3 h-3 ${annotation.highlighted ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                      onClick={() => deleteMutation.mutate({ id: annotation.id })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground py-2">No notes yet. Add your observations and analysis.</p>
      )}
    </div>
  );
}
