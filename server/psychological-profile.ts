/**
 * Psychological Profile Generator
 * Analyzes social media posts to build personality profile, behavioral patterns, and risk indicators
 */

import { Finding } from "../drizzle/schema";

export interface PersonalityTraits {
  openness: number; // 0-100: Creativity, curiosity, intellectual interest
  conscientiousness: number; // 0-100: Organization, discipline, responsibility
  extraversion: number; // 0-100: Sociability, assertiveness, activity level
  agreeableness: number; // 0-100: Compassion, cooperation, trust
  neuroticism: number; // 0-100: Anxiety, sadness, emotional instability
}

export interface PsychologicalRiskIndicators {
  depressionIndicators: number; // 0-100
  anxietyIndicators: number; // 0-100
  violenceIndicators: number; // 0-100
  suicidalIdeationIndicators: number; // 0-100
  substanceAbuseIndicators: number; // 0-100
  paranoidThinkingIndicators: number; // 0-100
  narcissismIndicators: number; // 0-100
  psychopathyIndicators: number; // 0-100
}

export interface EmotionalStateSnapshot {
  date: string;
  sentiment: "very_positive" | "positive" | "neutral" | "negative" | "very_negative";
  emotionalIntensity: number; // 0-100
  dominantEmotions: string[]; // e.g., ["happiness", "excitement", "anger"]
  postCount: number;
  averageEngagement: number;
}

export interface PsychologicalProfile {
  personalityTraits: PersonalityTraits;
  riskIndicators: PsychologicalRiskIndicators;
  emotionalTimeline: EmotionalStateSnapshot[];
  communicationStyle: {
    averagePostLength: number;
    postingFrequency: string; // "daily", "weekly", "sporadic"
    responseTime: string; // "immediate", "delayed", "inconsistent"
    interactionStyle: string; // "aggressive", "assertive", "passive", "neutral"
    vocabularyLevel: string; // "basic", "intermediate", "advanced", "highly educated"
    uniqueLanguagePatterns: string[];
  };
  dominantThemes: string[]; // Most common topics in posts
  concernFlags: string[]; // Red flags from analysis
  overallPsychologicalProfile: string; // Summary narrative
}

/**
 * Analyze social media posts for psychological insights
 */
export function analyzePsychologicalProfile(socialMediaFindings: Finding[]): PsychologicalProfile {
  // Extract post content from findings
  const postTexts = socialMediaFindings.map(f => f.content).join(" ");

  // Calculate personality traits from post analysis
  const personalityTraits = analyzePersonalityTraits(postTexts);

  // Identify psychological risk indicators
  const riskIndicators = identifyRiskIndicators(postTexts);

  // Build emotional state timeline
  const emotionalTimeline = buildEmotionalTimeline(socialMediaFindings);

  // Analyze communication style
  const communicationStyle = analyzeCommunicationStyle(postTexts, socialMediaFindings);

  // Extract dominant themes
  const dominantThemes = extractDominantThemes(postTexts);

  // Identify concern flags
  const concernFlags = identifyConcernFlags(postTexts, riskIndicators);

  // Generate overall profile narrative
  const overallPsychologicalProfile = generateProfileNarrative(
    personalityTraits,
    riskIndicators,
    dominantThemes,
    concernFlags
  );

  return {
    personalityTraits,
    riskIndicators,
    emotionalTimeline,
    communicationStyle,
    dominantThemes,
    concernFlags,
    overallPsychologicalProfile,
  };
}

/**
 * Analyze Big Five personality traits from text
 */
function analyzePersonalityTraits(text: string): PersonalityTraits {
  const lowerText = text.toLowerCase();

  // Openness: Creativity, curiosity, intellectual interest
  const opennessKeywords = ["curious", "explore", "imagine", "creative", "art", "philosophy", "experiment", "novel", "unique"];
  const openness = Math.min(
    100,
    (opennessKeywords.filter(k => lowerText.includes(k)).length / opennessKeywords.length) * 100 + 30
  );

  // Conscientiousness: Organization, discipline, responsibility
  const conscientiousnessKeywords = ["plan", "schedule", "organized", "responsible", "deadline", "careful", "detail", "prepared"];
  const conscientiousness = Math.min(
    100,
    (conscientiousnessKeywords.filter(k => lowerText.includes(k)).length / conscientiousnessKeywords.length) * 100 + 30
  );

  // Extraversion: Sociability, assertiveness, activity level
  const extraversionKeywords = ["party", "social", "friend", "event", "outgoing", "active", "adventure", "group", "together"];
  const extraversion = Math.min(
    100,
    (extraversionKeywords.filter(k => lowerText.includes(k)).length / extraversionKeywords.length) * 100 + 30
  );

  // Agreeableness: Compassion, cooperation, trust
  const agreeablenessKeywords = ["help", "support", "kind", "compassion", "cooperate", "trust", "grateful", "appreciate"];
  const agreeableness = Math.min(
    100,
    (agreeablenessKeywords.filter(k => lowerText.includes(k)).length / agreeablenessKeywords.length) * 100 + 30
  );

  // Neuroticism: Anxiety, sadness, emotional instability
  const neuroticismKeywords = ["anxious", "worried", "stressed", "sad", "depressed", "angry", "frustrated", "overwhelmed"];
  const neuroticism = Math.min(
    100,
    (neuroticismKeywords.filter(k => lowerText.includes(k)).length / neuroticismKeywords.length) * 100 + 30
  );

  return {
    openness: Math.round(openness),
    conscientiousness: Math.round(conscientiousness),
    extraversion: Math.round(extraversion),
    agreeableness: Math.round(agreeableness),
    neuroticism: Math.round(neuroticism),
  };
}

/**
 * Identify psychological risk indicators
 */
function identifyRiskIndicators(text: string): PsychologicalRiskIndicators {
  const lowerText = text.toLowerCase();

  // Depression indicators
  const depressionKeywords = ["depressed", "hopeless", "worthless", "sad", "empty", "numb", "suicidal", "end it"];
  const depressionIndicators = Math.min(
    100,
    (depressionKeywords.filter(k => lowerText.includes(k)).length / depressionKeywords.length) * 100 + 20
  );

  // Anxiety indicators
  const anxietyKeywords = ["anxious", "panic", "worried", "nervous", "scared", "afraid", "dread", "terror"];
  const anxietyIndicators = Math.min(
    100,
    (anxietyKeywords.filter(k => lowerText.includes(k)).length / anxietyKeywords.length) * 100 + 20
  );

  // Violence indicators
  const violenceKeywords = ["kill", "hurt", "attack", "destroy", "violent", "rage", "hate", "revenge"];
  const violenceIndicators = Math.min(
    100,
    (violenceKeywords.filter(k => lowerText.includes(k)).length / violenceKeywords.length) * 100 + 15
  );

  // Suicidal ideation
  const suicidalKeywords = ["suicide", "kill myself", "end it", "no point", "better off dead"];
  const suicidalIdeationIndicators = Math.min(
    100,
    (suicidalKeywords.filter(k => lowerText.includes(k)).length / suicidalKeywords.length) * 100 + 10
  );

  // Substance abuse indicators
  const substanceKeywords = ["drugs", "alcohol", "high", "drunk", "weed", "cocaine", "heroin", "addiction"];
  const substanceAbuseIndicators = Math.min(
    100,
    (substanceKeywords.filter(k => lowerText.includes(k)).length / substanceKeywords.length) * 100 + 15
  );

  // Paranoid thinking
  const paranoidKeywords = ["conspiracy", "government", "tracking", "spying", "controlled", "fake", "lies"];
  const paranoidThinkingIndicators = Math.min(
    100,
    (paranoidKeywords.filter(k => lowerText.includes(k)).length / paranoidKeywords.length) * 100 + 15
  );

  // Narcissism indicators
  const narcissismKeywords = ["superior", "best", "genius", "special", "deserve", "admire me", "perfect"];
  const narcissismIndicators = Math.min(
    100,
    (narcissismKeywords.filter(k => lowerText.includes(k)).length / narcissismKeywords.length) * 100 + 20
  );

  // Psychopathy indicators (lack of empathy, manipulation, charm)
  const psychopathyKeywords = ["manipulate", "control", "exploit", "no remorse", "charm", "lie", "deceive"];
  const psychopathyIndicators = Math.min(
    100,
    (psychopathyKeywords.filter(k => lowerText.includes(k)).length / psychopathyKeywords.length) * 100 + 15
  );

  return {
    depressionIndicators: Math.round(depressionIndicators),
    anxietyIndicators: Math.round(anxietyIndicators),
    violenceIndicators: Math.round(violenceIndicators),
    suicidalIdeationIndicators: Math.round(suicidalIdeationIndicators),
    substanceAbuseIndicators: Math.round(substanceAbuseIndicators),
    paranoidThinkingIndicators: Math.round(paranoidThinkingIndicators),
    narcissismIndicators: Math.round(narcissismIndicators),
    psychopathyIndicators: Math.round(psychopathyIndicators),
  };
}

/**
 * Build emotional state timeline from posts
 */
function buildEmotionalTimeline(findings: Finding[]): EmotionalStateSnapshot[] {
  const timeline: EmotionalStateSnapshot[] = [];

  // Group findings by date (simplified)
  const grouped: { [key: string]: Finding[] } = {};
  for (const finding of findings) {
    const dateStr = new Date().toISOString().split("T")[0]; // Simplified
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(finding);
  }

  // Analyze each date group
  for (const [date, dateFindings] of Object.entries(grouped)) {
    const content = dateFindings.map(f => f.content).join(" ");
    const sentiment = analyzeSentiment(content);
    const emotions = extractEmotions(content);

    timeline.push({
      date,
      sentiment,
      emotionalIntensity: Math.round(Math.random() * 100), // Simplified
      dominantEmotions: emotions,
      postCount: dateFindings.length,
      averageEngagement: Math.round(Math.random() * 100), // Simplified
    });
  }

  return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Analyze sentiment of text
 */
function analyzeSentiment(text: string): "very_positive" | "positive" | "neutral" | "negative" | "very_negative" {
  const lowerText = text.toLowerCase();
  const positiveWords = ["happy", "great", "love", "amazing", "wonderful", "excellent", "good"];
  const negativeWords = ["sad", "hate", "terrible", "awful", "bad", "horrible", "angry"];

  const posCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negCount = negativeWords.filter(w => lowerText.includes(w)).length;

  if (posCount > negCount + 2) return "very_positive";
  if (posCount > negCount) return "positive";
  if (negCount > posCount + 2) return "very_negative";
  if (negCount > posCount) return "negative";
  return "neutral";
}

/**
 * Extract dominant emotions from text
 */
function extractEmotions(text: string): string[] {
  const emotions: string[] = [];
  const emotionKeywords: { [key: string]: string[] } = {
    happiness: ["happy", "joy", "excited", "cheerful", "delighted"],
    sadness: ["sad", "depressed", "unhappy", "miserable", "down"],
    anger: ["angry", "furious", "rage", "mad", "irritated"],
    fear: ["scared", "afraid", "terrified", "anxious", "nervous"],
    surprise: ["surprised", "shocked", "amazed", "astonished", "stunned"],
    disgust: ["disgusted", "repulsed", "gross", "yuck", "nasty"],
  };

  const lowerText = text.toLowerCase();
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(k => lowerText.includes(k))) {
      emotions.push(emotion);
    }
  }

  return emotions.length > 0 ? emotions : ["neutral"];
}

/**
 * Analyze communication style
 */
function analyzeCommunicationStyle(text: string, findings: Finding[]) {
  const words = text.split(" ");
  const averagePostLength = Math.round(words.length / Math.max(findings.length, 1));

  // Determine vocabulary level
  const advancedWords = words.filter(w => w.length > 8).length;
  const vocabularyLevel =
    advancedWords / words.length > 0.3
      ? "highly educated"
      : advancedWords / words.length > 0.2
        ? "advanced"
        : advancedWords / words.length > 0.1
          ? "intermediate"
          : "basic";

  // Posting frequency
  const postingFrequency = findings.length > 10 ? "daily" : findings.length > 5 ? "weekly" : "sporadic";

  // Interaction style
  const lowerText = text.toLowerCase();
  const aggressiveWords = ["attack", "stupid", "idiot", "hate", "kill"];
  const assertiveWords = ["disagree", "challenge", "argue", "debate"];
  const passiveWords = ["sorry", "maybe", "perhaps", "think", "feel"];

  let interactionStyle = "neutral";
  if (aggressiveWords.some(w => lowerText.includes(w))) interactionStyle = "aggressive";
  else if (assertiveWords.some(w => lowerText.includes(w))) interactionStyle = "assertive";
  else if (passiveWords.some(w => lowerText.includes(w))) interactionStyle = "passive";

  return {
    averagePostLength,
    postingFrequency,
    responseTime: "inconsistent", // Simplified
    interactionStyle,
    vocabularyLevel,
    uniqueLanguagePatterns: ["uses_emojis", "frequent_hashtags", "all_caps_emphasis"],
  };
}

/**
 * Extract dominant themes from posts
 */
function extractDominantThemes(text: string): string[] {
  const themes: string[] = [];
  const themeKeywords: { [key: string]: string[] } = {
    work: ["job", "work", "career", "boss", "office", "project"],
    relationships: ["girlfriend", "boyfriend", "wife", "husband", "dating", "love"],
    politics: ["vote", "election", "political", "government", "president"],
    sports: ["game", "team", "score", "player", "coach", "win"],
    technology: ["tech", "code", "software", "computer", "app", "programming"],
    health: ["exercise", "diet", "fitness", "health", "gym", "workout"],
    travel: ["trip", "vacation", "travel", "flight", "hotel", "destination"],
    family: ["mom", "dad", "brother", "sister", "family", "parent"],
  };

  const lowerText = text.toLowerCase();
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(k => lowerText.includes(k))) {
      themes.push(theme);
    }
  }

  return themes;
}

/**
 * Identify concern flags
 */
function identifyConcernFlags(text: string, riskIndicators: PsychologicalRiskIndicators): string[] {
  const flags: string[] = [];

  if (riskIndicators.suicidalIdeationIndicators > 50) flags.push("Suicidal ideation detected");
  if (riskIndicators.violenceIndicators > 60) flags.push("Violence risk indicators present");
  if (riskIndicators.depressionIndicators > 70) flags.push("Severe depression indicators");
  if (riskIndicators.paranoidThinkingIndicators > 65) flags.push("Paranoid thinking patterns");
  if (riskIndicators.psychopathyIndicators > 70) flags.push("Psychopathic traits detected");
  if (riskIndicators.substanceAbuseIndicators > 60) flags.push("Substance abuse indicators");

  return flags;
}

/**
 * Generate overall profile narrative
 */
function generateProfileNarrative(
  traits: PersonalityTraits,
  risks: PsychologicalRiskIndicators,
  themes: string[],
  flags: string[]
): string {
  let narrative = "";

  // Personality summary
  const highTraits = Object.entries(traits)
    .filter(([_, v]) => v > 60)
    .map(([k]) => k);
  const lowTraits = Object.entries(traits)
    .filter(([_, v]) => v < 40)
    .map(([k]) => k);

  narrative += `Subject exhibits high levels of ${highTraits.join(", ")} and lower levels of ${lowTraits.join(", ")}. `;

  // Risk summary
  const highRisks = Object.entries(risks)
    .filter(([_, v]) => v > 60)
    .map(([k]) => k.replace("Indicators", ""));
  if (highRisks.length > 0) {
    narrative += `Risk assessment identifies elevated indicators in: ${highRisks.join(", ")}. `;
  }

  // Theme summary
  if (themes.length > 0) {
    narrative += `Primary interests and discussion topics include: ${themes.join(", ")}. `;
  }

  // Concern flags
  if (flags.length > 0) {
    narrative += `ALERTS: ${flags.join("; ")}. `;
  }

  narrative += "This profile should be considered in conjunction with other intelligence findings.";

  return narrative;
}
