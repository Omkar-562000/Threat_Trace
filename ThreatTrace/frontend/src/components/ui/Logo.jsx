// frontend/src/components/ui/Logo.jsx

import { useEffect, useState } from "react";
import { getBestLogo, scanAvailableLogos } from "../../utils/logoUtils";

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


  // ✅ PROFESSIONAL SIZE SCALE (EXTENDED)
  const sizeClasses = {

    sm: variant === "full"
      ? "h-8"
      : "h-8 w-8",

    md: variant === "full"
      ? "h-12"
      : "h-10 w-10",

    lg: variant === "full"
      ? "h-16"
      : "h-12 w-12",

    xl: variant === "full"
      ? "h-20"
      : "h-16 w-16",

    "2xl": variant === "full"
      ? "h-24"
      : "h-20 w-20",

    "3xl": variant === "full"
      ? "h-32"
      : "h-24 w-24",

    // 🔥 NEW STRONG PROFESSIONAL SIZES

    "4xl": variant === "full"
      ? "h-40"
      : "h-32 w-32",

    "5xl": variant === "full"
      ? "h-52"
      : "h-40 w-40",

    "6xl": variant === "full"
      ? "h-[260px]"
      : "h-[200px] w-[200px]",

  };


  // Load Logos
  useEffect(() => {

    const loadLogos = async () => {

      try {

        const logos = await scanAvailableLogos();

        setAvailableLogos(logos);

        const bestLogo =
          getBestLogo(variant, logos);

        setCurrentLogo(bestLogo);

      }
      catch (error) {

        console.warn("Logo load error:", error);

      }
      finally {

        setIsLoading(false);

      }

    };

    loadLogos();

    if (autoRefresh) {

      const interval =
        setInterval(loadLogos, 5000);

      return () => clearInterval(interval);

    }

  }, [variant, autoRefresh]);


  useEffect(() => {

    if (availableLogos.length > 0) {

      const bestLogo =
        getBestLogo(variant, availableLogos);

      setCurrentLogo(bestLogo);

      setImageError(false);

    }

  }, [variant, availableLogos]);


  // Loading
  if (isLoading) {

    return (

      <div className={`flex justify-center ${className}`}>

        <div
          className={`
          ${sizeClasses[size]}
          bg-gray-700
          animate-pulse
          rounded-lg
          `}
        />

      </div>

    );

  }


  // Fallback
  if (!currentLogo || imageError) {

    return (

      <div className={`flex justify-center ${className}`}>

        <span
          className="
          text-3xl
          font-bold
          text-cyan-400
          "
        >
          ThreatTrace
        </span>

      </div>

    );

  }


  // ✅ FINAL LOGO OUTPUT

  return (

    <div
      className={`
      flex
      justify-center
      items-center
      ${className}
      `}
    >

      <img

        src={currentLogo.path}

        alt="ThreatTrace Logo"

        className={`

          ${sizeClasses[size]}

          object-contain

          transition-all

          duration-300


          drop-shadow-[0_0_25px_rgba(0,212,255,0.7)]

          hover:drop-shadow-[0_0_50px_rgba(0,212,255,1)]

        `}

        onError={() => setImageError(true)}

        loading="eager"

      />

    </div>

  );

}
