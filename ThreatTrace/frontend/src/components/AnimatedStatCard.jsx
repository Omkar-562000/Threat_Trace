import { useState, useEffect, useRef } from "react";

export default function AnimatedStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "purple",
  animate = true,
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValueRef = useRef(typeof value === "number" ? value : 0);

  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))
        ? Number(value)
        : null;

  const safeTrendValue = typeof trend?.value === "string" ? trend.value : "";

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

  useEffect(() => {
    const nextValue = numericValue ?? 0;

    if (!animate) {
      setDisplayValue(nextValue);
      prevValueRef.current = nextValue;
      return;
    }

    const prevValue = prevValueRef.current || 0;
    if (nextValue === prevValue) {
      return;
    }

    setIsPulsing(true);
    const pulseTimer = setTimeout(() => setIsPulsing(false), 600);

    const duration = 500;
    const steps = 20;
    const increment = (nextValue - displayValue) / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;

      if (currentStep >= steps) {
        setDisplayValue(nextValue);
        clearInterval(timer);
      } else {
        setDisplayValue((prev) => Math.round(prev + increment));
      }
    }, stepDuration);

    prevValueRef.current = nextValue;

    return () => {
      clearInterval(timer);
      clearTimeout(pulseTimer);
    };
  }, [animate, displayValue, numericValue]);

  const formattedValue = numericValue === null ? (value ?? "N/A") : displayValue.toLocaleString();

  return (
    <div
      className={`
        relative overflow-hidden bg-gradient-to-br ${colorStyles[color]}
        border backdrop-blur-xl rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6
        transition-all duration-300
        ${isPulsing ? `scale-105 shadow-2xl ${pulseColors[color]}` : "hover:scale-105"}
      `}
    >
      {isPulsing && (
        <div className="absolute inset-0 animate-ping bg-white/10 rounded-xl md:rounded-2xl"></div>
      )}

      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>

      <div className="relative">
        {icon && (
          <div className={`mb-2 sm:mb-3 ${iconColors[color]} transition-transform ${isPulsing ? "scale-110" : ""}`}>
            {icon}
          </div>
        )}

        <div className="text-xs sm:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
          {title}
        </div>

        <div
          className={`
            text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2
            transition-all duration-300
            ${isPulsing ? "text-shadow-glow" : ""}
          `}
        >
          {formattedValue}
        </div>

        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}

        {trend && (
          <div
            className={`
              mt-1 sm:mt-2 text-xs font-semibold transition-all
              ${trend.type === "up" ? "text-green-400" : trend.type === "down" ? "text-red-400" : "text-gray-400"}
              ${isPulsing ? "scale-110" : ""}
            `}
          >
            {trend.type === "up" && "?"}
            {trend.type === "down" && "?"}
            {trend.type === "neutral" && "?"}
            <span className="hidden sm:inline"> {safeTrendValue}</span>
            <span className="sm:hidden"> {safeTrendValue ? safeTrendValue.split(" ")[0] : ""}</span>
          </div>
        )}

        {animate && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>

      {isPulsing && (
        <div className={`absolute inset-0 bg-gradient-to-r ${colorStyles[color]} opacity-50 blur-xl pointer-events-none`}></div>
      )}
    </div>
  );
}
