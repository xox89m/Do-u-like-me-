import React from 'react';
import { motion } from 'motion/react';

export type MoodType =
  | 'asking'
  | 'dodge1'
  | 'click2'
  | 'click3'
  | 'yes1'
  | 'yes2'
  | 'yes3'
  | 'accepted';

interface CuteStickerProps {
  mood: MoodType;
  className?: string;
}

/**
 * CuteSticker: Renders the custom rabbit illustrations matching user's photo
 * GUARANTEE: Never loops opacity or disappears/fades away!
 * Stays 100% solid, opaque, cute and expressive at all times.
 */
export const CuteSticker: React.FC<CuteStickerProps> = ({ mood, className = 'w-52 h-52' }) => {
  switch (mood) {
    case 'asking':
      // Rabbit holding pink rose with "อะให้" - Gentle breathing bounce, completely solid
      return (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center opacity-100 ${className}`}
        >
          <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-md">
            <path d="M 172 90 L 174 95 L 179 97 L 174 99 L 172 104 L 170 99 L 165 97 L 170 95 Z" fill="#D4A373" opacity="0.8" />
            <path d="M 142 95 L 144 99 L 148 100 L 144 102 L 142 106 L 140 102 L 136 100 L 140 99 Z" fill="#D4A373" opacity="0.8" />
            <text x="146" y="68" fill="#523636" fontFamily="'Mali', 'Itim', cursive, sans-serif" fontSize="24" fontWeight="bold">
              อะให้
            </text>
            <path d="M 68 95 C 55 45, 82 40, 88 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <ellipse cx="78" cy="72" rx="4.5" ry="9" fill="#EAE5E9" />
            <path d="M 98 95 C 104 45, 131 45, 118 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <ellipse cx="108" cy="72" rx="4.5" ry="9" fill="#EAE5E9" />
            <path d="M 52 148 C 30 115, 60 88, 100 88 C 140 88, 158 115, 136 148 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 72 122 Q 77 116 82 122" fill="none" stroke="#524450" strokeWidth="4" strokeLinecap="round" />
            <path d="M 98 122 Q 103 116 108 122" fill="none" stroke="#524450" strokeWidth="4" strokeLinecap="round" />
            <circle cx="90" cy="125" r="1.5" fill="#524450" />
            <path d="M 86 130 Q 90 135 94 130" fill="none" stroke="#524450" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="65" cy="132" rx="13" ry="8" fill="#F8B4BD" opacity="0.85" />
            <ellipse cx="115" cy="132" rx="13" ry="8" fill="#F8B4BD" opacity="0.85" />
            <path d="M 54 165 C 48 178, 65 182, 60 192" fill="none" stroke="#685D66" strokeWidth="4" />
            <path d="M 120 158 C 145 160, 150 178, 130 182" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <line x1="152" y1="130" x2="144" y2="165" stroke="#524450" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="156" cy="142" rx="6" ry="3.5" fill="#CBE0C2" stroke="#524450" strokeWidth="1.8" transform="rotate(-15 156 142)" />
            <path d="M 148 114 C 144 106, 160 102, 164 112 C 168 122, 158 130, 150 128 Z" fill="#F28E9B" stroke="#524450" strokeWidth="2.5" />
            <path d="M 152 112 C 156 108, 162 110, 158 116 C 154 120, 148 118, 152 112" fill="#E57385" />
          </svg>
        </motion.div>
      );

    case 'yes1':
      // กดชอบครั้งที่ 1: "เดี๋ยวก่อนน คิดดีๆนะ" -> Bunny holding both paws out stopping/hesitating with wide eyes
      return (
        <motion.div
          animate={{ rotate: [-1.5, 1.5, -1.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center opacity-100 ${className}`}
        >
          <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-md">
            {/* Surprise question marks */}
            <text x="148" y="65" fill="#F59E0B" fontFamily="'Mali', cursive" fontSize="24" fontWeight="bold">!?</text>
            <path d="M 68 95 C 55 45, 82 40, 88 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <ellipse cx="78" cy="72" rx="4.5" ry="9" fill="#EAE5E9" />
            <path d="M 98 95 C 104 45, 131 45, 118 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <ellipse cx="108" cy="72" rx="4.5" ry="9" fill="#EAE5E9" />
            <path d="M 52 148 C 30 115, 60 88, 100 88 C 140 88, 158 115, 136 148 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            {/* Wide surprised eyes */}
            <circle cx="78" cy="120" r="6" fill="#3D2B3D" />
            <circle cx="76" cy="118" r="2.5" fill="#FFFFFF" />
            <circle cx="106" cy="120" r="6" fill="#3D2B3D" />
            <circle cx="104" cy="118" r="2.5" fill="#FFFFFF" />
            {/* Open 'o' mouth */}
            <ellipse cx="92" cy="130" rx="3.5" ry="4.5" fill="#E11D48" stroke="#524450" strokeWidth="2" />
            <ellipse cx="64" cy="132" rx="12" ry="7" fill="#F8B4BD" opacity="0.85" />
            <ellipse cx="120" cy="132" rx="12" ry="7" fill="#F8B4BD" opacity="0.85" />
            {/* Paws held out: "เดี๋ยวก่อนน" ✋🤚 */}
            <ellipse cx="60" cy="155" rx="10" ry="12" fill="#FFFFFF" stroke="#685D66" strokeWidth="3.5" transform="rotate(-15 60 155)" />
            <ellipse cx="124" cy="155" rx="10" ry="12" fill="#FFFFFF" stroke="#685D66" strokeWidth="3.5" transform="rotate(15 124 155)" />
          </svg>
        </motion.div>
      );

    case 'yes2':
      // กดชอบครั้งที่ 2: "แน่ใจจ แต่ผมไม่ได้ดีอะไรขนาดนั้นนะ" -> Bunny looking down shyly, twiddling paws 👉👈, heavy blush
      return (
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center opacity-100 ${className}`}
        >
          <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-md">
            <path d="M 68 95 C 55 45, 82 40, 88 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <ellipse cx="78" cy="72" rx="4.5" ry="9" fill="#EAE5E9" />
            <path d="M 98 95 C 104 45, 131 45, 118 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <ellipse cx="108" cy="72" rx="4.5" ry="9" fill="#EAE5E9" />
            <path d="M 52 148 C 30 115, 60 88, 100 88 C 140 88, 158 115, 136 148 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            {/* Shy downturned eyes */}
            <path d="M 74 122 Q 80 126 86 122" fill="none" stroke="#524450" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 98 122 Q 104 126 110 122" fill="none" stroke="#524450" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 88 132 Q 92 135 96 132" fill="none" stroke="#524450" strokeWidth="3" strokeLinecap="round" />
            {/* Heavy glowing blush */}
            <ellipse cx="64" cy="132" rx="14" ry="9" fill="#FB7185" opacity="0.9" />
            <ellipse cx="120" cy="132" rx="14" ry="9" fill="#FB7185" opacity="0.9" />
            {/* Paws together 👉👈 */}
            <ellipse cx="84" cy="162" rx="8" ry="7" fill="#FFFFFF" stroke="#685D66" strokeWidth="3" />
            <ellipse cx="100" cy="162" rx="8" ry="7" fill="#FFFFFF" stroke="#685D66" strokeWidth="3" />
            <text x="86" y="180" fill="#E11D48" fontSize="12" fontWeight="bold">👉👈</text>
          </svg>
        </motion.div>
      );

    case 'yes3':
      // กดชอบครั้งที่ 3: "เห้ยย พี่เสียสติไปแล้ว ผมง้อคนไม่เป็น... อย่ามาชอบคนแบบผมเลยยย"
      return (
        <motion.div
          animate={{ rotate: [-2.5, 2.5, -2.5] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center opacity-100 ${className}`}
        >
          <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-lg">
            {/* Sweat drop */}
            <path d="M 148 85 Q 155 95 148 102 Q 142 95 148 85 Z" fill="#38BDF8" />
            {/* Panicking lines */}
            <line x1="38" y1="105" x2="48" y2="105" stroke="#FB7185" strokeWidth="2.5" />
            <line x1="36" y1="115" x2="46" y2="115" stroke="#FB7185" strokeWidth="2.5" />
            <path d="M 68 95 C 55 45, 82 40, 88 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 98 95 C 104 45, 131 45, 118 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 52 148 C 30 115, 60 88, 100 88 C 140 88, 158 115, 136 148 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            {/* Spiral / dazed panicked eyes */}
            <ellipse cx="78" cy="118" rx="6" ry="7" fill="#881337" />
            <ellipse cx="106" cy="118" rx="6" ry="7" fill="#881337" />
            {/* Wobbly wavy screaming mouth */}
            <path d="M 82 134 Q 88 128 92 134 Q 96 140 102 134" fill="none" stroke="#524450" strokeWidth="3" strokeLinecap="round" />
            {/* Overheating blush */}
            <ellipse cx="62" cy="130" rx="14" ry="9" fill="#F43F5E" opacity="0.9" />
            <ellipse cx="122" cy="130" rx="14" ry="9" fill="#F43F5E" opacity="0.9" />
            {/* Paws clutching head / cheeks */}
            <circle cx="56" cy="138" r="10" fill="#FFFFFF" stroke="#685D66" strokeWidth="3.5" />
            <circle cx="128" cy="138" r="10" fill="#FFFFFF" stroke="#685D66" strokeWidth="3.5" />
          </svg>
        </motion.div>
      );

    case 'accepted':
      // ครั้งสุดท้าย: "จริงมั้ยเนี่ยย พี่เสียสติไปแล้วว ผมจะแจ้งตำรวจ" -> หน้าอ้อน ตาแป๋วแวววาว ไร้หัวใจ น่ารักน่าเอ็นดูสุดๆ
      return (
        <motion.div
          animate={{ y: [0, -4, 0], scale: [1, 1.025, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center opacity-100 ${className}`}
        >
          <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-xl">
            {/* Soft glow circle behind */}
            <circle cx="110" cy="118" r="88" fill="#FFFBEB" opacity="0.9" />

            {/* Drooping cute ears */}
            <path d="M 70 94 C 52 46, 78 40, 88 94 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <ellipse cx="80" cy="70" rx="4.5" ry="12" fill="#FFD1DC" />
            <path d="M 104 94 C 112 40, 138 46, 120 94 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <ellipse cx="112" cy="70" rx="4.5" ry="12" fill="#FFD1DC" />

            {/* Bunny round chubby head & body */}
            <path d="M 52 152 C 30 118, 58 92, 100 92 C 142 92, 160 118, 138 152 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />

            {/* Pleading eyebrows (angled softly upward in center) */}
            <path d="M 68 108 Q 76 104 84 107" fill="none" stroke="#685D66" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 106 107 Q 114 104 122 108" fill="none" stroke="#685D66" strokeWidth="2.5" strokeLinecap="round" />

            {/* Big pleading puppy eyes (ตาแป๋ว อ้อนวอน แวววาว ไม่มีหัวใจ) 🥺 */}
            {/* Left Eye */}
            <ellipse cx="76" cy="120" rx="9.5" ry="11.5" fill="#2E1F27" />
            <circle cx="73" cy="116" r="4.5" fill="#FFFFFF" />
            <circle cx="79.5" cy="124" r="2.2" fill="#FFFFFF" />
            <circle cx="73" cy="125" r="1.5" fill="#BAE6FD" opacity="0.8" />

            {/* Right Eye */}
            <ellipse cx="114" cy="120" rx="9.5" ry="11.5" fill="#2E1F27" />
            <circle cx="111" cy="116" r="4.5" fill="#FFFFFF" />
            <circle cx="117.5" cy="124" r="2.2" fill="#FFFFFF" />
            <circle cx="111" cy="125" r="1.5" fill="#BAE6FD" opacity="0.8" />

            {/* Rosy glowing blush cheeks */}
            <ellipse cx="58" cy="132" rx="13" ry="8" fill="#FB7185" opacity="0.8" />
            <ellipse cx="132" cy="132" rx="13" ry="8" fill="#FB7185" opacity="0.8" />
            <path d="M 54 130 L 62 134" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M 128 130 L 136 134" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

            {/* Tiny cute shy cat/bunny mouth (ω shape - หน้าอ้อน) */}
            <path d="M 90 131 Q 95 136 100 131 Q 105 136 110 131" fill="none" stroke="#524450" strokeWidth="2.5" strokeLinecap="round" />

            {/* Adorable paws held up together in front of chin pleading (มืออ้อน) */}
            <g transform="translate(86, 144)">
              <ellipse cx="6" cy="10" rx="8" ry="7" fill="#FFFFFF" stroke="#685D66" strokeWidth="3" />
              <ellipse cx="22" cy="10" rx="8" ry="7" fill="#FFFFFF" stroke="#685D66" strokeWidth="3" />
              {/* Little pink paw pads */}
              <circle cx="6" cy="10" r="3" fill="#FFD1DC" />
              <circle cx="22" cy="10" r="3" fill="#FFD1DC" />
            </g>

            {/* Cute twinkling sparkles (NO hearts) */}
            <path d="M 40 92 Q 44 92 44 88 Q 44 92 48 92 Q 44 92 44 96 Q 44 92 40 92 Z" fill="#FBBF24" />
            <path d="M 152 98 Q 156 98 156 94 Q 156 98 160 98 Q 156 98 156 102 Q 156 98 152 98 Z" fill="#FBBF24" />
          </svg>
        </motion.div>
      );

    case 'dodge1':
      // Tilted whistling duck-kiss mouth 😗 - Solid and never disappearing
      return (
        <motion.div
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center opacity-100 ${className}`}
        >
          <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-md">
            <text x="156" y="70" fill="#E67E22" fontFamily="'Mali', cursive" fontSize="26" fontWeight="bold">?</text>
            <path d="M 64 95 C 48 45, 76 40, 84 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 94 95 C 104 48, 134 50, 116 95 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 52 148 C 30 115, 60 88, 100 88 C 140 88, 158 115, 136 148 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 70 120 Q 77 114 84 120" fill="none" stroke="#524450" strokeWidth="4.5" strokeLinecap="round" />
            <ellipse cx="106" cy="119" rx="6" ry="8" fill="#524450" />
            <circle cx="104" cy="116" r="2.5" fill="#FFFFFF" />
            <ellipse cx="90" cy="128" rx="5" ry="6" fill="#F78C9A" stroke="#524450" strokeWidth="2" />
            <ellipse cx="62" cy="132" rx="12" ry="7" fill="#F8B4BD" opacity="0.85" />
            <ellipse cx="118" cy="132" rx="12" ry="7" fill="#F8B4BD" opacity="0.85" />
            <line x1="140" y1="135" x2="155" y2="165" stroke="#524450" strokeWidth="3" strokeLinecap="round" />
            <path d="M 132 120 C 128 112, 144 108, 148 118 C 152 128, 142 134, 134 132 Z" fill="#F28E9B" stroke="#524450" strokeWidth="2.5" />
          </svg>
        </motion.div>
      );

    case 'click2':
      // Tearful sad bunny 🥲, drooping flower 🥀
      return (
        <motion.div
          animate={{ y: [0, 3, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center opacity-100 ${className}`}
        >
          <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-md">
            <path d="M 62 100 C 45 60, 68 55, 78 100 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 98 100 C 115 65, 140 68, 122 100 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 52 148 C 30 115, 60 88, 100 88 C 140 88, 158 115, 136 148 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 70 112 Q 77 116 84 113" fill="none" stroke="#524450" strokeWidth="3" strokeLinecap="round" />
            <path d="M 98 113 Q 105 116 112 112" fill="none" stroke="#524450" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="76" cy="122" rx="7" ry="9" fill="#3D323C" />
            <circle cx="74" cy="119" r="3" fill="#FFFFFF" />
            <circle cx="79" cy="125" r="1.5" fill="#7DD3FC" />
            <ellipse cx="106" cy="122" rx="7" ry="9" fill="#3D323C" />
            <circle cx="104" cy="119" r="3" fill="#FFFFFF" />
            <circle cx="109" cy="125" r="1.5" fill="#7DD3FC" />
            <path d="M 86 134 Q 90 128 96 134" fill="none" stroke="#524450" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="64" cy="133" rx="11" ry="6" fill="#F8B4BD" opacity="0.75" />
            <ellipse cx="118" cy="133" rx="11" ry="6" fill="#F8B4BD" opacity="0.75" />
            <line x1="140" y1="145" x2="148" y2="175" stroke="#524450" strokeWidth="3" strokeLinecap="round" />
            <path d="M 134 148 C 128 142, 142 138, 146 148 C 148 156, 138 160, 132 156 Z" fill="#D48B96" stroke="#524450" strokeWidth="2" />
          </svg>
        </motion.div>
      );

    case 'click3':
      // Weeping waterfall tears 😭, raincloud - Bunny stays 100% visible, no fading out!
      return (
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.0, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center opacity-100 ${className}`}
        >
          <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-xl">
            <defs>
              <linearGradient id="streamTears" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            <path d="M 68 46 C 58 46, 54 54, 58 60 C 52 66, 60 74, 68 74 L 136 74 C 144 74, 150 66, 146 58 C 148 50, 138 44, 130 48 C 124 38, 108 38, 100 44 C 94 36, 78 36, 72 44 Z" fill="#64748B" opacity="0.8" />
            <path d="M 58 106 C 35 90, 48 76, 68 98 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 142 106 C 165 90, 152 76, 132 98 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 52 148 C 30 115, 60 88, 100 88 C 140 88, 158 115, 136 148 Z" fill="#FFFFFF" stroke="#685D66" strokeWidth="4" />
            <path d="M 68 116 L 78 121 L 68 126" fill="none" stroke="#334155" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 132 116 L 122 121 L 132 126" fill="none" stroke="#334155" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Constant streaming tears */}
            <path d="M 72 124 C 65 140, 60 170, 68 198 C 76 202, 85 200, 82 182 C 78 160, 80 140, 76 124 Z" fill="url(#streamTears)" />
            <path d="M 128 124 C 135 140, 140 170, 132 198 C 124 202, 115 200, 118 182 C 122 160, 120 140, 124 124 Z" fill="url(#streamTears)" />
            <path d="M 88 134 Q 100 128 112 134 Q 100 152 88 134 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
            <ellipse cx="60" cy="133" rx="10" ry="6" fill="#F8B4BD" opacity="0.6" />
            <ellipse cx="140" cy="133" rx="10" ry="6" fill="#F8B4BD" opacity="0.6" />
          </svg>
        </motion.div>
      );
  }
};
