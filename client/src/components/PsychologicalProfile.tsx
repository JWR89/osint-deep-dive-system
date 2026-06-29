import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, Brain, Heart } from "lucide-react";
import type { PsychologicalProfile } from "../../../server/osint-engine";

interface PsychologicalProfileProps {
  profile: PsychologicalProfile;
}

export default function PsychologicalProfileComponent({ profile }: PsychologicalProfileProps) {
  const getRiskColor = (score: number): string => {
    if (score >= 70) return "text-red-500";
    if (score >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  const getRiskBgColor = (score: number): string => {
    if (score >= 70) return "bg-red-50";
    if (score >= 50) return "bg-yellow-50";
    return "bg-green-50";
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Psychological Profile Summary
          </CardTitle>
          <CardDescription>AI-generated personality and behavioral analysis based on social media activity</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 leading-relaxed">{profile.overallPsychologicalProfile}</p>
        </CardContent>
      </Card>

      {/* Concern Flags */}
      {profile.concernFlags.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-2">⚠️ Concern Flags Detected</div>
            <ul className="list-disc list-inside space-y-1">
              {profile.concernFlags.map((flag, idx) => (
                <li key={idx} className="text-sm">
                  {flag}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Big Five Personality Traits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Big Five Personality Traits</CardTitle>
          <CardDescription>Inferred from social media communication patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(profile.personalityTraits).map(([trait, score]) => (
            <div key={trait}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium capitalize">{trait.replace(/_/g, " ")}</label>
                <span className="text-sm font-semibold">{score}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Psychological Risk Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Psychological Risk Indicators</CardTitle>
          <CardDescription>Potential mental health and behavioral risk factors</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(profile.riskIndicators).map(([indicator, score]) => (
            <div
              key={indicator}
              className={`p-3 rounded-lg border ${getRiskBgColor(score)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{indicator.replace(/_/g, " ")}</p>
                </div>
                <span className={`text-lg font-bold ${getRiskColor(score)}`}>{score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    score >= 70 ? "bg-red-500" : score >= 50 ? "bg-yellow-500" : "bg-green-500"
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Communication Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Communication Style & Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Average Post Length</p>
              <p className="text-lg font-semibold">{profile.communicationStyle.averagePostLength} words</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Posting Frequency</p>
              <Badge variant="outline" className="mt-1">
                {profile.communicationStyle.postingFrequency}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Interaction Style</p>
              <Badge variant="outline" className="mt-1">
                {profile.communicationStyle.interactionStyle}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vocabulary Level</p>
              <Badge variant="outline" className="mt-1">
                {profile.communicationStyle.vocabularyLevel}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Unique Language Patterns</p>
            <div className="flex flex-wrap gap-2">
              {profile.communicationStyle.uniqueLanguagePatterns.map((pattern, idx) => (
                <Badge key={idx} variant="secondary">
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dominant Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dominant Discussion Themes</CardTitle>
          <CardDescription>Primary topics and interests from social media activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.dominantThemes.map((theme, idx) => (
              <Badge key={idx} className="bg-purple-100 text-purple-800">
                {theme}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emotional Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Emotional State Timeline
          </CardTitle>
          <CardDescription>Sentiment and emotional intensity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profile.emotionalTimeline.map((snapshot, idx) => (
              <div key={idx} className="border-l-4 border-blue-300 pl-4 py-2">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium">{snapshot.date}</p>
                  <Badge
                    variant="outline"
                    className={
                      snapshot.sentiment === "very_positive"
                        ? "bg-green-50 text-green-700"
                        : snapshot.sentiment === "positive"
                          ? "bg-blue-50 text-blue-700"
                          : snapshot.sentiment === "neutral"
                            ? "bg-gray-50 text-gray-700"
                            : snapshot.sentiment === "negative"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-red-50 text-red-700"
                    }
                  >
                    {snapshot.sentiment.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {snapshot.postCount} posts • Intensity: {snapshot.emotionalIntensity}/100
                </p>
                <div className="flex flex-wrap gap-1">
                  {snapshot.dominantEmotions.map((emotion, eidx) => (
                    <Badge key={eidx} variant="secondary" className="text-xs">
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stress Triggers & Vulnerabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inferred Stress Triggers & Vulnerabilities</CardTitle>
          <CardDescription>Topics and situations that may cause negative reactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profile.riskIndicators.depressionIndicators > 50 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-medium text-red-900">Depression-related topics</p>
                <p className="text-xs text-red-700 mt-1">Subject shows elevated depression indicators. Avoid topics related to failure, loss, or hopelessness.</p>
              </div>
            )}
            {profile.riskIndicators.anxietyIndicators > 50 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm font-medium text-yellow-900">Anxiety-triggering topics</p>
                <p className="text-xs text-yellow-700 mt-1">Subject shows elevated anxiety indicators. Avoid uncertainty, criticism, or high-pressure situations.</p>
              </div>
            )}
            {profile.riskIndicators.violenceIndicators > 50 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-medium text-red-900">Violence risk factors</p>
                <p className="text-xs text-red-700 mt-1">Subject shows elevated violence indicators. Exercise caution in interactions.</p>
              </div>
            )}
            {profile.riskIndicators.narcissismIndicators > 60 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-sm font-medium text-orange-900">Narcissistic traits</p>
                <p className="text-xs text-orange-700 mt-1">Subject shows narcissistic traits. May be sensitive to criticism or perceived slights.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
