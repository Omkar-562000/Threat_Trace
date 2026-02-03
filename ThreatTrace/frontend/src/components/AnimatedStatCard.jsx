// src/components/AnimatedStatCard.jsx
import { useState, useEffect, useRef } from "react";

export default function AnimatedStatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = "purple",
  animate = true 
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValueRef = useRef(value);

  const colorStyles = {
    purple: "from-purple-600/20 to-purple-900/20 border-purple-500/30",
    cyan: "from-cyan-600/20 to-cyan-900/20 border-cyan-500/30",
    red: "from-red-600/20 to-red-900/20 border-red-500/30",
    green: "from-green-600/20 to-green-900/20 border-green-500/30",
    yellow: "from-yellow-600/20 to-yellow-900/20 border-yellow-500/30",
    blue: "from-blue-600/20 to-blue-900/20 border-blue-500/30",
  };

  const pulseColors = {
    purple: "shadow-purple-500/50",
    cyan: "shadow-cyan-500/50",
    red: "shadow-red-500/50",
    green: "shadow-green-500/50",
    yellow: "shadow-yellow-500/50",
    blue: "shadow-blue-500/50",
  };

  const iconColors = {
    purple: "text-purple-400",
    cyan: "text-cyan-400",
    red: "text-red-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    blue: "text-blue-400",
  };

  // Count-up animation effect
  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;
    const prevValue = prevValueRef.current || 0;

    // If value changed, animate
    if (numericValue !== prevValue) {
      // Trigger pulse animation
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 600);

      // Count up animation
      const duration = 500; // 500ms animation
      const steps = 20;
      const increment = (numericValue - displayValue) / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        
        if (currentStep >= steps) {
          setDisplayValue(numericValue);
          clearInterval(timer);
        } else {
          setDisplayValue(prev => Math.round(prev + increment));
        }
      }, stepDuration);

      prevValueRef.current = numericValue;

      return () => clearInterval(timer);
    }
  }, [value, animate]);

  // Format display value (handle strings that aren't numbers)
  const formattedValue = typeof value === 'string' && isNaN(value) 
    ? value 
    : displayValue.toLocaleString();

  return (
    <div 
      className={`
        relative overflow-hidden bg-gradient-to-br ${colorStyles[color]} 
        border backdrop-blur-xl rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 
        transition-all duration-300
        ${isPulsing ? `scale-105 shadow-2xl ${pulseColors[color]}` : 'hover:scale-105'}
      `}
    >
      {/* Pulse ring on update */}
      {isPulsing && (
        <div className="absolute inset-0 animate-ping bg-white/10 rounded-xl md:rounded-2xl"></div>
      )}

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
      
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className={`mb-2 sm:mb-3 ${iconColors[color]} transition-transform ${isPulsing ? 'scale-110' : ''}`}>
            {icon}
          </div>
        )}
        
        {/* Title */}
        <div className="text-xs sm:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
          {title}
        </div>
        
        {/* Value with count-up animation */}
        <div className={`
          text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 
          transition-all duration-300
          ${isPulsing ? 'text-shadow-glow' : ''}
        `}>
          {formattedValue}
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <div className="text-xs text-gray-400">
            {subtitle}
          </div>
        )}
        
        {/* Trend indicator */}
        {trend && (
          <div className={`
            mt-1 sm:mt-2 text-xs font-semibold transition-all
            ${trend.type === 'up' ? 'text-green-400' : trend.type === 'down' ? 'text-red-400' : 'text-gray-400'}
            ${isPulsing ? 'scale-110' : ''}
          `}>
            {trend.type === 'up' && '↑'}
            {trend.type === 'down' && '↓'}
            {trend.type === 'neutral' && '→'}
            <span className="hidden sm:inline"> {trend.value}</span>
            <span className="sm:hidden"> {trend.value.split(' ')[0]}</span>
          </div>
        )}

        {/* "Live" indicator */}
        {animate && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>

      {/* Glow effect on pulse */}
      {isPulsing && (
        <div className={`absolute inset-0 bg-gradient-to-r ${colorStyles[color]} opacity-50 blur-xl pointer-events-none`}></div>
      )}
    </div>
  );
}
