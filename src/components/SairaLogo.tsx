import React from 'react';

export const SairaMark: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="SAIRA Mark"
    >
      <defs>
        <linearGradient id="saira-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B3DFF" />
          <stop offset="100%" stopColor="#FF2E7E" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="#161618" />
      <path d="M96 106 H346 V84 L428 120 L346 156 V134 H96 Z" fill="url(#saira-grad)" />
      <path d="M416 378 H166 V356 L84 392 L166 428 V406 H416 Z" fill="url(#saira-grad)" />
      <path
        d="M322 210 C322 188 298 176 256 176 C214 176 190 190 190 212 C190 236 218 244 256 252 C294 260 322 268 322 298 C322 322 298 336 256 336 C214 336 190 322 190 300"
        fill="none"
        stroke="url(#saira-grad)"
        strokeWidth="36"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SairaWordmark: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col leading-none select-none ${className}`}>
      <span className="font-semibold tracking-[0.18em] text-[15px] text-foreground">SAIRA</span>
      <span className="font-medium tracking-[0.32em] text-[9px] text-muted-foreground mt-0.5">
        SINCE 2026
      </span>
    </div>
  );
};

export const SairaBrand: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <SairaMark size={size} />
      <SairaWordmark />
    </div>
  );
};
