import React from 'react';

export type CoachState = 'idle' | 'talking' | 'cheer';

export interface CoachProps {
  state?: CoachState;
  size?: number;
  className?: string;
  showGlow?: boolean;
}

export const Coach: React.FC<CoachProps> = ({
  state = 'idle',
  size = 120,
  className = '',
  showGlow = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Coach avatar in ${state} expression`}
    >
      {/* Background Soft Glow Ring while speaking or cheering */}
      {(showGlow || state === 'talking' || state === 'cheer') && (
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 to-accent-pink/30 blur-md pointer-events-none animate-pulse"
          style={{ transform: 'scale(1.15)' }}
        />
      )}

      {/* Flat SVG Illustration of Coach (Friendly Indian woman in brand palette) */}
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-200"
      >
        <defs>
          <linearGradient id="coachHalo" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B3DFF" stopOpacity="0.25" />
            <stop offset="1" stopColor="#FF2E7E" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="coachHair" x1="50" y1="20" x2="150" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2A1B40" />
            <stop offset="0.6" stopColor="#181324" />
            <stop offset="1" stopColor="#0F0C17" />
          </linearGradient>

          <linearGradient id="coachCollar" x1="80" y1="160" x2="120" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B3DFF" />
            <stop offset="1" stopColor="#FF2E7E" />
          </linearGradient>
        </defs>

        {/* Circular portrait badge */}
        <circle cx="100" cy="100" r="92" fill="#18181D" stroke="url(#coachHalo)" strokeWidth="3" />

        {/* Backdrop Glow */}
        <circle cx="100" cy="100" r="88" fill="url(#coachHalo)" />

        {/* Back Hair */}
        <path
          d="M52 110 C45 60 70 30 100 30 C130 30 155 60 148 110 C146 128 152 165 152 165 C152 165 140 170 100 170 C60 170 48 165 48 165 C48 165 54 128 52 110 Z"
          fill="url(#coachHair)"
        />

        {/* Neck */}
        <path d="M88 135 L112 135 L116 160 L84 160 Z" fill="#E2A882" />

        {/* Shoulders & Blazer */}
        <path
          d="M40 192 C42 165 62 152 84 148 L100 162 L116 148 C138 152 158 165 160 192 Z"
          fill="#1C1B24"
        />
        {/* Collar Accent */}
        <path d="M84 148 L100 168 L88 192 L76 192 Z" fill="url(#coachCollar)" />
        <path d="M116 148 L100 168 L112 192 L124 192 Z" fill="url(#coachCollar)" />

        {/* Face Oval */}
        <path
          d="M66 90 C66 65 80 50 100 50 C120 50 134 65 134 90 C134 116 118 138 100 138 C82 138 66 116 66 90 Z"
          fill="#F5BA94"
        />

        {/* Front Hair / Bangs */}
        <path
          d="M65 82 C65 55 80 34 100 34 C120 34 135 55 135 82 C125 68 115 62 100 62 C85 62 75 68 65 82 Z"
          fill="#25173B"
        />
        <path
          d="M64 88 C62 65 74 42 100 42 C108 42 118 45 125 50 C108 50 88 58 74 74 C70 78 66 83 64 88 Z"
          fill="#352252"
        />

        {/* Small bindi/subtle dot */}
        <circle cx="100" cy="78" r="1.5" fill="#FF2E7E" opacity="0.9" />

        {/* Eyebrows */}
        <path d="M78 84 Q86 81 92 84" stroke="#25173B" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M108 84 Q114 81 122 84" stroke="#25173B" strokeWidth="2.2" strokeLinecap="round" />

        {/* Eyes */}
        {state === 'cheer' ? (
          // Joyful squinting closed eyes for cheer
          <>
            <path d="M79 92 Q85 87 91 92" stroke="#25173B" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M109 92 Q115 87 121 92" stroke="#25173B" strokeWidth="2.2" strokeLinecap="round" />
          </>
        ) : (
          // Normal friendly open eyes
          <>
            <ellipse cx="85" cy="91" rx="4.5" ry="3.5" fill="#25173B" />
            <circle cx="86.5" cy="89.5" r="1.2" fill="#FFFFFF" />
            <ellipse cx="115" cy="91" rx="4.5" ry="3.5" fill="#25173B" />
            <circle cx="116.5" cy="89.5" r="1.2" fill="#FFFFFF" />
          </>
        )}

        {/* Nose */}
        <path d="M100 92 L98 106 Q100 108 103 106" stroke="#D99468" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Mouth Expressions */}
        {state === 'idle' && (
          // Gentle closed warm smile
          <path
            d="M89 116 Q100 124 111 116"
            stroke="#BD5668"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {state === 'talking' && (
          // Open expressive speaking mouth with teeth/interior
          <g>
            <path
              d="M88 115 Q100 113 112 115 Q100 128 88 115 Z"
              fill="#7E2436"
              stroke="#BD5668"
              strokeWidth="1.5"
            />
            <path d="M92 116 Q100 115 108 116" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {state === 'cheer' && (
          // Wide open joyful smile
          <g>
            <path
              d="M87 114 Q100 112 113 114 Q100 131 87 114 Z"
              fill="#BD5668"
            />
            <path d="M90 115 Q100 114 110 115" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Cheer Sparkles / Stars */}
        {state === 'cheer' && (
          <g fill="#FF2E7E">
            <path d="M38 60 L41 68 L49 71 L41 74 L38 82 L35 74 L27 71 L35 68 Z" opacity="0.9" />
            <path d="M162 55 L164 62 L171 64 L164 66 L162 73 L160 66 L153 64 L160 62 Z" opacity="0.8" fill="#8B3DFF" />
            <circle cx="160" cy="115" r="2.5" fill="#38E1A1" />
          </g>
        )}
      </svg>
    </div>
  );
};
