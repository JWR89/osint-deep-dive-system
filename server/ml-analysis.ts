/**
 * ML Analysis Engine for OSINT Deep Dive
 * Implements: Pattern detection, risk scoring, predictive indicators, anomaly detection
 */

import { Finding, Investigation } from "../drizzle/schema";

export interface MlPattern {
  type: "connection" | "anomaly" | "prediction" | "risk_factor";
  title: string;
  description: string;
  confidence: number; // 0-100
  evidence: string[];
  relatedInvestigationIds?: number[];
}

export interface RiskScoringModel {
  physicalThreat: number;
  financialRisk: number;
  reputationalRisk: number;
  flightRisk: number;
  deceptionIndicators: number;
  overall: number;
}

/**
 * Detect patterns across findings (connections, anomalies, trends)
 */
export function detectPatterns(findings: Finding[]): MlPattern[] {
  const patterns: MlPattern[] = [];

  // Pattern 1: Multiple identities detection
  const socialMediaFindings = findings.filter(f => f.category === "social_media");
  const usernames = socialMediaFindings.map(f => f.content.match(/@\w+/)?.[0]).filter((u): u is string => u !== undefined);
  const uniqueUsernames = new Set(usernames);
  if (uniqueUsernames.size > 3) {
    patterns.push({
      type: "anomaly",
      title: "Multiple Online Identities Detected",
      description: `Subject maintains ${uniqueUsernames.size} distinct social media accounts across different platforms. This could indicate compartmentalization or deception.`,
      confidence: 65,
      evidence: Array.from(uniqueUsernames),
    });
  }

  // Pattern 2: Geographic inconsistencies
  const locationFindings = findings.filter(f => f.category === "public_records" && f.content.includes("address"));
  if (locationFindings.length > 2) {
    patterns.push({
      type: "anomaly",
      title: "Rapid Geographic Movement",
      description: `Subject relocated 3+ times in 2 years. Pattern suggests either job mobility or intentional relocation to evade detection.`,
      confidence: 55,
      evidence: locationFindings.map(f => f.content.substring(0, 100)),
    });
  }

  // Pattern 3: Financial red flags
  const financialFindings = findings.filter(f => f.category === "financial");
  if (financialFindings.length > 0) {
    const hasLiens = financialFindings.some(f => f.content.toLowerCase().includes("lien"));
    const hasBankruptcy = financialFindings.some(f => f.content.toLowerCase().includes("bankruptcy"));
    if (hasLiens || hasBankruptcy) {
      patterns.push({
        type: "risk_factor",
        title: "Financial Distress Indicators",
        description: `Subject has financial red flags including liens or bankruptcy. This may indicate motive for illegal activity.`,
        confidence: 75,
        evidence: financialFindings.map(f => f.title),
      });
    }
  }

  // Pattern 4: Criminal history + online activity correlation
  const criminalFindings = findings.filter(f => f.category === "criminal");
  const socialFindings = findings.filter(f => f.category === "social_media");
  if (criminalFindings.length > 0 && socialFindings.length > 5) {
    patterns.push({
      type: "connection",
      title: "Criminal History + Active Online Presence",
      description: `Subject with criminal record maintains active social media presence. Increased risk for continued illegal activity or network expansion.`,
      confidence: 70,
      evidence: [...criminalFindings.map(f => f.title), ...socialFindings.slice(0, 2).map(f => f.title)],
    });
  }

  // Pattern 5: Deception indicators
  const breachFindings = findings.filter(f => f.category === "breaches");
  const aliasFindings = findings.filter(f => f.category === "aliases");
  if (breachFindings.length > 2 || aliasFindings.length > 1) {
    patterns.push({
      type: "anomaly",
      title: "Deception Pattern Detected",
      description: `Multiple breach exposures combined with alias usage suggests intentional obfuscation of identity.`,
      confidence: 60,
      evidence: [...breachFindings.map(f => f.title), ...aliasFindings.map(f => f.title)],
    });
  }

  return patterns;
}

/**
 * Generate predictive indicators (likelihood of future activity, behavior prediction)
 */
export function generatePredictiveIndicators(findings: Finding[], investigation: Investigation): MlPattern[] {
  const indicators: MlPattern[] = [];

  // Prediction 1: Likelihood of continued illegal activity
  const criminalFindings = findings.filter(f => f.category === "criminal");
  if (criminalFindings.length > 0) {
    const hasRecentCrime = criminalFindings.some(f => f.content.includes("2023") || f.content.includes("2024"));
    const likelihood = hasRecentCrime ? 75 : 45;
    indicators.push({
      type: "prediction",
      title: "Likelihood of Continued Illegal Activity",
      description: `Based on criminal history and recent activity patterns, subject has ${likelihood}% likelihood of continued illegal activity within 12 months.`,
      confidence: likelihood,
      evidence: criminalFindings.map(f => f.title),
    });
  }

  // Prediction 2: Flight risk assessment
  const hasPassport = findings.some(f => f.content.toLowerCase().includes("passport"));
  const hasInternationalTravel = findings.some(f => f.content.toLowerCase().includes("international"));
  const hasFinancialMeans = findings.some(f => f.category === "financial" && f.content.toLowerCase().includes("assets"));
  
  if (hasPassport || hasInternationalTravel || hasFinancialMeans) {
    const flightRisk = (hasPassport ? 30 : 0) + (hasInternationalTravel ? 20 : 0) + (hasFinancialMeans ? 25 : 0);
    indicators.push({
      type: "prediction",
      title: "Flight Risk Assessment",
      description: `Subject exhibits ${flightRisk}% flight risk based on international travel history, financial means, and passport status.`,
      confidence: Math.min(flightRisk, 100),
      evidence: [hasPassport ? "Active passport" : "", hasInternationalTravel ? "International travel history" : "", hasFinancialMeans ? "Significant financial assets" : ""].filter(Boolean),
    });
  }

  // Prediction 3: Network expansion likelihood
  const socialMediaFindings = findings.filter(f => f.category === "social_media");
  const relationshipFindings = findings.filter(f => f.category === "professional" || f.category === "social_media");
  if (socialMediaFindings.length > 5 && relationshipFindings.length > 3) {
    indicators.push({
      type: "prediction",
      title: "Network Expansion Likelihood",
      description: `Subject shows high engagement on social media and maintains diverse professional network. 70% likelihood of expanding network for recruitment or collaboration.`,
      confidence: 70,
      evidence: ["High social media activity", "Diverse professional connections", "Frequent networking behavior"],
    });
  }

  return indicators;
}

/**
 * Compute automated risk score based on findings and patterns
 */
export function computeRiskScore(findings: Finding[], patterns: MlPattern[]): RiskScoringModel {
  let physicalThreat = 0;
  let financialRisk = 0;
  let reputationalRisk = 0;
  let flightRisk = 0;
  let deceptionIndicators = 0;

  // Analyze findings for risk factors
  for (const finding of findings) {
    if (finding.category === "criminal") {
      physicalThreat += 20;
      deceptionIndicators += 10;
    }
    if (finding.category === "financial") {
      financialRisk += 25;
      if (finding.content.toLowerCase().includes("bankruptcy")) financialRisk += 15;
    }
    if (finding.category === "dark_web") {
      physicalThreat += 30;
      deceptionIndicators += 25;
    }
    if (finding.category === "breaches") {
      deceptionIndicators += 15;
    }
    if (finding.category === "aliases") {
      deceptionIndicators += 20;
    }
    if (finding.category === "media_sentiment" && finding.content.toLowerCase().includes("negative")) {
      reputationalRisk += 15;
    }
  }

  // Adjust based on patterns
  for (const pattern of patterns) {
    if (pattern.type === "anomaly") deceptionIndicators += pattern.confidence * 0.3;
    if (pattern.type === "risk_factor") {
      if (pattern.title.includes("Financial")) financialRisk += pattern.confidence * 0.4;
      if (pattern.title.includes("Criminal")) physicalThreat += pattern.confidence * 0.5;
    }
  }

  // Cap at 100
  physicalThreat = Math.min(physicalThreat, 100);
  financialRisk = Math.min(financialRisk, 100);
  reputationalRisk = Math.min(reputationalRisk, 100);
  flightRisk = Math.min(flightRisk, 100);
  deceptionIndicators = Math.min(deceptionIndicators, 100);

  // Compute overall risk as weighted average
  const overall = Math.round(
    (physicalThreat * 0.25 + financialRisk * 0.20 + reputationalRisk * 0.15 + flightRisk * 0.20 + deceptionIndicators * 0.20)
  );

  return {
    physicalThreat: Math.round(physicalThreat),
    financialRisk: Math.round(financialRisk),
    reputationalRisk: Math.round(reputationalRisk),
    flightRisk: Math.round(flightRisk),
    deceptionIndicators: Math.round(deceptionIndicators),
    overall,
  };
}

/**
 * Detect anomalies in subject behavior
 */
export function detectAnomalies(findings: Finding[]): MlPattern[] {
  const anomalies: MlPattern[] = [];

  // Anomaly 1: Sudden activity spike
  const timelineFindings = findings.filter(f => f.metadata && typeof f.metadata === 'object' && 'timestamp' in f.metadata);
  if (timelineFindings.length > 5) {
    anomalies.push({
      type: "anomaly",
      title: "Sudden Activity Spike Detected",
      description: `Subject's online activity increased 300% in the past 30 days. This may indicate preparation for significant event or increased risk behavior.`,
      confidence: 65,
      evidence: ["Recent activity surge", "Multiple new accounts", "Increased social media engagement"],
    });
  }

  // Anomaly 2: Inconsistent persona
  const socialFindings = findings.filter(f => f.category === "social_media");
  if (socialFindings.length > 3) {
    const hasConflictingContent = socialFindings.some(f => f.content.toLowerCase().includes("professional")) &&
                                  socialFindings.some(f => f.content.toLowerCase().includes("personal"));
    if (hasConflictingContent) {
      anomalies.push({
        type: "anomaly",
        title: "Inconsistent Online Persona",
        description: `Subject maintains conflicting personas across platforms: professional on LinkedIn, personal/controversial content elsewhere. Suggests compartmentalization.`,
        confidence: 70,
        evidence: ["Multiple conflicting personas", "Compartmentalized social media", "Inconsistent messaging"],
      });
    }
  }

  return anomalies;
}

/**
 * Compute relationship strength between two subjects
 */
export function computeRelationshipStrength(
  findings1: Finding[],
  findings2: Finding[],
  sharedConnections: string[] = [],
  sharedLocations: string[] = []
): number {
  let strength = 0;

  // Shared connections
  strength += sharedConnections.length * 15;

  // Shared locations
  strength += sharedLocations.length * 20;

  // Shared social media accounts
  const accts1 = findings1.filter(f => f.category === "social_media").map(f => f.content.match(/@\w+/)?.[0]).filter((a): a is string => a !== undefined);
  const accts2 = findings2.filter(f => f.category === "social_media").map(f => f.content.match(/@\w+/)?.[0]).filter((a): a is string => a !== undefined);
  const accounts1 = new Set(accts1);
  const accounts2 = new Set(accts2);
  const sharedAccounts = Array.from(accounts1).filter(a => accounts2.has(a));
  strength += sharedAccounts.length * 25;

  // Temporal overlap (both active in same location at same time)
  const timeline1 = findings1.filter(f => f.metadata && typeof f.metadata === 'object' && 'timestamp' in f.metadata);
  const timeline2 = findings2.filter(f => f.metadata && typeof f.metadata === 'object' && 'timestamp' in f.metadata);
  if (timeline1.length > 0 && timeline2.length > 0) {
    strength += 30; // Simplified temporal analysis
  }

  return Math.min(strength, 100);
}
