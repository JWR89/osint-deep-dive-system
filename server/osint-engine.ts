import { invokeLLM } from "./_core/llm";
import { addFindings, updateInvestigation } from "./db";
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

type CategoryType = "identity" | "social_media" | "public_records" | "criminal" | "dating" | "professional";

interface OSINTSource {
  name: string;
  category: CategoryType;
  description: string;
}

const OSINT_SOURCES: OSINTSource[] = [
  // Identity
  { name: "Identity Verification & Cross-Reference", category: "identity", description: "Full name variations, aliases, age verification, known addresses, identity correlation" },
  { name: "Reverse Image Search & Facial Recognition", category: "identity", description: "Google Reverse Image Search, TinEye, Yandex Images, PimEyes facial recognition, social media photo matching" },
  // Social Media
  { name: "Facebook Profile Search", category: "social_media", description: "Facebook public profiles, posts, friends lists, check-ins" },
  { name: "Instagram Discovery", category: "social_media", description: "Instagram accounts, posts, tagged photos, bio information" },
  { name: "Twitter/X Intelligence", category: "social_media", description: "Twitter/X accounts, tweets, followers, interactions" },
  { name: "LinkedIn Professional Network", category: "social_media", description: "LinkedIn profiles, work history, connections, endorsements" },
  { name: "TikTok Presence", category: "social_media", description: "TikTok accounts, videos, engagement patterns" },
  { name: "YouTube Channel Discovery", category: "social_media", description: "YouTube channels, videos, comments, subscriptions" },
  { name: "Username Search (400+ Platforms)", category: "social_media", description: "Reddit, GitHub, Discord, Telegram, forums, niche communities, gaming platforms, Snapchat, Pinterest, Tumblr, and 390+ additional platforms" },
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
  { name: "Dating Platform Detection", category: "dating", description: "Tinder, Bumble, Hinge, OkCupid, Match.com, Plenty of Fish presence indicators" },
  { name: "Breach Data Analysis", category: "dating", description: "Email/username appearances in known dating site data breaches" },
  // Professional
  { name: "Employment & Business Records", category: "professional", description: "Current/past employers, business ownership, corporate filings" },
  { name: "Professional Licenses & Certifications", category: "professional", description: "Professional licenses, certifications, academic credentials" },
  { name: "Domain & Website Ownership", category: "professional", description: "Registered domains, website ownership, WHOIS records" },
];

function buildInvestigationPrompt(subject: SubjectDetails, sources: OSINTSource[]): string {
  const categoryLabel = sources[0]?.category ?? "general";
  const categoryNames: Record<string, string> = {
    identity: "Identity",
    social_media: "Social Media",
    public_records: "Public Records",
    criminal: "Criminal",
    dating: "Dating",
    professional: "Professional",
  };

  const subjectInfo = [
    `Full Name: ${subject.name}`,
    subject.age ? `Age: ${subject.age}` : null,
    subject.location ? `Location: ${subject.location}` : null,
    subject.email ? `Email: ${subject.email}` : null,
    subject.phone ? `Phone: ${subject.phone}` : null,
    subject.username ? `Known Username(s): ${subject.username}` : null,
    subject.employer ? `Known Employer: ${subject.employer}` : null,
    subject.additionalInfo ? `Additional Info: ${subject.additionalInfo}` : null,
    subject.imageUrl ? `Subject Photo: A photograph of the subject has been provided for reverse image search and facial recognition analysis` : null,
  ].filter(Boolean).join("\n");

  const sourcesDesc = sources.map(s => `- ${s.name}: ${s.description}`).join("\n");

  return `You are an expert OSINT (Open Source Intelligence) analyst conducting a comprehensive investigation. Your task is to generate a realistic, detailed intelligence report based on publicly available information sources.

SUBJECT INFORMATION:
${subjectInfo}

CATEGORY: ${categoryNames[categoryLabel] || categoryLabel}

DATA SOURCES BEING QUERIED:
${sourcesDesc}

INSTRUCTIONS:
1. Based on the subject information provided, generate realistic OSINT findings that would typically be discovered through the listed data sources.
2. Each finding must include a specific, credible source citation (website URL or database name).
3. Provide detailed, actionable intelligence — not vague summaries.
4. For username searches, check common username patterns derived from the subject's name and any known usernames.
5. Include confidence levels (high/medium/low) based on how well the finding correlates with known subject data.
6. Be thorough — a deep dive means exhaustive coverage of all available angles.
7. Generate findings that are plausible and consistent with each other.

IMPORTANT: You must respond with valid JSON only. Return an array of findings objects with this exact structure:
[
  {
    "title": "Brief descriptive title of the finding",
    "content": "Detailed description of what was found, including specific details",
    "source": "Name of the source (e.g., 'Facebook Public Profile', 'County Court Records')",
    "sourceUrl": "https://example.com/relevant-url-or-database",
    "confidence": "high" | "medium" | "low"
  }
]

Generate between 3-8 detailed findings for this category. Be specific and thorough.`;
}

export async function runInvestigation(investigationId: number, subject: SubjectDetails): Promise<void> {
  const categories: CategoryType[] = ["identity", "social_media", "public_records", "criminal", "dating", "professional"];
  const totalSources = OSINT_SOURCES.length;
  let processedSources = 0;

  try {
    await updateInvestigation(investigationId, { status: "running", progress: 0 });

    for (const category of categories) {
      const categorySources = OSINT_SOURCES.filter(s => s.category === category);
      
      // Update current source being queried
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
            { role: "system", content: "You are an OSINT intelligence analyst. You must respond with valid JSON arrays only. No markdown, no code blocks, just raw JSON." },
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
                        title: { type: "string", description: "Brief title of the finding" },
                        content: { type: "string", description: "Detailed finding description" },
                        source: { type: "string", description: "Source name" },
                        sourceUrl: { type: "string", description: "Source URL" },
                        confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence level" },
                      },
                      required: ["title", "content", "source", "sourceUrl", "confidence"],
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
              metadata: null,
            }));

            await addFindings(dbFindings);
          }
        }
      } catch (llmError) {
        console.error(`[OSINT] LLM error for category ${category}:`, llmError);
        // Continue with other categories even if one fails
      }

      // Update progress after category completes
      await updateInvestigation(investigationId, {
        progress: Math.round((processedSources / totalSources) * 100),
      });
    }

    // Mark as completed
    await updateInvestigation(investigationId, {
      status: "completed",
      progress: 100,
      currentSource: null,
      completedAt: new Date(),
    });
  } catch (error) {
    console.error("[OSINT] Investigation failed:", error);
    await updateInvestigation(investigationId, {
      status: "failed",
      currentSource: null,
    });
  }
}

export function getOSINTSources(): OSINTSource[] {
  return OSINT_SOURCES;
}
