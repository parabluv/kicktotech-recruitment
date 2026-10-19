import React from 'react';

export function Squiggle({ className = "w-24 h-4 text-[#F472B6]" }) {
  return (
    <svg 
      viewBox="0 0 100 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      preserveAspectRatio="none"
    >
      <path 
        d="M2 10C10 2 15 2 25 10C35 18 40 18 50 10C60 2 65 2 75 10C85 18 90 18 98 10" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StarBadge({ className = "w-10 h-10 text-[#FBBF24]", text = "NEW" }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[2px_2px_0px_#1E293B]">
        <polygon 
          points="50,0 63,30 95,25 78,55 98,82 66,78 50,100 34,78 2,82 22,55 5,25 37,30" 
          fill="#FBBF24" 
          stroke="#1E293B" 
          strokeWidth="4"
        />
      </svg>
      {text && (
        <span className="absolute font-heading font-black text-[10px] text-[#1E293B] rotate-[-5deg]">
          {text}
        </span>
      )}
    </div>
  );
}

export function FloatingGeometry() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none -z-10">
      {/* Big Yellow Circle Top-Right */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#FBBF24]/20 border-2 border-[#1E293B]/20 animate-float"></div>
      
      {/* Pink Pill Left */}
      <div className="absolute top-1/4 -left-10 w-32 h-16 rounded-full bg-[#F472B6]/25 border-2 border-[#1E293B]/20 rotate-[-18deg] hidden lg:block"></div>

      {/* Mint Polygon/Square */}
      <div className="absolute top-2/3 -right-6 w-20 h-20 rounded-2xl bg-[#34D399]/25 border-2 border-[#1E293B]/20 rotate-[15deg] hidden sm:block"></div>

      {/* Small Memphis Crosses */}
      <div className="absolute top-1/3 right-1/4 text-[#8B5CF6]/40 font-black text-2xl rotate-12">+</div>
      <div className="absolute top-1/2 left-1/5 text-[#F472B6]/40 font-black text-3xl rotate-45">✕</div>
      <div className="absolute bottom-1/4 right-1/6 text-[#FBBF24]/50 font-black text-2xl">▲</div>
    </div>
  );
}
