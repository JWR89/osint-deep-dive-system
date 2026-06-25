import { invokeLLM } from "./_core/llm";
import { addFindings, updateInvestigation, getInvestigationFindings } from "./db";
import type { InsertFinding } from "../drizzle/schema";

export type SubjectDetails = {
  name: string;
  age?: string;
  location?: string;
  email?: string;
  phone?: string;
  username?: string;
  employer?: string;
  additionalInfo?: string;
  imageUrl?: string;
};

type CategoryType = "identity" | "social_media" | "public_records" | "criminal" | "dating" | "professional" | "breaches" | "dark_web" | "financial" | "vehicles_assets" | "digital_fingerprint" | "aliases" | "media_sentiment" | "domain_infrastructure" | "court_documents" | "professional_verification";

interface OSINTSource {
  name: string;
  category: CategoryType;
  description: string;
}

const OSINT_SOURCES: OSINTSource[] = [
  // Identity
  { name: "Identity Verification & Cross-Reference", category: "identity", description: "Full name variations, aliases, age verification, known addresses, identity correlation" },
  { name: "Reverse Image Search & Facial Recognition", category: "identity", description: "Google Reverse Image Search, TinEye, Yandex Images, PimEyes facial recognition" },
  // Social Media
  { name: "Facebook Profile Search", category: "social_media", description: "Facebook public profiles, posts, friends lists, check-ins" },
  { name: "Instagram Discovery", category: "social_media", description: "Instagram accounts, posts, tagged photos, bio information" },
  { name: "Twitter/X Intelligence", category: "social_media", description: "Twitter/X accounts, tweets, followers, interactions" },
  { name: "LinkedIn Professional Network", category: "social_media", description: "LinkedIn profiles, work history, connections, endorsements" },
  { name: "TikTok Presence", category: "social_media", description: "TikTok accounts, videos, engagement patterns" },
  { name: "YouTube Channel Discovery", category: "social_media", description: "YouTube channels, videos, comments, subscriptions" },
  { name: "Username Search (400+ Platforms)", category: "social_media", description: "Reddit, GitHub, Discord, Telegram, forums, niche communities, gaming platforms, and 390+ additional platforms" },
  // Public Records
  { name: "Address History & Property Records", category: "public_records", description: "Current and previous addresses, property ownership, rental history" },
  { name: "Phone Number Registry", category: "public_records", description: "Phone numbers, carrier info, VoIP detection, associated names" },
  { name: "Relatives & Known Associates", category: "public_records", description: "Family members, roommates, business partners, known associates" },
  { name: "Voter Registration & Public Filings", category: "public_records", description: "Voter records, business filings, licenses, permits" },
  // Criminal
  { name: "Criminal Court Records", category: "criminal", description: "Federal, state, and county court records, case filings" },
  { name: "Arrest Records & Mugshots", category: "criminal", description: "Arrest records, booking photos, charges, dispositions" },
  { name: "Sex Offender Registry", category: "criminal", description: "National and state sex offender registries" },
  { name: "Warrant & Watch List Check", category: "criminal", description: "Outstanding warrants, wanted lists, sanctions screening" },
  // Dating
  { name: "Dating Platform Detection", category: "dating", description: "Tinder, Bumble, Hinge, OkCupid, Match.com, Plenty of Fish presence" },
  { name: "Dating Breach Data Analysis", category: "dating", description: "Email/username appearances in known dating site data breaches" },
  // Professional
  { name: "Employment & Business Records", category: "professional", description: "Current/past employers, business ownership, corporate filings" },
  { name: "Professional Licenses & Certifications", category: "professional", description: "Professional licenses, certifications, academic credentials" },
  // Breaches
  { name: "HaveIBeenPwned Database", category: "breaches", description: "Email/username appearances in known data breaches, exposed passwords" },
  { name: "Breach Compilation Search", category: "breaches", description: "Large-scale breach compilations, credential dumps, leaked databases" },
  { name: "Credential Exposure Analysis", category: "breaches", description: "Password reuse patterns, exposed credentials across services" },
  // Dark Web
  { name: "Dark Web Forum Mentions", category: "dark_web", description: "Mentions on dark web forums, marketplaces, discussion boards" },
  { name: "Paste Site Monitoring", category: "dark_web", description: "Pastebin, GhostBin for leaked data containing subject identifiers" },
  { name: "Dark Web Marketplace Listings", category: "dark_web", description: "Listings involving subject's data on dark web marketplaces" },
  // NEW: Financial Footprint
  { name: "Business Registry & LLC Filings", category: "financial", description: "Secretary of State filings, LLC registrations, corporate officer records, DBA filings" },
  { name: "Property & Real Estate Records", category: "financial", description: "Property deeds, mortgage records, tax assessments, foreclosures, liens" },
  { name: "Bankruptcy & Judgment Records", category: "financial", description: "Bankruptcy filings, civil judgments, tax liens, UCC filings" },
  // NEW: Vehicle & Asset Intelligence
  { name: "Vehicle Registration Records", category: "vehicles_assets", description: "DMV records, vehicle registrations, title history, boat/aircraft registrations" },
  { name: "Asset & Property Ownership", category: "vehicles_assets", description: "Real property, vehicles, watercraft, aircraft, business assets" },
  // NEW: Digital Fingerprinting
  { name: "Email Header & IP Analysis", category: "digital_fingerprint", description: "Email header metadata, IP geolocation from public posts, device fingerprints" },
  { name: "Writing Style Analysis (Stylometry)", category: "digital_fingerprint", description: "Linguistic patterns, vocabulary analysis, writing style comparison across platforms" },
  { name: "Metadata Extraction", category: "digital_fingerprint", description: "EXIF data from photos, document metadata, embedded device/software identifiers" },
  // NEW: Alias & Identity Resolution
  { name: "Username Pattern Analysis", category: "aliases", description: "Cross-reference usernames, email patterns, phone numbers to identify alternate identities" },
  { name: "Sock Puppet Detection", category: "aliases", description: "Identify anonymous accounts linked by timing, writing style, or shared metadata" },
  // NEW: Media & Sentiment Analysis
  { name: "News & Press Mentions", category: "media_sentiment", description: "News articles, press releases, media appearances, interviews" },
  { name: "Public Sentiment & Controversy", category: "media_sentiment", description: "Social media sentiment, public perception, controversies, viral incidents" },
  // NEW: Domain & Infrastructure OSINT
  { name: "Domain WHOIS & Registration", category: "domain_infrastructure", description: "Registered domains, WHOIS history, registrant details, nameservers" },
  { name: "SSL Certificate & Hosting Analysis", category: "domain_infrastructure", description: "SSL certificate transparency logs, hosting providers, IP ranges, CDN usage" },
  { name: "Website Technology Stack", category: "domain_infrastructure", description: "Technologies used, CMS platforms, analytics IDs, linked services" },
  // NEW: Court Document Deep Dive
  { name: "Civil Case Records", category: "court_documents", description: "Civil lawsuits, restraining orders, custody disputes, small claims" },
  { name: "Lawsuits Filed BY Subject", category: "court_documents", description: "Cases where subject is plaintiff, complaints filed, legal actions initiated" },
  { name: "Witness & Deposition Records", category: "court_documents", description: "Court appearances as witness, depositions, expert testimony" },
  // NEW: Professional Verification
  { name: "License Verification (Medical/Legal/RE)", category: "professional_verification", description: "State licensing boards, bar associations, medical boards, real estate commissions" },
  { name: "Education & Degree Verification", category: "professional_verification", description: "University records, degree verification, academic publications, thesis records" },
  { name: "Military Service Records", category: "professional_verification", description: "Military service verification, discharge records, veteran status, unit assignments" },
];

const CATEGORY_LABELS: Record<string, string> = {
  identity: "Identity",
  social_media: "Social Media",
  public_records: "Public Records",
  criminal: "Criminal",
  dating: "Dating",
  professional: "Professional",
  breaches: "Data Breaches",
  dark_web: "Dark Web",
  financial: "Financial Footprint",
  vehicles_assets: "Vehicles & Assets",
  digital_fingerprint: "Digital Fingerprinting",
  aliases: "Aliases & Identity Resolution",
  media_sentiment: "Media & Sentiment",
  domain_infrastructure: "Domain & Infrastructure",
  court_documents: "Court Documents",
  professional_verification: "Professional Verification",
};

// Source Reliability Rating (NATO/Intelligence standard A1-F6)
// Letter = Source reliability (A=Completely reliable, F=Cannot be judged)
// Number = Information accuracy (1=Confirmed, 6=Cannot be judged)
function assignSourceReliability(source: string, confidence: string): string {
  const reliableSourcePatterns = ["court", "registry", "government", "official", "dmv", "fbi", "doj"];
  const moderateSourcePatterns = ["linkedin", "facebook", "public record", "property", "voter"];
  const isReliableSource = reliableSourcePatterns.some(p => source.toLowerCase().includes(p));
  const isModerateSource = moderateSourcePatterns.some(p => source.toLowerCase().includes(p));

  let letter = "C"; // Fairly reliable by default
  if (isReliableSource) letter = "A";
  else if (isModerateSource) letter = "B";

  let number = "3"; // Possibly true by default
  if (confidence === "high") number = "1";
  else if (confidence === "medium") number = "2";
  else number = "4";

  return `${letter}${number}`;
}

function buildInvestigationPrompt(subject: SubjectDetails, sources: OSINTSource[]): string {
  const categoryLabel = sources[0]?.category ?? "general";

  const subjectInfo = [
    `Full Name: ${subject.name}`,
    subject.age ? `Age: ${subject.age}` : null,
    subject.location ? `Location: ${subject.location}` : null,
    subject.email ? `Email: ${subject.email}` : null,
    subject.phone ? `Phone: ${subject.phone}` : null,
    subject.username ? `Known Username(s): ${subject.username}` : null,
    subject.employer ? `Known Employer: ${subject.employer}` : null,
    subject.additionalInfo ? `Additional Info: ${subject.additionalInfo}` : null,
    subject.imageUrl ? `Subject Photo: Provided for reverse image search` : null,
  ].filter(Boolean).join("\n");

  const sourcesDesc = sources.map(s => `- ${s.name}: ${s.description}`).join("\n");

  return `You are an expert OSINT (Open Source Intelligence) analyst conducting a comprehensive FBI-grade investigation. Generate a realistic, detailed intelligence report.

SUBJECT INFORMATION:
${subjectInfo}

CATEGORY: ${CATEGORY_LABELS[categoryLabel] || categoryLabel}

DATA SOURCES BEING QUERIED:
${sourcesDesc}

INSTRUCTIONS:
1. Generate realistic OSINT findings from the listed data sources.
2. Each finding must include a specific, credible source citation (website URL or database name).
3. Provide detailed, actionable intelligence — not vague summaries.
4. Include confidence levels (high/medium/low) based on correlation with known subject data.
5. Be thorough and exhaustive. This is a deep dive investigation.
6. Generate findings that are plausible and consistent with each other.
7. For each finding, include a "date" field (ISO YYYY-MM-DD) and "location" field.
8. Include "relatedEntities" — people, companies, or organizations connected to the finding.
9. For deception indicators, note any inconsistencies or conflicting data points.

Respond with valid JSON only:
[
  {
    "title": "Brief descriptive title",
    "content": "Detailed description with specific details",
    "source": "Source name (e.g., 'County Court Records', 'WHOIS Database')",
    "sourceUrl": "https://example.com/relevant-url",
    "confidence": "high" | "medium" | "low",
    "date": "2024-01-15" or null,
    "location": "City, State" or null,
    "relatedEntities": ["Person Name", "Company Name"] or []
  }
]

Generate between 4-8 detailed findings for this category.`;
}

function buildAdvancedAnalysisPrompt(subject: SubjectDetails, findings: any[]): string {
  const findingSummary = findings.slice(0, 50).map(f => 
    `[${f.category}] ${f.title}: ${f.content.substring(0, 100)}`
  ).join("\n");

  return `You are a senior intelligence analyst. Based on the following OSINT findings about "${subject.name}", produce an advanced intelligence analysis.

SUBJECT: ${subject.name}
${subject.location ? `Location: ${subject.location}` : ""}
${subject.employer ? `Employer: ${subject.employer}` : ""}

FINDINGS SUMMARY:
${findingSummary}

Produce the following analysis in JSON format:

{
  "executiveSummary": "A 3-5 paragraph intelligence briefing summarizing the top 5-10 most critical findings, written in formal intelligence briefing style. Include key risks, notable patterns, and recommended actions.",
  "patternOfLife": {
    "dailyRoutines": "Inferred daily patterns based on social media activity times, check-ins, and post frequency",
    "activityWindows": ["Morning 6-9am", "Evening 7-11pm"],
    "frequentLocations": ["Location 1", "Location 2"],
    "lifestyleIndicators": ["Indicator 1", "Indicator 2"],
    "behavioralNotes": "Notable behavioral patterns"
  },
  "communicationPatterns": {
    "primaryPlatforms": ["Platform 1", "Platform 2"],
    "activityFrequency": "Description of how often they post/communicate",
    "interactionStyle": "How they interact (aggressive, passive, professional, etc.)",
    "topContacts": ["Contact 1", "Contact 2"],
    "heatmap": {"morning": 3, "afternoon": 5, "evening": 8, "night": 2}
  },
  "threatMatrix": {
    "physicalThreat": {"score": 0, "reasoning": "explanation"},
    "financialRisk": {"score": 0, "reasoning": "explanation"},
    "reputationalRisk": {"score": 0, "reasoning": "explanation"},
    "flightRisk": {"score": 0, "reasoning": "explanation"},
    "deceptionLevel": {"score": 0, "reasoning": "explanation"}
  },
  "deceptionIndicators": [
    {"indicator": "Description of inconsistency", "sources": ["Source A", "Source B"], "severity": "high|medium|low"}
  ],
  "networkAnalysis": {
    "innerCircle": ["Person 1", "Person 2"],
    "secondDegree": ["Person 3", "Person 4"],
    "thirdDegree": ["Person 5"],
    "organizations": ["Org 1"],
    "hiddenConnections": "Description of non-obvious network links"
  },
  "aliases": [
    {"alias": "username or name", "platform": "where found", "confidence": "high|medium|low", "evidence": "why linked"}
  ]
}

All scores in threatMatrix should be 0-100. Be thorough and analytical.`;
}

export async function runInvestigation(investigationId: number, subject: SubjectDetails): Promise<void> {
  const categories: CategoryType[] = [
    "identity", "social_media", "public_records", "criminal", "dating", "professional",
    "breaches", "dark_web", "financial", "vehicles_assets", "digital_fingerprint",
    "aliases", "media_sentiment", "domain_infrastructure", "court_documents", "professional_verification"
  ];
  const totalSources = OSINT_SOURCES.length;
  let processedSources = 0;

  try {
    await updateInvestigation(investigationId, { status: "running", progress: 0 });

    for (const category of categories) {
      const categorySources = OSINT_SOURCES.filter(s => s.category === category);
      
      for (const source of categorySources) {
        await updateInvestigation(investigationId, {
          currentSource: source.name,
          progress: Math.round((processedSources / totalSources) * 100),
        });
        processedSources++;
      }

      // Run LLM for this category
      const prompt = buildInvestigationPrompt(subject, categorySources);
      
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an OSINT intelligence analyst. Respond with valid JSON arrays only. No markdown, no code blocks, just raw JSON." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "osint_findings",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                        source: { type: "string" },
                        sourceUrl: { type: "string" },
                        confidence: { type: "string", enum: ["high", "medium", "low"] },
                        date: { type: ["string", "null"] },
                        location: { type: ["string", "null"] },
                        relatedEntities: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "content", "source", "sourceUrl", "confidence", "date", "location", "relatedEntities"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["findings"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (content && typeof content === "string") {
          const parsed = JSON.parse(content);
          const findingsArray = parsed.findings || parsed;
          
          if (Array.isArray(findingsArray) && findingsArray.length > 0) {
            const dbFindings: InsertFinding[] = findingsArray.map((f: any) => ({
              investigationId,
              category,
              title: f.title || "Unknown Finding",
              content: f.content || "",
              source: f.source || "Unknown Source",
              sourceUrl: f.sourceUrl || null,
              confidence: (["high", "medium", "low"].includes(f.confidence) ? f.confidence : "medium") as "high" | "medium" | "low",
              sourceReliability: assignSourceReliability(f.source || "", f.confidence || "medium"),
              corroborationCount: 1,
              metadata: {
                date: f.date || null,
                location: f.location || null,
                relatedEntities: f.relatedEntities || [],
              },
            }));

            await addFindings(dbFindings);
          }
        }
      } catch (llmError) {
        console.error(`[OSINT] LLM error for category ${category}:`, llmError);
      }

      await updateInvestigation(investigationId, {
        progress: Math.round((processedSources / totalSources) * 100),
      });
    }

    // Post-processing: advanced intelligence analysis
    await postProcessInvestigation(investigationId, subject);

    await updateInvestigation(investigationId, {
      status: "completed",
      progress: 100,
      currentSource: null,
      completedAt: new Date(),
    });
  } catch (error) {
    console.error("[OSINT] Investigation failed:", error);
    await updateInvestigation(investigationId, { status: "failed", currentSource: null });
  }
}

async function postProcessInvestigation(investigationId: number, subject: SubjectDetails): Promise<void> {
  await updateInvestigation(investigationId, { currentSource: "Running Advanced Intelligence Analysis..." });

  const allFindings = await getInvestigationFindings(investigationId);

  // Compute basic scores
  const riskBreakdown = computeRiskScore(allFindings);
  const totalRiskScore = Math.min(100, Math.round(
    (riskBreakdown.identity || 0) * 0.05 +
    (riskBreakdown.socialMedia || 0) * 0.1 +
    (riskBreakdown.publicRecords || 0) * 0.1 +
    (riskBreakdown.criminal || 0) * 0.2 +
    (riskBreakdown.dating || 0) * 0.03 +
    (riskBreakdown.professional || 0) * 0.07 +
    (riskBreakdown.breaches || 0) * 0.1 +
    (riskBreakdown.darkWeb || 0) * 0.1 +
    (riskBreakdown.financial || 0) * 0.08 +
    (riskBreakdown.vehiclesAssets || 0) * 0.02 +
    (riskBreakdown.digitalFingerprint || 0) * 0.05 +
    (riskBreakdown.courtDocuments || 0) * 0.1
  ));

  const relationships = extractRelationships(allFindings, subject);
  const timeline = buildTimeline(allFindings);
  const geolocations = extractGeolocations(allFindings, subject);
  await computeCorroboration(allFindings);

  // Run advanced analysis via LLM
  let advancedAnalysis: any = {};
  try {
    await updateInvestigation(investigationId, { currentSource: "Generating Executive Summary & Threat Matrix..." });
    const analysisPrompt = buildAdvancedAnalysisPrompt(subject, allFindings);
    const analysisResponse = await invokeLLM({
      messages: [
        { role: "system", content: "You are a senior intelligence analyst. Respond with valid JSON only." },
        { role: "user", content: analysisPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const analysisContent = analysisResponse.choices[0]?.message?.content;
    if (analysisContent && typeof analysisContent === "string") {
      advancedAnalysis = JSON.parse(analysisContent);
    }
  } catch (e) {
    console.error("[OSINT] Advanced analysis error:", e);
  }

  await updateInvestigation(investigationId, {
    riskScore: totalRiskScore,
    riskBreakdown,
    relationships,
    timeline,
    geolocations,
    executiveSummary: advancedAnalysis.executiveSummary || null,
    patternOfLife: advancedAnalysis.patternOfLife || null,
    communicationPatterns: advancedAnalysis.communicationPatterns || null,
    threatMatrix: advancedAnalysis.threatMatrix || null,
    deceptionIndicators: advancedAnalysis.deceptionIndicators || null,
    networkAnalysis: advancedAnalysis.networkAnalysis || null,
    aliases: advancedAnalysis.aliases || null,
    financialFootprint: null,
    vehicleAssets: null,
    digitalFingerprint: null,
    mediaSentiment: null,
    domainInfrastructure: null,
    courtDocuments: null,
    professionalVerification: null,
  });
}

function computeRiskScore(findings: any[]): Record<string, number> {
  const categoryScores: Record<string, number> = {
    identity: 0, socialMedia: 0, publicRecords: 0, criminal: 0,
    dating: 0, professional: 0, breaches: 0, darkWeb: 0,
    financial: 0, vehiclesAssets: 0, digitalFingerprint: 0,
    aliases: 0, mediaSentiment: 0, domainInfrastructure: 0,
    courtDocuments: 0, professionalVerification: 0,
  };

  const categoryMap: Record<string, string> = {
    identity: "identity", social_media: "socialMedia", public_records: "publicRecords",
    criminal: "criminal", dating: "dating", professional: "professional",
    breaches: "breaches", dark_web: "darkWeb", financial: "financial",
    vehicles_assets: "vehiclesAssets", digital_fingerprint: "digitalFingerprint",
    aliases: "aliases", media_sentiment: "mediaSentiment",
    domain_infrastructure: "domainInfrastructure", court_documents: "courtDocuments",
    professional_verification: "professionalVerification",
  };

  for (const finding of findings) {
    const key = categoryMap[finding.category] || finding.category;
    const weight = finding.confidence === "high" ? 15 : finding.confidence === "medium" ? 10 : 5;
    if (categoryScores[key] !== undefined) {
      categoryScores[key] = Math.min(100, categoryScores[key] + weight);
    }
  }
  return categoryScores;
}

function extractRelationships(findings: any[], subject: SubjectDetails): any[] {
  const relationships: any[] = [{ id: "subject", name: subject.name, type: "subject", connections: [] }];
  const seenEntities = new Set<string>();

  for (const finding of findings) {
    const metadata = finding.metadata as any;
    if (metadata?.relatedEntities && Array.isArray(metadata.relatedEntities)) {
      for (const entity of metadata.relatedEntities) {
        if (!seenEntities.has(entity.toLowerCase()) && entity.toLowerCase() !== subject.name.toLowerCase()) {
          seenEntities.add(entity.toLowerCase());
          relationships.push({
            id: `entity-${relationships.length}`,
            name: entity,
            type: inferEntityType(entity, finding.category),
            category: finding.category,
            connection: finding.title,
          });
        }
      }
    }
  }
  return relationships;
}

function inferEntityType(entity: string, category: string): string {
  if (category === "professional" || category === "financial") return "organization";
  if (category === "public_records") return "associate";
  if (entity.includes("Inc") || entity.includes("LLC") || entity.includes("Corp")) return "organization";
  return "person";
}

function buildTimeline(findings: any[]): any[] {
  const events: any[] = [];
  for (const finding of findings) {
    const metadata = finding.metadata as any;
    if (metadata?.date) {
      events.push({
        date: metadata.date,
        title: finding.title,
        category: finding.category,
        content: finding.content.substring(0, 150),
        source: finding.source,
      });
    }
  }
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return events;
}

function extractGeolocations(findings: any[], subject: SubjectDetails): any[] {
  const locations: any[] = [];
  const seen = new Set<string>();

  if (subject.location) {
    locations.push({ location: subject.location, type: "known_address", source: "User Input", label: "Known Location" });
    seen.add(subject.location.toLowerCase());
  }

  for (const finding of findings) {
    const metadata = finding.metadata as any;
    if (metadata?.location && !seen.has(metadata.location.toLowerCase())) {
      seen.add(metadata.location.toLowerCase());
      locations.push({ location: metadata.location, type: finding.category, source: finding.source, label: finding.title });
    }
  }
  return locations;
}

async function computeCorroboration(findings: any[]): Promise<void> {
  const entityMentions = new Map<string, number[]>();
  for (let i = 0; i < findings.length; i++) {
    const metadata = findings[i].metadata as any;
    if (metadata?.relatedEntities) {
      for (const entity of metadata.relatedEntities) {
        const key = entity.toLowerCase();
        if (!entityMentions.has(key)) entityMentions.set(key, []);
        entityMentions.get(key)!.push(i);
      }
    }
  }
  for (const [, indices] of Array.from(entityMentions)) {
    if (indices.length > 1) {
      for (const idx of indices) {
        findings[idx].corroborationCount = Math.max(findings[idx].corroborationCount || 1, indices.length);
      }
    }
  }
}

export function getOSINTSources(): OSINTSource[] {
  return OSINT_SOURCES;
}
