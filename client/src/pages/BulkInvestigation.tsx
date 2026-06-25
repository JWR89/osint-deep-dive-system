import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Upload, FileSpreadsheet, Play, CheckCircle, Loader2, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface SubjectRow {
  name: string;
  age?: string;
  location?: string;
  email?: string;
  phone?: string;
  username?: string;
  employer?: string;
  additionalInfo?: string;
}

export default function BulkInvestigation() {
  const [, navigate] = useLocation();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startBulkMutation = trpc.bulk.start.useMutation({
    onSuccess: (data) => {
      toast.success(`Bulk investigation started: ${subjects.length} subjects`);
      navigate(`/bulk/${data.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h === "name" || h === "full name" || h === "fullname");
      
      if (nameIdx === -1) {
        toast.error("CSV must have a 'name' column");
        return;
      }

      const parsed: SubjectRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values[nameIdx]?.trim()) {
          parsed.push({
            name: values[nameIdx].trim(),
            age: values[headers.indexOf("age")]?.trim() || undefined,
            location: values[headers.indexOf("location")]?.trim() || values[headers.indexOf("city")]?.trim() || undefined,
            email: values[headers.indexOf("email")]?.trim() || undefined,
            phone: values[headers.indexOf("phone")]?.trim() || undefined,
            username: values[headers.indexOf("username")]?.trim() || undefined,
            employer: values[headers.indexOf("employer")]?.trim() || values[headers.indexOf("company")]?.trim() || undefined,
            additionalInfo: values[headers.indexOf("notes")]?.trim() || values[headers.indexOf("additional")]?.trim() || undefined,
          });
        }
      }

      if (parsed.length === 0) {
        toast.error("No valid subjects found in CSV");
        return;
      }

      if (parsed.length > 50) {
        toast.error("Maximum 50 subjects per batch");
        setSubjects(parsed.slice(0, 50));
      } else {
        setSubjects(parsed);
      }
      toast.success(`Parsed ${Math.min(parsed.length, 50)} subjects from CSV`);
    };
    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const downloadTemplate = () => {
    const csv = "name,age,location,email,phone,username,employer,notes\nJohn Smith,34,Austin Texas,john@email.com,512-555-0123,jsmith92,Acme Corp,Known to frequent downtown area\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "osint-bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Bulk Investigation</h1>
        <p className="text-muted-foreground mt-1">Upload a CSV file to investigate multiple subjects at once.</p>
      </div>

      {/* Upload Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Upload Subjects CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {fileName || "Click to upload CSV file"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              CSV with columns: name (required), age, location, email, phone, username, employer, notes
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Template
            </Button>
            <span className="text-xs text-muted-foreground">Max 50 subjects per batch</span>
          </div>
        </CardContent>
      </Card>

      {/* Parsed Subjects Preview */}
      {subjects.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Subjects Preview
                <Badge variant="secondary" className="ml-2">{subjects.length}</Badge>
              </CardTitle>
              <Button
                onClick={() => startBulkMutation.mutate({ subjects })}
                disabled={startBulkMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {startBulkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Start Bulk Investigation
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Location</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.slice(0, 20).map((subject, idx) => (
                    <tr key={idx} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{subject.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{subject.location || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{subject.email || "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {subject.phone && <Badge variant="secondary" className="text-[9px] px-1">Phone</Badge>}
                          {subject.username && <Badge variant="secondary" className="text-[9px] px-1">Username</Badge>}
                          {subject.employer && <Badge variant="secondary" className="text-[9px] px-1">Employer</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subjects.length > 20 && (
                <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/20 border-t border-border">
                  ...and {subjects.length - 20} more subjects
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
