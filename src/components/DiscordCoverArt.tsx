import React from 'react';

interface DiscordCoverArtProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * High-fidelity recreation of the user's uploaded Discord voice call screenshot:
 * Server: "Lemon", Channel: "[ 💤 ] * นอนน 2", Callers: Waen Tim & XOX89m
 */
export const DiscordCoverArt: React.FC<DiscordCoverArtProps> = ({
  className = '',
  size = 'md',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#1e1f22] text-gray-200 shadow-xl border border-[#313338] select-none ${className}`}
    >
      <svg viewBox="0 0 400 240" className="w-full h-full block">
        <defs>
          <radialGradient id="discGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2b2d31" />
            <stop offset="100%" stopColor="#1e1f22" />
          </radialGradient>
          <clipPath id="circleClip1">
            <circle cx="110" cy="70" r="22" />
          </clipPath>
          <clipPath id="circleClip2">
            <circle cx="290" cy="70" r="22" />
          </clipPath>
          <clipPath id="circleClip3">
            <circle cx="200" cy="155" r="24" />
          </clipPath>
        </defs>

        {/* Discord Window Top Bar */}
        <rect x="0" y="0" width="400" height="24" fill="#1e1f22" />
        {/* Lemon server tag */}
        <circle cx="16" cy="12" r="5" fill="#5865F2" />
        <text x="26" y="15" fill="#F2F3F5" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
          Lemon
        </text>
        <text x="75" y="15" fill="#949BA4" fontSize="9" fontFamily="sans-serif">
          [ 💤 ] * นอนน 2
        </text>

        {/* Main Voice Stage Background */}
        <rect x="0" y="24" width="400" height="216" fill="#2b2d31" />

        {/* --- Top Left Tile: Waen Tim --- */}
        <rect x="10" y="32" width="185" height="85" rx="8" fill="#313338" />
        {/* Avatar circle */}
        <circle cx="102" cy="70" r="22" fill="#5865F2" />
        {/* Chibi Anime white hair avatar */}
        <g clipPath="url(#circleClip1)">
          <rect x="80" y="48" width="45" height="45" fill="#E0E7FF" />
          {/* Head & white hair */}
          <circle cx="102" cy="72" r="14" fill="#FEE2E2" />
          {/* White hair spikes */}
          <path d="M 88 66 Q 102 52 116 66 L 118 74 Q 102 60 88 74 Z" fill="#FFFFFF" />
          <path d="M 94 65 L 98 75 L 102 65 L 106 75 L 110 65" fill="#FFFFFF" />
          {/* Eyes */}
          <circle cx="97" cy="72" r="2" fill="#374151" />
          <circle cx="107" cy="72" r="2" fill="#374151" />
          {/* Red hoodie */}
          <rect x="92" y="82" width="20" height="15" rx="4" fill="#EF4444" />
        </g>
        {/* Name pill: Waen Tim */}
        <rect x="16" y="94" width="62" height="16" rx="4" fill="#111214" opacity="0.85" />
        <circle cx="24" cy="102" r="3" fill="#23A55A" />
        <text x="31" y="105" fill="#F2F3F5" fontSize="8" fontWeight="600" fontFamily="sans-serif">
          Waen Tim
        </text>

        {/* --- Top Right Tile: XOX89m --- */}
        <rect x="205" y="32" width="185" height="85" rx="8" fill="#313338" />
        {/* Avatar circle */}
        <circle cx="297" cy="70" r="22" fill="#4E5058" />
        {/* Default Discord User Silhouette */}
        <g clipPath="url(#circleClip2)">
          <circle cx="297" cy="65" r="9" fill="#D1D5DB" />
          <path d="M 283 85 C 283 75, 311 75, 311 85 Z" fill="#D1D5DB" />
        </g>
        {/* Name pill: XOX89m */}
        <rect x="211" y="94" width="58" height="16" rx="4" fill="#111214" opacity="0.85" />
        <path d="M 218 99 L 222 99 L 222 105 L 218 105 Z" fill="#949BA4" />
        <text x="226" y="105" fill="#F2F3F5" fontSize="8" fontWeight="600" fontFamily="sans-serif">
          XOX89m
        </text>

        {/* --- Bottom Center Tile: Screen / Anime Boy by Rain Window --- */}
        <rect x="100" y="122" width="200" height="85" rx="8" fill="#313338" />
        {/* Circular Avatar / Camera Feed */}
        <circle cx="200" cy="158" r="24" fill="#111214" stroke="#4E5058" strokeWidth="2" />
        <g clipPath="url(#circleClip3)">
          {/* Grayscale Rainy Window Scene with Anime Boy */}
          <rect x="175" y="130" width="50" height="55" fill="#1F2937" />
          {/* Rain streaks */}
          <line x1="180" y1="135" x2="185" y2="155" stroke="#4B5563" strokeWidth="1" />
          <line x1="195" y1="132" x2="200" y2="158" stroke="#6B7280" strokeWidth="1" />
          <line x1="210" y1="135" x2="215" y2="160" stroke="#4B5563" strokeWidth="1" />
          {/* Boy silhouette looking outside */}
          <circle cx="198" cy="155" r="10" fill="#9CA3AF" />
          <path d="M 190 152 Q 198 144 205 150 L 206 158 Z" fill="#111827" />
          <rect x="190" y="164" width="18" height="20" fill="#374151" />
        </g>
        {/* Name pill */}
        <rect x="106" y="184" width="58" height="16" rx="4" fill="#111214" opacity="0.85" />
        <path d="M 112 189 L 117 189 L 117 195 L 112 195 Z" fill="#949BA4" />
        <text x="121" y="195" fill="#F2F3F5" fontSize="8" fontWeight="600" fontFamily="sans-serif">
          XOX89m
        </text>

        {/* Bottom Discord Controls bar */}
        <rect x="0" y="214" width="400" height="26" fill="#111214" />
        {/* Green voice status */}
        <path d="M 15 224 Q 18 221 21 224 Q 24 227 27 224" fill="none" stroke="#23A55A" strokeWidth="2" />
        <text x="32" y="228" fill="#23A55A" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
          เชื่อมต่อเสียงแล้ว
        </text>
        <text x="108" y="228" fill="#949BA4" fontSize="8" fontFamily="sans-serif">
          [ 💤 ] * นอนน 2 / Lemon
        </text>

        {/* Red Disconnect Button */}
        <circle cx="375" cy="227" r="8" fill="#DA373C" />
        <path d="M 372 225 L 378 229 M 378 225 L 372 229" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};
