import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { alertClient } from '@/lib/websocket-alerts';

interface Alert {
  id: string;
  timestamp: Date;
  source: 'twitter' | 'instagram' | 'facebook' | 'reddit' | 'tiktok' | 'linkedin';
  type: 'new_post' | 'profile_change' | 'mention' | 'comment' | 'follow' | string;
  title: string;
  description: string;
  url?: string;
  read: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface RealtimeMonitoringProps {
  investigationId: string;
  isMonitoring: boolean;
  onToggleMonitoring?: (enabled: boolean) => void;
}

export function RealtimeMonitoring({
  investigationId,
  isMonitoring,
  onToggleMonitoring,
}: RealtimeMonitoringProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [subjectName, setSubjectName] = useState('Subject');

  // Connect to alert system when monitoring starts
  useEffect(() => {
    if (!isMonitoring) {
      alertClient.disconnect();
      setIsConnected(false);
      return;
    }

    // Extract subject name from investigationId if available
    const name = localStorage.getItem(`investigation-${investigationId}-subject`) || 'Subject';
    setSubjectName(name);

    // Connect to alerts
    alertClient.connect(parseInt(investigationId), name).then(() => {
      setIsConnected(true);
    });

    // Subscribe to new alerts
    const unsubscribe = alertClient.onAlert((message) => {
      if (message.type === 'new_alert') {
        const newAlert: Alert = {
          id: message.data.id,
          timestamp: new Date(message.data.timestamp),
          source: message.data.platform,
          type: message.data.type,
          title: message.data.title,
          description: message.data.description,
          url: message.data.url,
          read: false,
          severity: message.data.severity,
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
      }
    });

    return () => {
      unsubscribe();
      alertClient.disconnect();
    };
  }, [isMonitoring, investigationId]);

  const sourceColors: Record<string, string> = {
    twitter: 'bg-blue-500',
    instagram: 'bg-pink-500',
    facebook: 'bg-blue-600',
    reddit: 'bg-orange-500',
    tiktok: 'bg-black',
    linkedin: 'bg-blue-700',
  };

  const severityColors: Record<string, string> = {
    low: 'border-blue-500/50 bg-blue-900/20',
    medium: 'border-yellow-500/50 bg-yellow-900/20',
    high: 'border-orange-500/50 bg-orange-900/20',
    critical: 'border-red-500/50 bg-red-900/20',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    new_post: '📝',
    profile_change: '✏️',
    profile_update: '✏️',
    mention: '🔔',
    comment: '💬',
    follow: '👥',
    follower_change: '👥',
    engagement_spike: '📈',
    location_checkin: '📍',
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })));
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-white">Real-time Monitoring</h3>
              <p className="text-sm text-slate-400">
                {isMonitoring ? 'Actively monitoring' : 'Monitoring disabled'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => onToggleMonitoring?.(!isMonitoring)}
            variant={isMonitoring ? 'default' : 'outline'}
            className="gap-2"
          >
            {isMonitoring ? '⏸ Stop' : '▶ Start'} Monitoring
          </Button>
        </div>

        {isMonitoring && (
          <div
            className={`border rounded-lg p-3 mb-4 flex items-center gap-2 ${
              isConnected
                ? 'bg-green-900/20 border-green-700'
                : 'bg-yellow-900/20 border-yellow-700'
            }`}
          >
            {isConnected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-300">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Live monitoring active. Real-time alerts enabled.
                </span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
                <span className="text-sm text-yellow-300">
                  Connecting to alert system...
                </span>
              </>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">Recent Alerts</h3>
            {unreadCount > 0 && (
              <Badge className="bg-red-600 text-white">{unreadCount} new</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 hover:text-white"
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No alerts yet. Enable monitoring to start tracking.</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => markAsRead(alert.id)}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  alert.read
                    ? 'bg-slate-700/50 border-slate-600'
                    : alert.severity
                    ? severityColors[alert.severity] || 'bg-slate-700 border-slate-500 ring-1 ring-blue-500/50'
                    : 'bg-slate-700 border-slate-500 ring-1 ring-blue-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sourceColors[alert.source]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm">{typeIcons[alert.type] || '🔔'}</span>
                      <span className="font-medium text-white text-sm">{alert.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {alert.source}
                      </Badge>
                      {alert.severity && (
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${
                            alert.severity === 'critical'
                              ? 'border-red-500 text-red-400'
                              : alert.severity === 'high'
                              ? 'border-orange-500 text-orange-400'
                              : alert.severity === 'medium'
                              ? 'border-yellow-500 text-yellow-400'
                              : 'border-blue-500 text-blue-400'
                          }`}
                        >
                          {alert.severity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 truncate">{alert.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatTime(alert.timestamp)}</p>
                  </div>
                  {alert.url && (
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs flex-shrink-0"
                    >
                      View →
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
