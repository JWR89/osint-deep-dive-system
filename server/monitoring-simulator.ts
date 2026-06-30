/**
 * Simulated Monitoring System
 * Generates realistic monitoring alerts without requiring external APIs
 */

export interface MonitoringAlert {
  id: string;
  investigationId: number;
  timestamp: number;
  platform: 'twitter' | 'instagram' | 'facebook' | 'reddit' | 'tiktok' | 'linkedin';
  type: 'new_post' | 'profile_update' | 'mention' | 'follower_change' | 'engagement_spike' | 'location_checkin';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
}

const PLATFORMS = ['twitter', 'instagram', 'facebook', 'reddit', 'tiktok', 'linkedin'] as const;

const ALERT_TEMPLATES = {
  new_post: {
    titles: [
      'New post published',
      'Status update',
      'Photo shared',
      'Video uploaded',
      'Link shared',
    ],
    descriptions: [
      'Subject posted new content',
      'New activity detected',
      'Subject shared an update',
      'Public content published',
      'Subject updated profile',
    ],
  },
  profile_update: {
    titles: [
      'Profile information changed',
      'Bio updated',
      'Profile picture changed',
      'Location updated',
      'Relationship status changed',
    ],
    descriptions: [
      'Subject modified profile details',
      'Profile metadata updated',
      'Subject changed account settings',
      'Account information modified',
      'Profile configuration updated',
    ],
  },
  mention: {
    titles: [
      'Subject mentioned in post',
      'Tagged in content',
      'Referenced in discussion',
      'Subject mentioned by others',
      'Tagged by another user',
    ],
    descriptions: [
      'Subject was mentioned by another user',
      'Subject appeared in third-party content',
      'Subject referenced in public discussion',
      'Subject tagged in post',
      'Subject mentioned in comment',
    ],
  },
  follower_change: {
    titles: [
      'Follower count changed',
      'New followers detected',
      'Follower activity spike',
      'Account follow/unfollow',
      'Follower list modified',
    ],
    descriptions: [
      'Subject gained new followers',
      'Follower count increased significantly',
      'New account follows detected',
      'Follower engagement changed',
      'Account follow activity detected',
    ],
  },
  engagement_spike: {
    titles: [
      'Engagement spike detected',
      'High interaction on post',
      'Unusual engagement activity',
      'Content going viral',
      'Engagement surge',
    ],
    descriptions: [
      'Post received unusual engagement',
      'Content is gaining traction',
      'Subject\'s content is trending',
      'Unusual interaction patterns',
      'Engagement metrics spiking',
    ],
  },
  location_checkin: {
    titles: [
      'Location check-in detected',
      'Geolocation activity',
      'Subject at location',
      'Check-in posted',
      'Location shared',
    ],
    descriptions: [
      'Subject checked in at location',
      'Geolocation data detected',
      'Subject shared location',
      'Location-based activity detected',
      'Subject posted from location',
    ],
  },
};

const SEVERITY_WEIGHTS = {
  new_post: 'low' as const,
  profile_update: 'medium' as const,
  mention: 'low' as const,
  follower_change: 'low' as const,
  engagement_spike: 'medium' as const,
  location_checkin: 'high' as const,
};

/**
 * Generate a realistic simulated alert
 */
export function generateSimulatedAlert(
  investigationId: number,
  subjectName: string,
  platformFilter?: string
): MonitoringAlert {
  const platform = platformFilter as any || PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  const alertTypes = Object.keys(ALERT_TEMPLATES) as Array<keyof typeof ALERT_TEMPLATES>;
  const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];

  const templates = ALERT_TEMPLATES[alertType];
  const title = templates.titles[Math.floor(Math.random() * templates.titles.length)];
  const description = templates.descriptions[Math.floor(Math.random() * templates.descriptions.length)];

  // Add randomness to severity (80% base, 20% elevated)
  let severity: 'low' | 'medium' | 'high' | 'critical' = SEVERITY_WEIGHTS[alertType];
  if (Math.random() > 0.8) {
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const currentIndex = severities.indexOf(severity as 'low' | 'medium' | 'high');
    severity = severities[Math.min(currentIndex + 1, severities.length - 1)];
  }

  const sampleContent = [
    `Just finished an amazing project with @${subjectName}`,
    `Can't believe how much has changed. Time flies! #${subjectName}`,
    `New opportunities ahead 🚀 #excited #newchapter`,
    `Grateful for the journey so far`,
    `Working on something big... stay tuned`,
    `Life update coming soon`,
    `Reflecting on recent events`,
    `New chapter beginning`,
  ];

  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    investigationId,
    timestamp: Date.now(),
    platform,
    type: alertType,
    title,
    description,
    severity,
    content: sampleContent[Math.floor(Math.random() * sampleContent.length)],
    url: `https://${platform}.com/${subjectName.toLowerCase().replace(/\s+/g, '')}`,
    metadata: {
      engagementCount: Math.floor(Math.random() * 500),
      reachCount: Math.floor(Math.random() * 5000),
      sourceReliability: ['A1', 'A2', 'B1', 'B2', 'C1'][Math.floor(Math.random() * 5)],
    },
  };
}

/**
 * Generate multiple simulated alerts
 */
export function generateSimulatedAlerts(
  investigationId: number,
  subjectName: string,
  count: number = 5,
  platformFilter?: string
): MonitoringAlert[] {
  const alerts: MonitoringAlert[] = [];
  for (let i = 0; i < count; i++) {
    alerts.push(generateSimulatedAlert(investigationId, subjectName, platformFilter));
  }
  // Sort by timestamp descending (newest first)
  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Simulate alert generation over time
 * Returns a function that generates a new alert each time it's called
 */
export function createAlertGenerator(investigationId: number, subjectName: string) {
  return () => generateSimulatedAlert(investigationId, subjectName);
}

/**
 * Calculate alert statistics
 */
export function calculateAlertStats(alerts: MonitoringAlert[]) {
  const platformCounts = alerts.reduce((acc, alert) => {
    acc[alert.platform] = (acc[alert.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityCounts = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalAlerts: alerts.length,
    platformCounts,
    typeCounts,
    severityCounts,
    criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
    highAlerts: alerts.filter(a => a.severity === 'high').length,
  };
}

/**
 * Filter alerts by criteria
 */
export function filterAlerts(
  alerts: MonitoringAlert[],
  criteria: {
    platform?: string;
    type?: string;
    severity?: string;
    startTime?: number;
    endTime?: number;
  }
): MonitoringAlert[] {
  return alerts.filter(alert => {
    if (criteria.platform && alert.platform !== criteria.platform) return false;
    if (criteria.type && alert.type !== criteria.type) return false;
    if (criteria.severity && alert.severity !== criteria.severity) return false;
    if (criteria.startTime && alert.timestamp < criteria.startTime) return false;
    if (criteria.endTime && alert.timestamp > criteria.endTime) return false;
    return true;
  });
}
