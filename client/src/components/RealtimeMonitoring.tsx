import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface Alert {
  id: string;
  timestamp: Date;
  source: 'twitter' | 'instagram' | 'facebook' | 'reddit' | 'tiktok' | 'linkedin';
  type: 'new_post' | 'profile_change' | 'mention' | 'comment' | 'follow';
  title: string;
  description: string;
  url?: string;
  read: boolean;
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
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60000),
      source: 'twitter',
      type: 'new_post',
      title: 'New Tweet Posted',
      description: 'Subject posted: "Just finished an amazing project at work"',
      url: 'https://twitter.com/example',
      read: false,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60000),
      source: 'instagram',
      type: 'profile_change',
      title: 'Profile Bio Updated',
      description: 'Bio changed from "Designer" to "Designer | Photographer"',
      read: false,
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1 * 3600000),
      source: 'reddit',
      type: 'mention',
      title: 'Subject Mentioned',
      description: 'Subject mentioned in r/technology thread about AI',
      url: 'https://reddit.com/r/technology',
      read: true,
    },
  ]);

  const sourceColors: Record<string, string> = {
    twitter: 'bg-blue-500',
    instagram: 'bg-pink-500',
    facebook: 'bg-blue-600',
    reddit: 'bg-orange-500',
    tiktok: 'bg-black',
    linkedin: 'bg-blue-700',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    new_post: '📝',
    profile_change: '✏️',
    mention: '🔔',
    comment: '💬',
    follow: '👥',
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
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-300">
              Monitoring active. Checking for updates every 5 minutes.
            </span>
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
                    : 'bg-slate-700 border-slate-500 ring-1 ring-blue-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sourceColors[alert.source]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{typeIcons[alert.type]}</span>
                      <span className="font-medium text-white text-sm">{alert.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {alert.source}
                      </Badge>
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
