// src/components/GlobeVisualization.jsx
import { useEffect, useState, useRef } from "react";
import Globe from "react-globe.gl";

export default function GlobeVisualization({ threats = [], onThreatClick = null, selectedThreatId = "" }) {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });

  useEffect(() => {
    // Auto-rotate globe
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }

    // Handle resize
    const handleResize = () => {
      const container = document.getElementById('globe-container');
      if (container) {
        setDimensions({
          width: container.offsetWidth,
          height: container.offsetHeight
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map severity to color and size
  const getPointColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#ff0066';
      case 'high': return '#ff4444';
      case 'medium': return '#facc15';
      case 'low': return '#38bdf8';
      default: return '#a855f7';
    }
  };

  const getPointSize = (count) => {
    return Math.min(0.8, 0.2 + (count / 50));
  };

  return (
    <div id="globe-container" className="w-full h-full relative">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Points data
        pointsData={threats}
        pointLat="lat"
        pointLng="lng"
        pointColor={d => getPointColor(d.severity)}
        pointRadius={d => getPointSize(d.count)}
        pointAltitude={d => (selectedThreatId && (d.id === selectedThreatId || d.event_id === selectedThreatId) ? 0.03 : 0.01)}
        
        // Labels
        pointLabel={d => `
          <div style="
            background: rgba(0,0,0,0.9);
            padding: 12px;
            border-radius: 8px;
            border: 1px solid ${getPointColor(d.severity)};
            color: white;
            font-family: 'Inter', sans-serif;
            min-width: 200px;
          ">
            <div style="font-size: 14px; font-weight: bold; color: ${getPointColor(d.severity)}; margin-bottom: 6px;">
              ${d.city}, ${d.country}
            </div>
            <div style="font-size: 12px; margin-bottom: 4px;">
              <strong>Type:</strong> ${d.type}
            </div>
            <div style="font-size: 12px; margin-bottom: 4px;">
              <strong>Severity:</strong> <span style="color: ${getPointColor(d.severity)}; text-transform: uppercase;">${d.severity}</span>
            </div>
            <div style="font-size: 12px; margin-bottom: 4px;">
              <strong>Threats:</strong> ${d.count}
            </div>
            <div style="font-size: 11px; color: #999; margin-top: 6px;">
              ID: ${d.id || d.event_id || "N/A"}
            </div>
          </div>
        `}
        onPointClick={(point) => {
          if (onThreatClick) {
            onThreatClick(point);
          }
        }}
        
        // Rings for emphasis
        ringsData={threats.filter(d => d.severity === 'critical' || d.severity === 'high')}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => t => `rgba(255,0,102,${1-t})`}
        ringMaxRadius={2}
        ringPropagationSpeed={3}
        ringRepeatPeriod={1500}
        
        // Atmosphere
        atmosphereColor="#a855f7"
        atmosphereAltitude={0.15}
        
        // Initial position
        onGlobeReady={() => {
          if (globeEl.current) {
            // Point camera to show multiple continents
            globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
          }
        }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 p-4 rounded-lg border border-white/20 backdrop-blur-sm">
        <div className="text-xs font-semibold mb-2 text-white">Threat Severity</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff0066]"></div>
            <span className="text-xs text-gray-300">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff4444]"></div>
            <span className="text-xs text-gray-300">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#facc15]"></div>
            <span className="text-xs text-gray-300">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#38bdf8]"></div>
            <span className="text-xs text-gray-300">Low</span>
          </div>
        </div>
      </div>
      
      {/* Info Badge */}
      <div className="absolute top-4 right-4 bg-black/80 px-4 py-2 rounded-lg border border-purple-500/50 backdrop-blur-sm">
        <div className="text-xs text-purple-300 font-semibold">
          {threats.length} Active Threat{threats.length !== 1 ? 's' : ''} Detected
        </div>
      </div>
    </div>
  );
}
