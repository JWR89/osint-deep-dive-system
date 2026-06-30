/**
 * WebSocket Alert System
 * Simulates real-time alerts for monitoring
 * In production, this would connect to a real WebSocket server
 */

export interface AlertMessage {
  type: 'new_alert' | 'alert_batch' | 'monitoring_status' | 'connection' | 'error';
  data: any;
  timestamp: number;
}

type AlertListener = (message: AlertMessage) => void;

class WebSocketAlertClient {
  private listeners: Set<AlertListener> = new Set();
  private isConnected: boolean = false;
  private simulationInterval: NodeJS.Timeout | null = null;
  private investigationId: number | null = null;
  private subjectName: string | null = null;

  /**
   * Connect to the alert system
   */
  connect(investigationId: number, subjectName: string): Promise<void> {
    return new Promise((resolve) => {
      this.investigationId = investigationId;
      this.subjectName = subjectName;
      this.isConnected = true;

      // Notify listeners of connection
      this.notifyListeners({
        type: 'connection',
        data: { status: 'connected', investigationId, subjectName },
        timestamp: Date.now(),
      });

      // Start simulating alerts
      this.startAlertSimulation();

      resolve();
    });
  }

  /**
   * Disconnect from the alert system
   */
  disconnect(): void {
    this.isConnected = false;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    this.notifyListeners({
      type: 'connection',
      data: { status: 'disconnected' },
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to alerts
   */
  onAlert(listener: AlertListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Start simulating alert generation
   */
  private startAlertSimulation(): void {
    // Generate alerts every 30-60 seconds
    this.simulationInterval = setInterval(() => {
      if (!this.isConnected) return;

      const alertTypes = ['new_post', 'profile_update', 'mention', 'follower_change', 'engagement_spike', 'location_checkin'];
      const platforms = ['twitter', 'instagram', 'facebook', 'reddit', 'tiktok', 'linkedin'];
      const severities = ['low', 'medium', 'high', 'critical'];

      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

      const alertTitles: Record<string, string[]> = {
        new_post: ['New post published', 'Status update', 'Photo shared'],
        profile_update: ['Profile changed', 'Bio updated', 'Location updated'],
        mention: ['Subject mentioned', 'Tagged in post', 'Referenced in discussion'],
        follower_change: ['Follower count changed', 'New followers detected', 'Follower activity spike'],
        engagement_spike: ['Engagement spike detected', 'High interaction on post', 'Content trending'],
        location_checkin: ['Location check-in detected', 'Geolocation activity', 'Subject at location'],
      };

      const titles = alertTitles[randomType] || ['New activity'];
      const title = titles[Math.floor(Math.random() * titles.length)];

      this.notifyListeners({
        type: 'new_alert',
        data: {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          investigationId: this.investigationId,
          timestamp: Date.now(),
          platform: randomPlatform,
          type: randomType,
          title,
          severity: randomSeverity,
          description: `${this.subjectName} activity detected on ${randomPlatform}`,
          url: `https://${randomPlatform}.com/${this.subjectName?.toLowerCase().replace(/\s+/g, '')}`,
        },
        timestamp: Date.now(),
      });
    }, 30000 + Math.random() * 30000); // 30-60 seconds
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(message: AlertMessage): void {
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Alert listener error:', error);
      }
    });
  }

  /**
   * Check if connected
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const alertClient = new WebSocketAlertClient();

/**
 * Hook for React components to use alerts
 */
export function useAlerts(investigationId: number, subjectName: string) {
  const [alerts, setAlerts] = React.useState<AlertMessage[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    alertClient.connect(investigationId, subjectName).then(() => {
      setIsConnected(true);
    });

    const unsubscribe = alertClient.onAlert((message) => {
      if (message.type === 'new_alert') {
        setAlerts(prev => [message, ...prev].slice(0, 50)); // Keep last 50
      } else if (message.type === 'connection') {
        setIsConnected(message.data.status === 'connected');
      }
    });

    return () => {
      unsubscribe();
      alertClient.disconnect();
    };
  }, [investigationId, subjectName]);

  return { alerts, isConnected };
}

// Import React for the hook
import React from 'react';
