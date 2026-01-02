import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Upload, 
  Trash2, 
  MessageCircle, 
  DollarSign,
  Mail,
  UserPlus,
  UserMinus,
  Megaphone,
  Rocket,
  FileText,
  Clock,
  RefreshCw
} from 'lucide-react';

const ActivityFeed = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [projectId, filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/projects/${projectId}/activity?type=${filter}&limit=50`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        console.warn('Activity fetch failed:', response.status);
        setActivities([]);
        return;
      }
      
      const data = await response.json();
      setActivities(data.activities || []);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Activity fetch error:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    const iconMap = {
      'task_created': <CheckCircle2 className="w-4 h-4 text-blue-400" />,
      'task_completed': <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      'task_deleted': <Trash2 className="w-4 h-4 text-red-400" />,
      'file_uploaded': <Upload className="w-4 h-4 text-purple-400" />,
      'file_deleted': <Trash2 className="w-4 h-4 text-red-400" />,
      'message_sent': <MessageCircle className="w-4 h-4 text-cyan-400" />,
      'payment_sent': <DollarSign className="w-4 h-4 text-emerald-400" />,
      'email_exchanged': <Mail className="w-4 h-4 text-yellow-400" />,
      'member_added': <UserPlus className="w-4 h-4 text-green-400" />,
      'member_removed': <UserMinus className="w-4 h-4 text-orange-400" />,
      'announcement_created': <Megaphone className="w-4 h-4 text-fuchsia-400" />,
      'project_shipped': <Rocket className="w-4 h-4 text-purple-400" />,
      'comment_added': <FileText className="w-4 h-4 text-slate-400" />
    };
    return iconMap[action] || <Clock className="w-4 h-4 text-slate-400" />;
  };

  const getActivityText = (activity) => {
    const userName = activity.userId?.name || 'Someone';
    
    switch(activity.action) {
      case 'task_created':
        return `${userName} created task "${activity.metadata?.taskTitle || 'Untitled'}"`;
      case 'task_completed':
        return `${userName} completed "${activity.metadata?.taskTitle || 'task'}"`;
      case 'file_uploaded':
        return `${userName} uploaded ${activity.metadata?.fileName || 'a file'}`;
      case 'payment_sent':
        return `${userName} sent payment to ${activity.metadata?.recipientName || 'recipient'}`;
      case 'email_exchanged':
        return `${userName} exchanged email with ${activity.metadata?.recipientName || 'someone'}`;
      case 'message_sent':
        return `${userName} sent a message`;
      case 'member_added':
        return `${userName} added ${activity.metadata?.memberName || 'a member'}`;
      case 'announcement_created':
        return `${userName} posted an announcement`;
      case 'project_shipped':
        return `${userName} shipped: ${activity.details?.description || 'update'}`;
      default:
        return `${userName} performed an action`;
    }
  };

  const getTimeAgo = (date) => {
    try {
      const now = new Date();
      const then = new Date(date);
      const seconds = Math.floor((now - then) / 1000);
      
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
      return `${Math.floor(seconds / 604800)}w ago`;
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-800/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-purple-400" />
            Activity Feed
          </h3>
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'task', label: 'Tasks' },
            { id: 'file', label: 'Files' },
            { id: 'message', label: 'Messages' },
            { id: 'payment', label: 'Payments' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No activity yet</p>
            <p className="text-slate-500 text-xs mt-1">Actions will appear here as you work</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity._id}
              className="flex gap-3 p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors"
            >
              <div className="mt-0.5">{getActivityIcon(activity.action)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-relaxed">
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {getTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}

        {hasMore && !loading && (
          <button
            onClick={() => {/* Load more logic */}}
            className="w-full py-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Load more...
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
