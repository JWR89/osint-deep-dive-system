/**
 * ML Analysis Engine for OSINT Deep Dive
 * Pattern detection, risk scoring, predictive indicators, cross-subject comparison
 */

import { Finding } from "../drizzle/schema";

export interface MLInsight {
  type: "pattern" | "prediction" | "anomaly" | "relationship" | "temporal";
  title: string;
  description: string;
  confidence: number; // 0-100
  evidence: string[];
  actionable: boolean;
  severity: "low" | "medium" | "high" | "critical";
}

export interface PatternAnalysis {
  patterns: MLInsight[];
  anomalies: MLInsight[];
  riskFactors: string[];
  predictedBehaviors: string[];
}

export interface CrossSubjectComparison {
  subject1: string;
  subject2: string;
  connectionStrength: number; // 0-100
  sharedConnections: string[];
  sharedLocations: string[];
  sharedInterests: string[];
  timelineOverlap: string[];
  riskAssessment: string;
}

/**
 * Detect patterns across findings
 */
export function detectPatterns(findings: Finding[]): MLInsight[] {
  const patterns: MLInsight[] = [];

  // Pattern 1: Frequent location changes
  const locations = findings
    .filter((f) => f.category === "public_records" && f.content.includes("address"))
    .map((f) => f.content);

  if (locations.length > 3) {
    patterns.push({
      type: "pattern",
      title: "Frequent Relocation Pattern",
      description: `Subject has moved ${locations.length} times in recent years. This could indicate instability, job changes, or intentional evasion.`,
      confidence: 75,
      evidence: locations.slice(0, 3),
      actionable: true,
      severity: "medium",
    });
  }

  // Pattern 2: Multiple online identities
  const socialProfiles = findings.filter((f) => f.category === "social_media");
  if (socialProfiles.length > 5) {
    patterns.push({
      type: "pattern",
      title: "Extensive Online Presence",
      description: `Subject maintains ${socialProfiles.length} active social media profiles across different platforms. High digital footprint.`,
      confidence: 85,
      evidence: socialProfiles.map((p) => p.source),
      actionable: true,
      severity: "low",
    });
  }

  // Pattern 3: Breach history
  const breaches = findings.filter((f) => f.category === "breaches");
  if (breaches.length > 2) {
    patterns.push({
      type: "pattern",
      title: "Multiple Data Breach Exposure",
      description: `Subject's email/accounts appeared in ${breaches.length} known data breaches. Credentials may be compromised.`,
      confidence: 90,
      evidence: breaches.map((b) => b.content),
      actionable: true,
      severity: "high",
    });
  }

  // Pattern 4: Criminal history
  const criminalRecords = findings.filter((f) => f.category === "criminal");
  if (criminalRecords.length > 0) {
    patterns.push({
      type: "pattern",
      title: "Criminal Record Detected",
      description: `Subject has ${criminalRecords.length} criminal record(s). Recommend thorough background verification.`,
      confidence: 95,
      evidence: criminalRecords.map((c) => c.content),
      actionable: true,
      severity: "critical",
    });
  }

  return patterns;
}

/**
 * Detect anomalies in findings
 */
export function detectAnomalies(findings: Finding[]): MLInsight[] {
  const anomalies: MLInsight[] = [];

  // Anomaly 1: Conflicting information
  const identityFindings = findings.filter((f) => f.category === "identity");
  if (identityFindings.length > 1) {
    const names = identityFindings.map((f) => f.content).filter((c) => c.includes("name"));
    if (new Set(names).size > 1) {
      anomalies.push({
        type: "anomaly",
        title: "Conflicting Identity Information",
        description: "Subject's name appears differently across sources. May indicate aliases or data inconsistencies.",
        confidence: 70,
        evidence: names,
        actionable: true,
        severity: "medium",
      });
    }
  }

  // Anomaly 2: Sudden activity changes
  const timelineGaps = findings.filter((f) => f.content.includes("gap") || f.content.includes("inactive"));
  if (timelineGaps.length > 0) {
    anomalies.push({
      type: "anomaly",
      title: "Suspicious Activity Gaps",
      description: "Subject has periods of no online activity or public records. May indicate intentional hiding or relocation.",
      confidence: 65,
      evidence: timelineGaps.map((t) => t.content),
      actionable: true,
      severity: "medium",
    });
  }

  // Anomaly 3: Unusual dating site presence
  const datingFindings = findings.filter((f) => f.category === "dating");
  if (datingFindings.length > 2) {
    anomalies.push({
      type: "anomaly",
      title: "Multiple Dating Site Profiles",
      description: `Subject has profiles on ${datingFindings.length} dating platforms. May indicate relationship status inconsistencies or deception.`,
      confidence: 60,
      evidence: datingFindings.map((d) => d.source),
      actionable: true,
      severity: "low",
    });
  }

  return anomalies;
}

/**
 * Predict future behavior based on historical patterns
 */
export function predictBehaviors(findings: Finding[], psychProfile?: any): string[] {
  const predictions: string[] = [];

  // Prediction 1: Job stability
  const employmentFindings = findings.filter((f) => f.content.includes("employment") || f.content.includes("job"));
  if (employmentFindings.length > 2) {
    const avgTenure = 2; // Simplified: assume 2 years average
    if (avgTenure < 1.5) {
      predictions.push("Subject likely to change jobs within 12 months (high job mobility pattern)");
    }
  }

  // Prediction 2: Geographic movement
  const addressFindings = findings.filter((f) => f.content.includes("address"));
  if (addressFindings.length > 3) {
    predictions.push("Subject likely to relocate within 18-24 months (frequent mover pattern)");
  }

  // Prediction 3: Online activity
  if (psychProfile?.communicationStyle?.postingFrequency === "high") {
    predictions.push("Subject will continue high social media activity (consistent behavior pattern)");
  }

  // Prediction 4: Financial risk
  const financialFindings = findings.filter((f) => f.category === "financial");
  if (financialFindings.length > 0 && financialFindings.some((f) => f.content.includes("bankruptcy"))) {
    predictions.push("Subject may face future financial difficulties (bankruptcy history indicator)");
  }

  return predictions;
}

/**
 * Calculate relationship strength between two subjects
 */
export function calculateRelationshipStrength(
  subject1Findings: Finding[],
  subject2Findings: Finding[],
  sharedConnections: string[] = []
): CrossSubjectComparison {
  let strength = 0;

  // Shared locations
  const locations1 = subject1Findings.filter((f) => f.content.includes("address")).map((f) => f.content);
  const locations2 = subject2Findings.filter((f) => f.content.includes("address")).map((f) => f.content);
  const sharedLocs = locations1.filter((l) => locations2.some((l2) => l2.includes(l.split(" ")[0])));
  strength += sharedLocs.length * 15;

  // Shared social platforms
  const platforms1 = subject1Findings.filter((f) => f.category === "social_media").map((f) => f.source);
  const platforms2 = subject2Findings.filter((f) => f.category === "social_media").map((f) => f.source);
  const sharedPlatforms = platforms1.filter((p) => platforms2.includes(p));
  strength += sharedPlatforms.length * 10;

  // Shared connections
  strength += sharedConnections.length * 20;

  // Timeline overlap
  const timelineOverlap: string[] = [];
  if (locations1.length > 0 && locations2.length > 0) {
    timelineOverlap.push("Both subjects lived in similar geographic areas");
  }

  // Cap strength at 100
  strength = Math.min(strength, 100);

  return {
    subject1: "Subject 1",
    subject2: "Subject 2",
    connectionStrength: strength,
    sharedConnections,
    sharedLocations: sharedLocs,
    sharedInterests: sharedPlatforms,
    timelineOverlap,
    riskAssessment:
      strength > 70
        ? "HIGH: Strong connection detected. Subjects likely know each other or have significant overlap."
        : strength > 40
          ? "MEDIUM: Moderate connection. Subjects may have indirect relationship."
          : "LOW: Weak connection. Subjects likely unrelated.",
  };
}

/**
 * Temporal analysis - track changes over time
 */
export function temporalAnalysis(findings: Finding[]): MLInsight[] {
  const insights: MLInsight[] = [];

  // Group findings by time period
  const recent = findings.filter((f) => f.content.includes("2024") || f.content.includes("recent"));
  const older = findings.filter((f) => f.content.includes("2020") || f.content.includes("2021"));

  if (recent.length > older.length) {
    insights.push({
      type: "temporal",
      title: "Increasing Online Activity",
      description: "Subject's online presence has increased significantly in recent months.",
      confidence: 70,
      evidence: recent.slice(0, 3).map((f) => f.content),
      actionable: false,
      severity: "low",
    });
  }

  if (older.length > 0 && recent.length === 0) {
    insights.push({
      type: "temporal",
      title: "Reduced Recent Activity",
      description: "Subject had significant activity in past but minimal recent presence.",
      confidence: 75,
      evidence: older.slice(0, 2).map((f) => f.content),
      actionable: true,
      severity: "medium",
    });
  }

  return insights;
}

/**
 * Run complete ML analysis
 */
export function runMLAnalysis(findings: Finding[], psychProfile?: any): PatternAnalysis {
  return {
    patterns: detectPatterns(findings),
    anomalies: detectAnomalies(findings),
    riskFactors: extractRiskFactors(findings),
    predictedBehaviors: predictBehaviors(findings, psychProfile),
  };
}

/**
 * Extract key risk factors
 */
function extractRiskFactors(findings: Finding[]): string[] {
  const factors: string[] = [];

  if (findings.some((f) => f.category === "criminal")) factors.push("Criminal history");
  if (findings.some((f) => f.category === "breaches")) factors.push("Data breach exposure");
  if (findings.some((f) => f.category === "dating")) factors.push("Multiple dating profiles");
  if (findings.some((f) => f.content.includes("bankruptcy"))) factors.push("Financial instability");
  if (findings.some((f) => f.content.includes("lawsuit"))) factors.push("Legal disputes");
  if (findings.some((f) => f.content.includes("arrest"))) factors.push("Arrest record");

  return factors;
}
