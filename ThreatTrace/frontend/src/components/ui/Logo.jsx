// frontend/src/components/ui/Logo.jsx
import { useEffect, useState } from "react";
import { getBestLogo, scanAvailableLogos } from "../../utils/logoUtils";

/**
 * Logo Component - Dynamically displays available logos from /images/logos/ folder
 *
 * Props:
 * - variant: "full" | "icon" (default: "full")
 * - className: Additional Tailwind classes
 * - size: "sm" | "md" | "lg" | "xl" (default: "md")
 * - autoRefresh: boolean - Whether to periodically check for new logos (default: true)
 */
export default function Logo({
  variant = "full",
  className = "",
  size = "md",
  autoRefresh = true
}) {
  const [availableLogos, setAvailableLogos] = useState([]);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Size mappings
  const sizeClasses = {
    sm: variant === "full" ? "h-8" : "h-8 w-8",
    md: variant === "full" ? "h-12" : "h-10 w-10",
    lg: variant === "full" ? "h-16" : "h-12 w-12",
    xl: variant === "full" ? "h-20" : "h-16 w-16",
  };

  // Load available logos on mount and periodically
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const logos = await scanAvailableLogos();
        setAvailableLogos(logos);

        // Get the best logo for current variant
        const bestLogo = getBestLogo(variant, logos);
        setCurrentLogo(bestLogo);
      } catch (error) {
        console.warn("Error loading logos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogos();

    // Auto-refresh every 5 seconds to detect new logos
    if (autoRefresh) {
      const interval = setInterval(loadLogos, 5000);
      return () => clearInterval(interval);
    }
  }, [variant, autoRefresh]);

  // Update current logo when variant changes
  useEffect(() => {
    if (availableLogos.length > 0) {
      const bestLogo = getBestLogo(variant, availableLogos);
      setCurrentLogo(bestLogo);
      setImageError(false); // Reset error state when logo changes
    }
  }, [variant, availableLogos]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {variant === "full" ? (
          <>
            <div className={`flex items-center justify-center bg-gray-700 rounded-lg animate-pulse ${sizeClasses[size]}`}>
              <div className="w-3/5 h-3/5 bg-gray-600 rounded"></div>
            </div>
            <div className="h-6 bg-gray-700 rounded animate-pulse w-32"></div>
          </>
        ) : (
          <div className={`flex items-center justify-center bg-gray-700 rounded-lg animate-pulse ${sizeClasses[size]}`}>
            <div className="w-3/5 h-3/5 bg-gray-600 rounded"></div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: Show stylized text if no logo available or image error
  if (!currentLogo || imageError) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {variant === "full" ? (
          <>
            {/* Icon placeholder */}
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyberNeon to-cyberPurple rounded-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            {/* Text logo */}
            <span className="text-xl font-Orbitron font-bold bg-gradient-to-r from-cyberNeon to-cyberPurple bg-clip-text text-transparent tracking-wider">
              ThreatTrace
            </span>
          </>
        ) : (
          /* Icon only fallback */
          <div className={`flex items-center justify-center bg-gradient-to-br from-cyberNeon to-cyberPurple rounded-lg ${sizeClasses[size]}`}>
            <svg
              className="w-3/5 h-3/5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // Show actual logo image
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={currentLogo.path}
        alt={variant === "full" ? "ThreatTrace Logo" : "ThreatTrace Icon"}
        className={`${sizeClasses[size]} object-contain transition-opacity duration-300`}
        onError={() => setImageError(true)}
        loading="eager"
        title={`Logo: ${currentLogo.filename}`}
      />
    </div>
  );
}
