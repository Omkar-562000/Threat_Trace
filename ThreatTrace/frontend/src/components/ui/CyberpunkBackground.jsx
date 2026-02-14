// frontend/src/components/ui/CyberpunkBackground.jsx
/**
 * Animated Cyberpunk Background for Auth Pages
 * Features: Animated particles, gradient overlay, circuit patterns
 */
export default function CyberpunkBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1f] via-[#1a0b2e] to-[#0a0f1f]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse-slower" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-3xl animate-pulse-slowest" />
      
      {/* Animated grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}
      />
      
      {/* Circuit lines - horizontal */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
            <stop offset="50%" stopColor="#00eaff" stopOpacity="1" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path 
          d="M 0,100 L 200,100 L 220,120 L 400,120" 
          stroke="url(#circuit-gradient)" 
          strokeWidth="2" 
          fill="none"
          className="animate-circuit-flow"
        />
        <path 
          d="M 0,300 L 300,300 L 320,280 L 600,280" 
          stroke="url(#circuit-gradient)" 
          strokeWidth="2" 
          fill="none"
          className="animate-circuit-flow-reverse"
        />
        <path 
          d="M 0,500 L 150,500 L 170,520 L 500,520" 
          stroke="url(#circuit-gradient)" 
          strokeWidth="2" 
          fill="none"
          className="animate-circuit-flow"
        />
        
        {/* Vertical circuits */}
        <path 
          d="M 300,0 L 300,200 L 320,220 L 320,400" 
          stroke="url(#circuit-gradient)" 
          strokeWidth="2" 
          fill="none"
          className="animate-circuit-flow-reverse"
        />
        <path 
          d="M 800,0 L 800,300 L 780,320 L 780,600" 
          stroke="url(#circuit-gradient)" 
          strokeWidth="2" 
          fill="none"
          className="animate-circuit-flow"
        />
      </svg>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
        <div className="particle particle-6" />
        <div className="particle particle-7" />
        <div className="particle particle-8" />
      </div>
      
      {/* Scanline effect */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168, 85, 247, 0.3) 3px, rgba(168, 85, 247, 0.3) 4px)',
          animation: 'scanline 8s linear infinite'
        }}
      />
      
      {/* Vignette overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(10, 15, 31, 0.8) 100%)'
        }}
      />

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        
        @keyframes pulse-slowest {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
        
        @keyframes gridMove {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(50px) translateY(50px); }
        }
        
        @keyframes circuit-flow {
          0% { stroke-dashoffset: 1000; opacity: 0; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        
        @keyframes circuit-flow-reverse {
          0% { stroke-dashoffset: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: -1000; opacity: 0; }
        }
        
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 6s ease-in-out infinite; }
        .animate-pulse-slowest { animation: pulse-slowest 8s ease-in-out infinite; }
        .animate-circuit-flow { 
          stroke-dasharray: 1000; 
          animation: circuit-flow 8s linear infinite; 
        }
        .animate-circuit-flow-reverse { 
          stroke-dasharray: 1000; 
          animation: circuit-flow-reverse 8s linear infinite; 
        }
        
        /* Floating particles */
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #00eaff;
          border-radius: 50%;
          box-shadow: 0 0 10px #00eaff;
          opacity: 0.6;
          animation: float 10s ease-in-out infinite;
        }
        
        .particle-1 { top: 10%; left: 20%; animation-delay: 0s; animation-duration: 12s; }
        .particle-2 { top: 60%; left: 80%; animation-delay: 2s; animation-duration: 10s; background: #a855f7; box-shadow: 0 0 10px #a855f7; }
        .particle-3 { top: 30%; left: 50%; animation-delay: 1s; animation-duration: 15s; }
        .particle-4 { top: 80%; left: 30%; animation-delay: 3s; animation-duration: 11s; background: #ff006e; box-shadow: 0 0 10px #ff006e; }
        .particle-5 { top: 40%; left: 90%; animation-delay: 4s; animation-duration: 13s; }
        .particle-6 { top: 70%; left: 10%; animation-delay: 1.5s; animation-duration: 14s; background: #a855f7; box-shadow: 0 0 10px #a855f7; }
        .particle-7 { top: 20%; left: 70%; animation-delay: 2.5s; animation-duration: 9s; }
        .particle-8 { top: 90%; left: 60%; animation-delay: 3.5s; animation-duration: 16s; background: #00eaff; box-shadow: 0 0 10px #00eaff; }
      `}</style>
    </div>
  );
}
