// src/components/StatCard.jsx

export default function StatCard({ title, value, subtitle, icon, trend, color = "purple" }) {
  const colorStyles = {
    purple: "from-purple-600/20 to-purple-900/20 border-purple-500/30",
    cyan: "from-cyan-600/20 to-cyan-900/20 border-cyan-500/30",
    red: "from-red-600/20 to-red-900/20 border-red-500/30",
    green: "from-green-600/20 to-green-900/20 border-green-500/30",
    yellow: "from-yellow-600/20 to-yellow-900/20 border-yellow-500/30",
    blue: "from-blue-600/20 to-blue-900/20 border-blue-500/30",
  };

  const iconColors = {
    purple: "text-purple-400",
    cyan: "text-cyan-400",
    red: "text-red-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    blue: "text-blue-400",
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colorStyles[color]} border backdrop-blur-xl rounded-2xl p-6 hover:scale-105 transition-transform duration-300`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
      
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className={`mb-3 ${iconColors[color]}`}>
            {icon}
          </div>
        )}
        
        {/* Title */}
        <div className="text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
          {title}
        </div>
        
        {/* Value */}
        <div className="text-3xl font-bold text-white mb-2">
          {value}
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <div className="text-xs text-gray-400">
            {subtitle}
          </div>
        )}
        
        {/* Trend indicator */}
        {trend && (
          <div className={`mt-2 text-xs font-semibold ${trend.type === 'up' ? 'text-green-400' : trend.type === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
            {trend.type === 'up' && '↑'}
            {trend.type === 'down' && '↓'}
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}
