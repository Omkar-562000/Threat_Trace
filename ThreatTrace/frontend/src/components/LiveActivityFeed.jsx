// src/components/LiveActivityFeed.jsx
import { useState, useEffect, useRef } from "react";
import { FireIcon, ShieldExclamationIcon, DocumentMagnifyingGlassIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function LiveActivityFeed({ activities = [], maxItems = 50 }) {
  const [items, setItems] = useState(activities);
  const feedRef = useRef(null);
  const autoScrollRef = useRef(true);

  // Update items when activities prop changes
  useEffect(() => {
    setItems(prev => {
      // Prepend new items
      const newItems = [...activities, ...prev];
      // Limit to maxItems
      return newItems.slice(0, maxItems);
    });

    // Auto-scroll to top when new activity arrives (if enabled)
    if (autoScrollRef.current && feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activities, maxItems]);

  // Get icon based on activity type
  const getIcon = (type, severity) => {
    const iconClass = "w-5 h-5";
    
    switch(type?.toLowerCase()) {
      case 'ransomware':
        return <FireIcon className={iconClass} />;
      case 'tamper':
      case 'audit':
        return <ShieldExclamationIcon className={iconClass} />;
      case 'scan':
        return <DocumentMagnifyingGlassIcon className={iconClass} />;
      case 'log':
      case 'event':
        if (severity === 'error' || severity === 'critical') {
          return <ExclamationCircleIcon className={iconClass} />;
        }
        return <CheckCircleIcon className={iconClass} />;
      default:
        return <ExclamationCircleIcon className={iconClass} />;
    }
  };

  // Get color based on severity
  const getSeverityColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'high':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'low':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'info':
        return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400';
      default:
        return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
    }
  };

  // Get emoji based on severity
  const getSeverityEmoji = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      case 'info': return '🟢';
      default: return '⚪';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      });
    } catch {
      return timestamp || 'Unknown';
    }
  };

  // Handle scroll to detect manual scrolling
  const handleScroll = () => {
    if (feedRef.current) {
      // If user scrolled away from top, disable auto-scroll
      autoScrollRef.current = feedRef.current.scrollTop === 0;
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-gradient-to-br from-gray-900/40 to-black/40 border border-white/10 backdrop-blur-xl rounded-xl md:rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Live Activity Feed
            </h3>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            {items.length} {items.length === 1 ? 'Event' : 'Events'}
          </div>
        </div>
      </div>

      {/* Feed content */}
      <div 
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent"
        style={{ maxHeight: '600px' }}
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            <div className="text-center">
              <DocumentMagnifyingGlassIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Waiting for activity...</p>
              <p className="text-xs mt-1">Real-time events will appear here</p>
            </div>
          </div>
        ) : (
          items.map((activity, index) => (
            <div
              key={activity.id || `${activity.timestamp}-${index}`}
              className={`
                p-3 rounded-lg border backdrop-blur-sm
                ${getSeverityColor(activity.severity)}
                hover:scale-[1.02] transition-all duration-200
                animate-fade-in
              `}
              style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`
                  flex-shrink-0 p-2 rounded-lg
                  ${getSeverityColor(activity.severity)}
                `}>
                  {getIcon(activity.type, activity.severity)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                      <span className="text-xs">
                        {getSeverityEmoji(activity.severity)}
                      </span>
                    </div>
                    <span className={`
                      text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider
                      ${getSeverityColor(activity.severity)}
                    `}>
                      {activity.severity || 'Info'}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-white font-medium mb-1 line-clamp-2">
                    {activity.message || activity.name || 'Security Event'}
                  </p>

                  {/* Details */}
                  {activity.details && (
                    <div className="mt-2 p-2 bg-black/30 rounded text-xs text-gray-300 space-y-0.5">
                      {typeof activity.details === 'string' ? (
                        <p className="font-mono">{activity.details}</p>
                      ) : (
                        Object.entries(activity.details).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-gray-500">{key}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Source/Location */}
                  {(activity.source || activity.location) && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      {activity.source && (
                        <span className="flex items-center gap-1">
                          <span className="opacity-50">📍</span>
                          {activity.source}
                        </span>
                      )}
                      {activity.location && (
                        <span className="flex items-center gap-1">
                          <span className="opacity-50">🌍</span>
                          {activity.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer with scroll hint */}
      {items.length > 5 && (
        <div className="px-4 py-2 border-t border-white/10 bg-black/20">
          <p className="text-[10px] text-gray-500 text-center">
            {autoScrollRef.current ? '📌 Auto-scrolling enabled' : '⏸️ Scroll to top for auto-scroll'}
          </p>
        </div>
      )}
    </div>
  );
}
