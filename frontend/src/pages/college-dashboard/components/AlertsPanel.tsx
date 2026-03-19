import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

interface Alert {
  id: number;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, any> | null;
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => { loadAlerts(); }, [filterType, showUnreadOnly]);

  const loadAlerts = async () => {
    setIsLoading(true);
    const res = await apiService.getCollegeAlerts(showUnreadOnly, filterType || undefined);
    if (res.success && res.data) setAlerts(res.data);
    setIsLoading(false);
  };

  const handleDismiss = async (alertIds: number[]) => {
    const res = await apiService.dismissAlerts(alertIds);
    if (res.success) {
      setAlerts(prev => prev.map(a => alertIds.includes(a.id) ? { ...a, is_read: true } : a));
    }
  };

  const handleDismissAll = async () => {
    const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
    if (unreadIds.length === 0) return;
    await handleDismiss(unreadIds);
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-50', border: 'border-red-200', icon: 'ri-error-warning-fill', iconColor: 'text-red-500', dot: 'bg-red-500' };
      case 'warning': return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'ri-alert-fill', iconColor: 'text-amber-500', dot: 'bg-amber-500' };
      case 'info': return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ri-information-fill', iconColor: 'text-blue-500', dot: 'bg-blue-500' };
      case 'success': return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'ri-checkbox-circle-fill', iconColor: 'text-emerald-500', dot: 'bg-emerald-500' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'ri-notification-3-fill', iconColor: 'text-gray-500', dot: 'bg-gray-400' };
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'placement': 'Placement', 'resume': 'Resume', 'deadline': 'Deadline',
      'skill_gap': 'Skill Gap', 'engagement': 'Engagement', 'system': 'System',
    };
    return labels[type] || type;
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const alertTypes = [...new Set(alerts.map(a => a.alert_type))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Alerts
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{unreadCount} new</span>
            )}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{alerts.length} total alert{alerts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={handleDismissAll}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2">
              <i className="ri-check-double-line"></i>Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showUnreadOnly} onChange={e => setShowUnreadOnly(e.target.checked)}
            className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer" />
          <span className="text-sm text-gray-700">Unread only</span>
        </label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
          <option value="">All Types</option>
          {alertTypes.map(t => (
            <option key={t} value={t}>{getTypeLabel(t)}</option>
          ))}
        </select>
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <i className="ri-notification-off-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts</h3>
          <p className="text-sm text-gray-500">You're all caught up. Alerts will appear here for important events.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const styles = getSeverityStyles(alert.severity);
            return (
              <div key={alert.id}
                className={`rounded-xl border p-4 transition-all ${alert.is_read ? 'bg-white border-gray-100 opacity-70' : `${styles.bg} ${styles.border}`}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <i className={`${styles.icon} ${alert.is_read ? 'text-gray-400' : styles.iconColor} text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-semibold ${alert.is_read ? 'text-gray-600' : 'text-gray-900'}`}>{alert.title}</h4>
                      {!alert.is_read && <span className={`w-2 h-2 rounded-full ${styles.dot} shrink-0`}></span>}
                    </div>
                    <p className={`text-sm ${alert.is_read ? 'text-gray-400' : 'text-gray-600'}`}>{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium uppercase">{getTypeLabel(alert.alert_type)}</span>
                      <span className="text-[10px] text-gray-400">{getRelativeTime(alert.created_at)}</span>
                    </div>
                  </div>
                  {!alert.is_read && (
                    <button onClick={() => handleDismiss([alert.id])}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0" title="Mark as read">
                      <i className="ri-check-line text-sm"></i>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
