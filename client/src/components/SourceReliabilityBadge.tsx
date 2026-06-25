import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// NATO Intelligence Rating System
// Letter: Source Reliability (A=Completely reliable, B=Usually reliable, C=Fairly reliable, D=Not usually reliable, E=Unreliable, F=Cannot be judged)
// Number: Information Accuracy (1=Confirmed, 2=Probably true, 3=Possibly true, 4=Doubtful, 5=Improbable, 6=Cannot be judged)

const RELIABILITY_LETTERS: Record<string, { label: string; color: string }> = {
  A: { label: "Completely Reliable", color: "text-emerald-400" },
  B: { label: "Usually Reliable", color: "text-green-400" },
  C: { label: "Fairly Reliable", color: "text-cyan-400" },
  D: { label: "Not Usually Reliable", color: "text-amber-400" },
  E: { label: "Unreliable", color: "text-orange-400" },
  F: { label: "Cannot Be Judged", color: "text-muted-foreground" },
};

const ACCURACY_NUMBERS: Record<string, string> = {
  "1": "Confirmed by other sources",
  "2": "Probably true (logical, consistent)",
  "3": "Possibly true (not confirmed)",
  "4": "Doubtful",
  "5": "Improbable",
  "6": "Cannot be judged",
};

export function SourceReliabilityBadge({ rating }: { rating: string | null | undefined }) {
  if (!rating || rating.length < 2) return null;

  const letter = rating[0].toUpperCase();
  const number = rating[1];
  const reliability = RELIABILITY_LETTERS[letter] || RELIABILITY_LETTERS.F;
  const accuracy = ACCURACY_NUMBERS[number] || ACCURACY_NUMBERS["6"];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`text-[10px] font-mono ${reliability.color} border-current/30 cursor-help`}>
          {rating.toUpperCase()}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs font-semibold mb-1">Intelligence Rating: {rating.toUpperCase()}</p>
        <p className="text-xs text-muted-foreground">Source: {reliability.label}</p>
        <p className="text-xs text-muted-foreground">Info: {accuracy}</p>
      </TooltipContent>
    </Tooltip>
  );
}
