import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Search, User, MapPin, Mail, Phone, AtSign, Building, FileText, Loader2 } from "lucide-react";

export default function NewInvestigation() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    location: "",
    email: "",
    phone: "",
    username: "",
    employer: "",
    additionalInfo: "",
  });

  const startMutation = trpc.investigation.start.useMutation({
    onSuccess: (data) => {
      toast.success("Investigation started");
      setLocation(`/investigation/${data.id}/progress`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start investigation");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    setIsSubmitting(true);
    startMutation.mutate(form);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          New Investigation
        </h1>
        <p className="text-muted-foreground">
          Enter all known information about the subject. The more details you provide, the deeper the investigation.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Subject Information
            </CardTitle>
            <CardDescription>
              Provide the subject's name and any additional identifying information you have available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required: Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., John Michael Smith"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="h-11 bg-background border-border"
                required
              />
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Age / Date of Birth
                </Label>
                <Input
                  id="age"
                  placeholder="e.g., 34 or 1990-05-15"
                  value={form.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  className="h-11 bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Austin, Texas"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="h-11 bg-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  placeholder="e.g., john.smith@email.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="h-11 bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g., (512) 555-0123"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="h-11 bg-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                  <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Known Username(s)
                </Label>
                <Input
                  id="username"
                  placeholder="e.g., jsmith92, john_the_dev"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  className="h-11 bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer" className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  Known Employer
                </Label>
                <Input
                  id="employer"
                  placeholder="e.g., Acme Corporation"
                  value={form.employer}
                  onChange={(e) => updateField("employer", e.target.value)}
                  className="h-11 bg-background border-border"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Additional Information
              </Label>
              <Textarea
                id="additionalInfo"
                placeholder="Any other details you know — nicknames, schools attended, hobbies, vehicle information, social circles, etc."
                value={form.additionalInfo}
                onChange={(e) => updateField("additionalInfo", e.target.value)}
                className="min-h-[100px] bg-background border-border resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-border">
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-medium"
                disabled={isSubmitting || !form.name.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Initiating Deep Dive...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Begin Investigation
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                The investigation will query 21+ data sources across 6 intelligence categories.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
